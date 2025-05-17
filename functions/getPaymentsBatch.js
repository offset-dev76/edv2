const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cachedDb = null;

async function connectToDB() {
  if (cachedDb) return cachedDb;
  cachedDb = await mongoose.connect(uri, {
    dbName: 'schoolDB',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return cachedDb;
}

// Payment Schema
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

    const grouped = ids.reduce((acc, id) => {
      acc[id] = [];
      return acc;
    }, {});

    for (const payment of payments) {
      if (grouped[payment.studentId]) {
        grouped[payment.studentId].push(payment);
      } else {
        grouped[payment.studentId] = [payment]; // In case payment exists for an ID not in the `ids` list
      }
    }

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingFees = ids.length * 1000 - totalPayments; // Adjust as per real fee structure

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          totalPayments,
          pendingFees,
          paymentsByStudent: grouped
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
