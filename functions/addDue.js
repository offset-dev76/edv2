const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    },
  ],
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' }),
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body);
    const { studentId, dueAmount, dueDate, note } = data;

    if (!dueAmount || !dueDate || !note) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Due amount, due date, and note are required' }),
      };
    }

    // Use `id` instead of `studentId` to query the database
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' }),
      };
    }

    // Add the new due to the dues array
    student.dues.push({ dueAmount, dueDate: new Date(dueDate), note });
    await student.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Due added successfully' }),
    };
  } catch (err) {
    console.error("Error adding due:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};
