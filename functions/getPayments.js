const { MongoClient } = require("mongodb");

const client = new MongoClient('mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
const dbName = 'schoolDB';

exports.handler = async function (event, context) {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const studentId = event.queryStringParameters.id;

    if (!studentId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Student ID is required" }),
        };
    }

    try {
        await client.connect();
        const db = client.db(dbName);
        const payments = db.collection("payments");

        const results = await payments
            .find({ studentId })
            .sort({ date: -1 })
            .toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error("Get Payments Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Internal Server Error" }),
        };
    } finally {
        await client.close();
    }
};
