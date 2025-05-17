const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // adjust if needed

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
    const data = JSON.parse(event.body);
    const { studentId, amount, date, mode, reference, selectedDues } = data;

    if (!studentId || !amount || !date || !mode || !Array.isArray(selectedDues)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing or invalid required fields' }),
      };
    }

    await connectToDB();

    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' }),
      };
    }

    let remaining = parseFloat(amount);
    const updatedDues = student.dues.map((due, index) => {
      if (remaining > 0 && selectedDues.includes(index)) {
        if (remaining >= due.dueAmount) {
          remaining -= due.dueAmount;
          return null; // fully paid
        } else {
          due.dueAmount -= remaining;
          remaining = 0;
        }
      }
      return due;
    }).filter(due => due !== null); // Remove fully paid dues

    await Student.updateOne({ id: studentId }, { $set: { dues: updatedDues } });

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
