// Uppgift2/database.ts
import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

let client: MongoClient | null = null;

export async function getDb() {
  const uri = process.env.DB_CONNECTION_STRING;
  const dbName = process.env.DB_NAME;

  if (!uri) throw new Error('DB_CONNECTION_STRING saknas i .env');
  if (!dbName) throw new Error('DB_NAME saknas i .env');

  if (!client) {
    client = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    await client.connect();
  }

  return client.db(dbName);
}

export async function closeClient() {
  await client?.close();
  client = null;
}
