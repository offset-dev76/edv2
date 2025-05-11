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
        const students = db.collection("students");

        const student = await students.findOne({ id: data.studentId });
        if (!student) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: "Student not found" }),
            };
        }

        let remainingAmount = data.amount;
        const updatedDues = student.dues.map((due, index) => {
            if (remainingAmount > 0 && data.selectedDues.includes(index)) {
                if (remainingAmount >= due.dueAmount) {
                    remainingAmount -= due.dueAmount;
                    return null; // Clear this due
                } else {
                    due.dueAmount -= remainingAmount;
                    remainingAmount = 0;
                }
            }
            return due;
        }).filter(due => due !== null); // Remove cleared dues

        await students.updateOne(
            { id: data.studentId },
            { $set: { dues: updatedDues } }
        );

        await payments.insertOne({
            studentId: data.studentId,
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            mode: data.mode,
            reference: data.reference || null,
            appliedToDues: data.selectedDues, // Log which dues were targeted
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
