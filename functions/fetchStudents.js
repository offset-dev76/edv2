const mongoose = require('mongoose');
const connectToDB = require('./utils/db'); // adjust path as needed

// Schema definition
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  language: String,
  parentPhone: String,
  parentEmail: String,
  group: String,
  academicYear: String
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();

    const { grade, section } = JSON.parse(event.body);

    if (!grade) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Grade is required' })
      };
    }

    const filter = { grade };
    if (section) filter.section = section;

    const students = await Student.find(filter).lean(); // faster for read-only

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: students })
    };
  } catch (err) {
    console.error("Error fetching students:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};
