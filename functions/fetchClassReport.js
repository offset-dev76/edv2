const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Schema for marks
const markSchema = new mongoose.Schema({
  RollNo: String,
  Name: String,
  Class: String,
  Section: String,
  Stream: String,
  Exam: String,
  Sub1: Number,
  Sub2: Number,
  Sub3: Number,
  Sub4: Number,
  Sub5: Number,
  Sub6: Number,
  Sub7: Number,
  Sub8: Number
});

const Mark = mongoose.models.Mark || mongoose.model('Mark', markSchema);

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

    const { class: grade, section, stream, exam } = JSON.parse(event.body);

    if (!grade || !section || !exam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Class, section, and exam are required' })
      };
    }

    const query = { Class: grade, Section: section, Exam: exam };
    if (stream) query.Stream = stream;

    // Fetch all marks for the specified class, section, and exam
    const marks = await Mark.find(query).lean();

    if (marks.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'No data found for the specified criteria' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: marks })
    };
  } catch (err) {
    console.error('Error fetching class report:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
