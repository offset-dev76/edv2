const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;
async function connectToDB() {
  if (!isConnected) {
    await mongoose.connect(uri, {
      dbName: 'schoolDB',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  }
}

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
  appliedToDues: [String], // changed to String for notes
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

    // payments: array of { note: string, amountPaid: number }
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

    // Prepare parallel update operations for each due's payment
    const updateOps = payments.map(({ note, amountPaid }) =>
      Student.updateOne(
        { id: studentId },
        { $inc: { "dues.$[elem].dueAmount": -amountPaid } },
        { arrayFilters: [{ "elem.note": note }] }
      )
    );

    // Also push an update to remove dues with dueAmount <= 0
    updateOps.push(
      Student.updateOne(
        { id: studentId },
        { $pull: { dues: { dueAmount: { $lte: 0 } } } }
      )
    );

    // Create payment record
    const paymentCreate = Payment.create({
      studentId,
      amount: parseFloat(amount),
      date: new Date(date),
      mode,
      reference: reference || null,
      appliedToDues: payments.map(p => p.note),
    });

    // Run all DB ops concurrently
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
