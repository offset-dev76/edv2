const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

exports.handler = async (event) => {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("test");
    const collection = db.collection("marks");

    const grade = event.queryStringParameters.grade;
    const stream = event.queryStringParameters.stream || "";

    const results = await collection.find({ grade, stream }).toArray();
    client.close();

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    console.error("Error fetching marks:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch marks" }),
    };
  }
};
