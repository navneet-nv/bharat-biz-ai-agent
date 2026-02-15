const { MongoClient } = require('mongodb');

// Try password: @Aocc2771 (encoded as %40Aocc2771)
const uri = "mongodb+srv://Navneet:%40Aocc2771@cluster0.cjth8w5.mongodb.net/?appName=Cluster0";

async function testConnection() {
    console.log('Testing connection with: @Aocc2771 (encoded)...');

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        const db = client.db('bharat_biz_agent');
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        await client.close();
    }
}

testConnection().catch(console.error);
