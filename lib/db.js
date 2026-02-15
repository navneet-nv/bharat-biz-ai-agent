import { MongoClient } from 'mongodb';

// Connection string and database name are read lazily to support build-time imports
// where environment variables might not be present.


let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const MONGO_URL = process.env.MONGO_URL;
    const DB_NAME = process.env.DB_NAME;

    if (!MONGO_URL) {
        console.warn("⚠️ MONGO_URL missing. Using In-Memory Mock Database.");
        // Dynamic import to avoid bundling issues if not needed
        const { getMockDB } = await import('./mock-db');
        const mock = getMockDB();
        cachedClient = mock.client;
        cachedDb = mock.db;
        return mock;
    }

    if (!DB_NAME) {
        throw new Error('Please define the DB_NAME environment variable inside .env');
    }

    const client = new MongoClient(MONGO_URL);

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        cachedClient = client;
        cachedDb = db;

        return { client, db };
    } catch (error) {
        console.warn("⚠️ MongoDB Connection Failed:", error.message);
        console.warn("⚠️ Falling back to In-Memory Mock Database.");
        const { getMockDB } = await import('./mock-db');
        const mock = getMockDB();
        cachedClient = mock.client;
        cachedDb = mock.db;
        return mock;
    }
}

export async function getCollection(collectionName) {
    const { db } = await connectToDatabase();
    return db.collection(collectionName);
}
