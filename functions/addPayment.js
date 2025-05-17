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
  appliedToDues: [Number],
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

    // Validate input early
    if (!studentId || !amount || !date || !mode || !Array.isArray(selectedDues) || selectedDues.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing or invalid required fields' }),
      };
    }

    await connectToDB();

    // Fetch only dues array for specified student (lean query)
    const student = await Student.findOne({ id: studentId }, { dues: 1 }).lean();
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' }),
      };
    }

    let remainingAmount = parseFloat(amount);
    // Calculate new dues array
    const updatedDues = student.dues.map((due, idx) => {
      if (remainingAmount > 0 && selectedDues.includes(idx)) {
        if (remainingAmount >= due.dueAmount) {
          remainingAmount -= due.dueAmount;
          return null; // Clear this due
        } else {
          return { ...due, dueAmount: due.dueAmount - remainingAmount };
        }
      }
      return due;
    }).filter(due => due !== null);

    // Execute updates in parallel for speed
    await Promise.all([
      Student.updateOne({ id: studentId }, { $set: { dues: updatedDues } }),
      Payment.create({
        studentId,
        amount: parseFloat(amount),
        date: new Date(date),
        mode,
        reference: reference || null,
        appliedToDues: selectedDues,
      }),
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
