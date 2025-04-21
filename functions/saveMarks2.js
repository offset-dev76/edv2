const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  try {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    const db = client.db("test");
    const collection = db.collection("marks");

    const { grade, stream, marks } = JSON.parse(event.body);

    const bulkOps = marks.map((markEntry) => {
      const updateData = {
        id: markEntry.id,
        name: markEntry.name,
        grade,
        stream: stream || "",
      };

      // Map inputs like sub1, sub2, ...
      for (let i = 1; i <= 8; i++) {
        if (markEntry[`sub${i}`] !== undefined) {
          updateData[`sub${i}`] = markEntry[`sub${i}`];
        }
      }

      return {
        updateOne: {
          filter: { id: markEntry.id, grade, stream: stream || "" },
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    client.close();
    return { statusCode: 200, body: JSON.stringify({ message: "Marks saved!" }) };
  } catch (error) {
    console.error("Error saving marks:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save marks" }) };
  }
};
