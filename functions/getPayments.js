const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // Adjust path if needed

// Payment Schema
const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [String],
});

// Avoid recompilation of model
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  const id = event.queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Student ID is required' }),
    };
  }

  try {
    await connectToDB();

    const payments = await Payment.find({ studentId: id }).sort({ date: -1 }).lean();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: payments }),
    };
  } catch (err) {
    console.error("getPayments Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
    };
  }
};
