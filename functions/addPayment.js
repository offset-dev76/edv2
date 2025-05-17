// netlify/functions/addPayment.js

const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // shared persistent connection

// Student schema (with embedded dues)
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    }
  ],
});

// Payment schema
const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [Number], // indices from frontend
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Only POST allowed' }) };
  }

  const { studentId, amount, date, mode, reference, selectedDues } = JSON.parse(event.body);
  if (!studentId || !amount || !date || !mode || !Array.isArray(selectedDues)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid input' }) };
  }

  await connectToDB();

  // STEP 1: Get the dues array once
  const { dues } = await Student.findOne({ id: studentId }, { dues: 1 }).lean() || {};
  if (!dues) {
    return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Student not found' }) };
  }

  let remaining = parseFloat(amount);
  const bulkOps = [];

  // STEP 2: Build one $inc per selected due index
  for (const idx of selectedDues) {
    if (remaining <= 0) break;
    const d = dues[idx];
    if (!d) continue;
    const payAmt = Math.min(d.dueAmount, remaining);
    remaining -= payAmt;

    bulkOps.push({
      updateOne: {
        filter: { id: studentId },
        update: { $inc: { [`dues.${idx}.dueAmount`]: -payAmt } }
      }
    });
  }

  // STEP 3: Pull out any dues now ≤ 0
  bulkOps.push({
    updateOne: {
      filter: { id: studentId },
      update: { $pull: { dues: { dueAmount: { $lte: 0 } } } }
    }
  });

  // STEP 4: Execute batch update if needed
  if (bulkOps.length) {
    await Student.bulkWrite(bulkOps);
  }

  // STEP 5: Record the payment
  await Payment.create({
    studentId,
    amount: parseFloat(amount),
    date: new Date(date),
    mode,
    reference: reference || null,
    appliedToDues: selectedDues,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Payment recorded successfully' }),
  };
};
