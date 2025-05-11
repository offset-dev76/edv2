const mongoose = require("mongoose");

const uri = "mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  dues: [
    {
      dueAmount: Number,
      dueDate: Date,
      note: String,
    },
  ],
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

let isConnected = false;

async function connectToDB() {
  if (!isConnected) {
    await mongoose.connect(uri, {
      dbName: "schoolDB",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Only POST requests allowed" }),
    };
  }

  try {
    await connectToDB();

    const { studentId, payments } = JSON.parse(event.body);

    if (!studentId || !payments || !Array.isArray(payments)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Student ID and payments are required" }),
      };
    }

    // Use `id` instead of `studentId` to query the database
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "Student not found" }),
      };
    }

    // Deduct payments from the specified dues
    payments.forEach(({ dueIndex, amount }) => {
      if (student.dues[dueIndex]) {
        student.dues[dueIndex].dueAmount = Math.max(0, student.dues[dueIndex].dueAmount - amount);
      }
    });

    await student.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Dues updated successfully" }),
    };
  } catch (err) {
    console.error("Error updating dues:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
};
