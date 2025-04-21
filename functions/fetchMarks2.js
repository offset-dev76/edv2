const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  try {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    const db = client.db("schoolDB");
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
