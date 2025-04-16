const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  const { ids } = JSON.parse(event.body);
  const client = new MongoClient('mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  await client.connect();

  const db = client.db("schoolDB");
  const payments = await db.collection("payments").find({ studentId: { $in: ids } }).toArray();

  const grouped = {};
  ids.forEach(id => grouped[id] = []);
  payments.forEach(p => grouped[p.studentId].push(p));

  await client.close();
  return {
    statusCode: 200,
    body: JSON.stringify(grouped),
  };
};
