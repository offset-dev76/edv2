const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // Adjust path if needed

// Define schema
const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [String], // use String if you're using 'note' as identifier
});

// Register model if not already
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' }),
    };
  }

  try {
    await connectToDB();

    const { ids } = JSON.parse(event.body);

    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'No student IDs provided' }),
      };
    }

    const payments = await Payment.find({ studentId: { $in: ids } }).lean();

    // Group payments by studentId
    const paymentsByStudent = ids.reduce((acc, id) => {
      acc[id] = [];
      return acc;
    }, {});

    for (const payment of payments) {
      if (!paymentsByStudent[payment.studentId]) {
        paymentsByStudent[payment.studentId] = [];
      }
      paymentsByStudent[payment.studentId].push(payment);
    }

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingFees = ids.length * 1000 - totalPayments; // Simplified fee logic, adjust accordingly

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          totalPayments,
          pendingFees,
          paymentsByStudent
        }
      }),
    };
  } catch (err) {
    console.error("getPaymentsBatch Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
    };
  }
};
