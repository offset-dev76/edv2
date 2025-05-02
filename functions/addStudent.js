const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  language: String,
  parentPhone: String,
  group: String, // Optional for classes 11 and 12
  academicYear: String,
  parentEmail: String, // Add email field
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
    const requiredFields = ['id', 'name', 'class', 'section', 'language', 'parentPhone', 'parentEmail', 'academicYear']; // Include email and admissionNo
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing fields: ' + missingFields.join(', ') })
      };
    }

    // Validate group for classes 11 and 12
    if ((data.class === '11' || data.class === '12') && !data.group) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Group is required for classes 11 and 12' })
      };
    }

    const existingStudent = await Student.findOne({ id: data.id });
    if (existingStudent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Student ID already exists' })
      };
    }

    const newStudent = new Student({
      id: data.id,
      name: data.name,
      grade: data.class,
      section: data.section,
      language: data.language,
      parentPhone: data.parentPhone,
      parentEmail: data.parentEmail,
      group: data.group,
      academicYear: data.academicYear,
    });
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
