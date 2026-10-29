const mongoose = require('mongoose');
const cacheKey = Symbol.for('nike.mongo.connection');
const cache = globalThis[cacheKey] || (globalThis[cacheKey] = { connection: null, promise: null });
module.exports = async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  if (!cache.promise) cache.promise = mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 }).then(connection => { cache.promise = null; return connection; }).catch(error => { cache.promise = null; throw error; });
  cache.connection = await cache.promise;
  return cache.connection;
};
