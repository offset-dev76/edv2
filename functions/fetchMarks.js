const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
    const { grade, exam } = JSON.parse(event.body);

    if (!grade || !exam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Grade and exam are required' })
      };
    }

    const marks = await Mark.find({ grade, exam }).lean();

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
