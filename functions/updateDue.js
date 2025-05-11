const mongoose = require("mongoose");

const uri = "mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  dueAmount: Number,
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

    const { studentId, dueAmount } = JSON.parse(event.body);

    if (!studentId || dueAmount === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Student ID and due amount are required" }),
      };
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "Student not found" }),
      };
    }

    student.dueAmount = dueAmount;
    await student.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Due amount updated successfully" }),
    };
  } catch (err) {
    console.error("Error updating due amount:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
};
