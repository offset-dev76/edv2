const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { batch } = JSON.parse(event.body);

    if (!Array.isArray(batch) || batch.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid data format' }),
      };
    }

    await client.connect();
    const db = client.db('schoolDB');
    const collection = db.collection('marks');

    const operations = batch.map((entry) => {
      const { RollNo, Grade, Section, Exam } = entry;

      return {
        updateOne: {
          filter: { RollNo, Grade, Section, Exam },
          update: { $set: entry },
          upsert: true
        }
      };
    });

    const result = await collection.bulkWrite(operations);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Saved ${result.modifiedCount + result.upsertedCount} records successfully.`,
      }),
    };

  } catch (error) {
    console.error("Error saving marks:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  } finally {
    await client.close();
  }
};
