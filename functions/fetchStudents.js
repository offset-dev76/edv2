const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  language: String,
  parentPhone: String,
  parentEmail: String,
  group: String, // Optional for classes 11 and 12
  academicYear: String
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

let isConnected = false;

async function connectToDB() {
  if (!isConnected) {
    await mongoose.connect(uri, {
      dbName: 'schoolDB',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
  }
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body);
    const { grade } = data;

    if (!grade) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Grade criteria not provided' })
      };
    }

    const students = await Student.find({ grade }); // Changed from 'class' to 'grade'

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: students })
    };
  } catch (err) {
    console.error("Error fetching students:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
