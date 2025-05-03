const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  language: String,
  parentPhone: String,
  group: String,
  academicYear: String,
  parentEmail: String,
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

    const { id } = JSON.parse(event.body);
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Student ID is required' })
      };
    }

    const deletedStudent = await Student.findOneAndDelete({ id });
    if (!deletedStudent) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Student not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Student deleted successfully' })
    };
  } catch (err) {
    console.error("Error deleting student:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
