const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Schema for exams
const examSchema = new mongoose.Schema({
  Class: String,
  Section: String,
  ExamName: String
});

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();

    const { class: grade, section } = JSON.parse(event.body);

    if (!grade || !section) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Class and section are required' })
      };
    }

    // Fetch exams for the specified class and section
    const exams = await Exam.find({ Class: grade, Section: section }).lean();

    if (exams.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'No exams found for the specified criteria' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: exams.map(exam => ({ name: exam.ExamName })) })
    };
  } catch (err) {
    console.error('Error fetching exams:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
