const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  class: String,
  section: String,
  stream: String,
  phone: String
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
    const requiredFields = ['id', 'name', 'class', 'section', 'stream', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing fields: ' + missingFields.join(', ') })
      };
    }

    const existingStudent = await Student.findOne({ id: data.id });
    if (existingStudent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Student ID already exists' })
      };
    }

    const newStudent = new Student(data);
    await newStudent.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Student added successfully' })
    };
  } catch (err) {
    console.error("Error adding student:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
