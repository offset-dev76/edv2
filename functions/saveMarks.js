const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Updated schema with all expected fields
const markSchema = new mongoose.Schema({
  student: String,
  name: String,
  grade: String,
  exam: String,
  subject: String,
  marks: Number
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

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body);

    // Optionally: Add basic validation
    if (!data.student || !data.exam || !data.subject || typeof data.marks !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid data structure' })
      };
    }

    const newMark = new Mark(data);
    await newMark.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Mark saved successfully' })
    };
  } catch (err) {
    console.error('Error saving mark:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' })
    };
  }
};
