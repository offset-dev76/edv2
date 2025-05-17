const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // adjust path as needed

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

const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [String],
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
    const { studentId, amount, date, mode, reference, payments } = data;

    if (
      !studentId ||
      !amount ||
      !date ||
      !mode ||
      !Array.isArray(payments) ||
      payments.length === 0 ||
      !payments.every(p => p.note && typeof p.amountPaid === 'number' && p.amountPaid > 0)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing or invalid required fields' }),
      };
    }

    await connectToDB();

    const updateOps = payments.map(({ note, amountPaid }) =>
      Student.updateOne(
        { id: studentId },
        { $inc: { "dues.$[elem].dueAmount": -amountPaid } },
        { arrayFilters: [{ "elem.note": note }] }
      )
    );

    updateOps.push(
      Student.updateOne(
        { id: studentId },
        { $pull: { dues: { dueAmount: { $lte: 0 } } } }
      )
    );

    const paymentCreate = Payment.create({
      studentId,
      amount: parseFloat(amount),
      date: new Date(date),
      mode,
      reference: reference || null,
      appliedToDues: payments.map(p => p.note),
    });

    await Promise.all([...updateOps, paymentCreate]);

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
