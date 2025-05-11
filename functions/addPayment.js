const { MongoClient } = require("mongodb");

const client = new MongoClient('mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
const dbName = 'schoolDB';

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);

        if (!data.studentId || !data.amount || !data.date || !data.mode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: "Missing required fields" }),
            };
        }

        await client.connect();
        const db = client.db(dbName);
        const payments = db.collection("payments");

        await payments.insertOne({
            studentId: data.studentId,
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            mode: data.mode,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Payment recorded successfully" }),
        };
    } catch (error) {
        console.error("Add Payment Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Internal Server Error" }),
        };
    } finally {
        await client.close();
    }
};
