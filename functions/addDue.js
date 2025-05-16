const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: String,
  grade: String,
  section: String,
  language: String,
  parentPhone: String,
  parentEmail: String,
  group: String,
  academicYear: String,
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    }
  ], // Changed to array of dues
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

let isConnected = false;

async function connectToDB() {
  if (!isConnected) {
    await mongoose.connect(uri, {
      dbName: 'schoolDB',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Only POST requests allowed' }),
    };
  }

  try {
    await connectToDB();

    const data = JSON.parse(event.body);
    const { studentId, dueAmount, dueDate, grade, section, note } = data;

    if (!dueAmount || !dueDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Due amount and due date are required' }),
      };
    }

    if (studentId) {
      // Update a single student
      const student = await Student.findOne({ id: studentId }); // Changed from studentId to id
      if (!student) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Student not found' }),
        };
      }
      student.dues.push({ dueAmount, dueDate: new Date(dueDate), note: note || null }); // Append new due
      await student.save();
    } else {
      // Bulk update for a specific class and section
      if (!grade) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Class is required for bulk updates' }),
        };
      }

      const filter = { grade };
      if (section) {
        filter.section = section;
      }

      const students = await Student.find(filter);
      for (const student of students) {
        student.dues.push({ dueAmount, dueDate: new Date(dueDate), note: note || null }); // Append new due
        await student.save();
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Due added successfully' }),
    };
  } catch (err) {
    console.error("Error adding due:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};
