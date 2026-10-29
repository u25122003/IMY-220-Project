import { MongoClient, ObjectId } from 'mongodb';

let client;
let db;

export async function connectDB(uri) {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  db = client.db('PhotoShare');
  return db;
}

export const collection = (name) => db.collection(name);

export const closeDB = () => client?.close();

// Returns an ObjectId, or null if the string is not a valid id
export function toId(id) {
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// Accepts "#a b, c" or ["a", "#b"] and returns ["#a", "#b", "#c"]
export function parseHashtags(input) {
  const list = Array.isArray(input) ? input : String(input || '').split(/[\s,]+/);
  return [...new Set(list
    .map(tag => tag.trim().replace(/^#+/, ''))
    .filter(Boolean)
    .map(tag => `#${tag.toLowerCase()}`))];
}

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
