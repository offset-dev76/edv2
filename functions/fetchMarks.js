const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  id: String,
  name: String,
  grade: String
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

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only GET requests allowed' })
    };
  }

  const grade = event.queryStringParameters?.grade;
  if (!grade) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Missing grade parameter' })
    };
  }

  try {
    await connectToDB();

    const students = await Student.find({ grade }).select('id name -_id');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, students })
    };
  } catch (err) {
    console.error("Error fetching students:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
