const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Updated schema for batched marks
const markSchema = new mongoose.Schema({
  RollNo: String,
  Name: String,
  Grade: String,
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

    const { grade, section, exam } = JSON.parse(event.body); // Replace stream with section

    if (!grade || !section || !exam) { // Ensure all required fields are present
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Grade, section, and exam are required' })
      };
    }

    const query = { Grade: grade, Section: section, Exam: exam }; // Update query to use section

    // Fetch batched marks documents
    const marks = await Mark.find(query).lean();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: marks })
    };
  } catch (err) {
    console.error('Error fetching marks:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
