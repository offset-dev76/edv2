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
  appliedToDues: [Number],
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body);
    const { studentId, amount, date, mode, reference, selectedDues } = data;

    if (!studentId || !amount || !date || !mode || !selectedDues || !Array.isArray(selectedDues)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing required fields' }),
      };
    }

    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' }),
      };
    }

    let remainingAmount = parseFloat(amount);
    const updatedDues = student.dues.map((due, index) => {
      if (remainingAmount > 0 && selectedDues.includes(index)) {
        if (remainingAmount >= due.dueAmount) {
          remainingAmount -= due.dueAmount;
          return null; // Remove due
        } else {
          due.dueAmount -= remainingAmount;
          remainingAmount = 0;
        }
      }
      return due;
    }).filter(Boolean); // Remove nulls

    // Run updates in parallel
    await Promise.all([
      Student.updateOne({ id: studentId }, { $set: { dues: updatedDues } }),
      Payment.create({
        studentId,
        amount: parseFloat(amount),
        date: new Date(date),
        mode,
        reference: reference || null,
        appliedToDues: selectedDues,
      })
    ]);

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
