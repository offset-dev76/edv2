// netlify/functions/getPaymentsBatch.js

const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // shared connection

// Payment schema
const paymentSchema = new mongoose.Schema({
  studentId: String,
  amount: Number,
  date: Date,
  mode: String,
  reference: String,
  appliedToDues: [Number],
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Only POST allowed' }) };
  }

  await connectToDB();
  const { ids } = JSON.parse(event.body);
  if (!Array.isArray(ids) || !ids.length) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'No IDs provided' }) };
  }

  // Fetch all payments for these students
  const payments = await Payment.find({ studentId: { $in: ids } }).lean();

  // Group by studentId
  const paymentsByStudent = ids.reduce((m, id) => {
    m[id] = [];
    return m;
  }, {});
  payments.forEach(p => paymentsByStudent[p.studentId]?.push(p));

  // Also return the raw dues array so the frontend can reuse it in addPayment
  // (you may want to fetch dues here too if not already loaded)
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: { paymentsByStudent }
    }),
  };
};
