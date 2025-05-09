const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Schema for exams
const examSchema = new mongoose.Schema({
  grade: { type: String, index: true }, // Add index for efficient querying
  section: { type: String, index: true }, // Add index for efficient querying
  examName: { type: String, unique: true, index: true }, // Add unique index
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
  if (event.httpMethod !== 'POST') { // Changed from GET to POST
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' }) // Updated message
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body); // Parse the request body
    const { grade, section } = data;

    if (!grade || !section) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Grade and section are required' })
      };
    }

    // Use lean() for faster read operations and project only required fields
    const exams = await Exam.find({ grade, section }, { grade: 1, section: 1, examName: 1, _id: 0 }).lean();

    console.log("Fetched exams:", exams); // Added console log for fetched exams

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: exams })
    };
  } catch (err) {
    console.error('Error fetching exams:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
