const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const examSchema = new mongoose.Schema({
  grade: String,
  section: String,
  examName: { type: String, unique: true },
});

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

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
    const { grade, section, examName } = data;

    if (!grade || !examName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Grade and exam name are required' }),
      };
    }

    const existingExam = await Exam.findOne({ grade, section, examName });
    if (existingExam) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Exam already exists' }),
      };
    }

    const newExam = new Exam({ grade, section, examName });
    await newExam.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Exam added successfully' }),
    };
  } catch (err) {
    console.error("Error adding exam:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};
