const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Subject mapping (formula table)
const subjectMap = {
  '10-A': ['English', 'Science', 'Maths'],
  '11-A-Commerce': ['Commerce', 'Business Studies', 'Accountancy'],
  '11-A-Science': ['Physics', 'Chemistry', 'Maths', 'Biology'],
  // Add more mappings as needed
};

const markSchema = new mongoose.Schema({
  RollNo: String,
  Name: String,
  Class: String,
  Section: String,
  Stream: String,   // Optional for classes 1–10
  Exam: String,
  sub1: Number,
  sub2: Number,
  sub3: Number,
  sub4: Number,
  sub5: Number,
  sub6: Number,
  sub7: Number,
  sub8: Number
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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();
    const data = JSON.parse(event.body);

    const { RollNo, Name, Class, Section, Stream = '', Exam, marks } = data;

    if (!RollNo || !Name || !Class || !Section || !Exam || !marks || typeof marks !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields or invalid data structure' })
      };
    }

    const key = Class >= '11' ? `${Class}-${Section}-${Stream}` : `${Class}-${Section}`;
    const subjects = subjectMap[key];

    if (!subjects || subjects.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `No subject mapping found for class-section-stream: ${key}` })
      };
    }

    const markEntry = {
      RollNo,
      Name,
      Class,
      Section,
      Stream,
      Exam
    };

    // Assign subject marks to sub1, sub2, ..., sub8
    subjects.forEach((subject, index) => {
      const subKey = `sub${index + 1}`;
      markEntry[subKey] = marks[subject] ?? null;
    });

    // Fill remaining subs with null
    for (let i = subjects.length + 1; i <= 8; i++) {
      markEntry[`sub${i}`] = null;
    }

    await new Mark(markEntry).save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Marks saved successfully' })
    };
  } catch (err) {
    console.error('Error saving marks:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' })
    };
  }
};
