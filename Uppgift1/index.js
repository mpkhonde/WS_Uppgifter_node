const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // <-- laddar .env-filen
const { MongoClient, ObjectId } = require('mongodb'); // <-- tar in MongoClient och ObjectId

// Hämtar anslutningsinfo från .env
const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DBNAME || 'test';
if (!uri) throw new Error('MONGO_URI saknas');

// Skapa klient
const client = new MongoClient(uri);

(async () => {
  try {
    // Anslut till MongoDB
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('students');
    console.log('✅ Ansluten till databasen');

    // --- CREATE ---
    // Lägger in två dokument i "students"-collectionen
    const createRes = await col.insertMany([
      { name: 'Moise', course: 'Web Service', grade: 'B', createdAt: new Date() },
      { name: 'Ada',   course: 'Web Service', grade: 'A', createdAt: new Date() }
    ]);
    console.log('➕ CREATE: insertedIds =', Object.values(createRes.insertedIds));

    // --- READ ---
    // Hämtar ett dokument (den första vi nyss skapade)
    const firstId = Object.values(createRes.insertedIds)[0];
    const one = await col.findOne({ _id: firstId });
    console.log('🔎 READ one:', one);

    // Hämtar flera dokument (max 10, sorterade efter tid)
    const all = await col.find({}, { projection: { name: 1, course: 1, grade: 1 } })
                         .sort({ createdAt: -1 })
                         .limit(10)
                         .toArray();
    console.log('📚 READ many (top 10):', all);

    // --- UPDATE ---
    // Uppdaterar Moises betyg till A+
    const updRes = await col.updateOne(
      { name: 'Moise' },
      { $set: { grade: 'A+' }, $currentDate: { updatedAt: true } }
    );
    console.log(`✏️ UPDATE: matched=${updRes.matchedCount}, modified=${updRes.modifiedCount}`);

    // Kollar vad som hände efter uppdateringen
    const afterUpdate = await col.findOne({ name: 'Moise' });
    console.log('🔎 Efter update:', afterUpdate);

    // --- DELETE ---
    // Tar bort Ada från collectionen
    const delRes = await col.deleteOne({ name: 'Ada' });
    console.log(`🗑️ DELETE: deleted=${delRes.deletedCount}`);

    // --- COUNT ---
    // Räknar hur många dokument som är kvar i collectionen
    const count = await col.countDocuments();
    console.log('🔢 Antal dokument kvar i collection:', count);

  } catch (err) {
    console.error('❌ Fel:', err.message);
  } finally {
    // Stänger anslutningen oavsett om det gick bra eller ej
    await client.close();
    console.log('👋 Connection closed');
  }
})();
