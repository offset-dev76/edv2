const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // Adjust path as needed

// Student Schema
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    }
  ],
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [Number], // storing indexes of dues paid
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const { studentId, amount, date, mode, reference, selectedDues } = JSON.parse(event.body);

    if (
      !studentId ||
      typeof amount !== 'number' && typeof amount !== 'string' ||
      !date ||
      !mode ||
      !Array.isArray(selectedDues)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing or invalid required fields' }),
      };
    }

    await connectToDB();

    // Fetch only dues array (minimal data) to calculate payments
    const student = await Student.findOne({ id: studentId }, { dues: 1 }).lean();
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' }),
      };
    }

    let remaining = parseFloat(amount);
    const ops = [];

    // Build one updateOne per selected due, subtracting pay amount
    for (const idx of selectedDues) {
      if (remaining <= 0) break;
      const due = student.dues[idx];
      if (!due) continue;
      const payAmt = Math.min(due.dueAmount, remaining);
      remaining -= payAmt;

      ops.push({
        updateOne: {
          filter: { id: studentId },
          update:  { $inc: { [`dues.${idx}.dueAmount`]: -payAmt } }
        }
      });
    }

    // Finally, remove any dues that have become zero or negative
    ops.push({
      updateOne: {
        filter: { id: studentId },
        update:  { $pull: { dues: { dueAmount: { $lte: 0 } } } }
      }
    });

    // Execute all due updates in one bulkWrite
    if (ops.length > 0) {
      await Student.bulkWrite(ops);
    }

    // Create the payment record
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
  } catch (err) {
    console.error('Add Payment Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
    };
  }
};
