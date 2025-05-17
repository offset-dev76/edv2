// utils/db.js
const mongoose = require('mongoose');

const uri = 'mongodb+srv://adityajayaram2468:Adityajrm1124@cluster0.gkmgrrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: 'schoolDB',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectToDB;
