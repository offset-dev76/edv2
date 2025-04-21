const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const markSchema = new mongoose.Schema({
  id: String,
  name: String,
  grade: String,
  stream: { type: String, default: "" },
  sub1: Number,
  sub2: Number,
  sub3: Number,
  sub4: Number,
  sub5: Number,
  sub6: Number,
  sub7: Number,
  sub8: Number,
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

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' })
    };
  }

  try {
    await connectToDB();

    const { grade, stream, marks } = JSON.parse(event.body);

    const bulkOps = marks.map((markEntry) => {
      const updateData = {
        id: markEntry.id,
        name: markEntry.name,
        grade,
        stream: stream || "",
      };

      for (let i = 1; i <= 8; i++) {
        if (markEntry[`sub${i}`] !== undefined) {
          updateData[`sub${i}`] = markEntry[`sub${i}`];
        }
      }

      return {
        updateOne: {
          filter: { id: markEntry.id, grade, stream: stream || "" },
          update: { $set: updateData },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await Mark.bulkWrite(bulkOps);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Marks saved successfully" })
    };

  } catch (err) {
    console.error('Error saving marks:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: err.message })
    };
  }
};
