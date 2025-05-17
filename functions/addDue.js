const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
  academicYear: String,
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    },
  ],
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
    const data = JSON.parse(event.body);
    const { studentId, dueAmount, dueDate, grade, section, note } = data;

    // 🛑 Early exit for missing data
    if (!dueAmount || !dueDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Due amount and due date are required' }),
      };
    }

    await connectToDB();

    const dueObject = {
      dueAmount,
      dueDate: new Date(dueDate),
      note: note || null,
    };

    if (studentId) {
      // ⚡ Use updateOne instead of find+save for single update
      const result = await Student.updateOne(
        { id: studentId },
        { $push: { dues: dueObject } }
      );

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Student not found' }),
        };
      }
    } else {
      // ⚡ Bulk add dues using updateMany
      if (!grade) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Grade is required for bulk updates' }),
        };
      }

      const filter = { grade };
      if (section) filter.section = section;

      const result = await Student.updateMany(filter, {
        $push: { dues: dueObject },
      });

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'No students found for the given filter' }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Due added successfully' }),
    };
  } catch (err) {
    console.error('Error adding due:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};
