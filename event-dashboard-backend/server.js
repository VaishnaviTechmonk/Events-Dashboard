const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
const PORT = 8080;

const uri = 'mongodb+srv://admin:techmonk@cluster0.pxcnhrg.mongodb.net/techmonk?retryWrites=true&w=majority&ssl=true';

// Home route
app.get('/', (req, res) => {
  res.send('✅ Server is working fine. Use /events and /organisations to get data.');
});

// EVENTS route with pagination, organisation filter, and lookup for event name
app.get('/events', async (req, res) => {
  let client;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const orgId = req.query.orgId || '';

  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db('techmonk');
    const collection = db.collection('eventexecutionhistories');

    // Convert orgId to ObjectId if present
    let matchStage = [];
    if (orgId) {
      try {
        matchStage.push({ $match: { organisationId: new ObjectId(orgId) } });
      } catch (e) {
        return res.status(400).json({ error: 'Invalid organisation ID' });
      }
    }

    // Aggregation pipeline
    const pipeline = [
      ...matchStage,
      {
        $group: {
          _id: "$eventId",
          createdAt: { $first: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventData"
        }
      },
      {
        $unwind: {
          path: "$eventData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          eventId: "$_id",
          createdAt: 1,
          eventName: "$eventData.name"
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const events = await collection.aggregate(pipeline).toArray();
    res.json(events);

  } catch (err) {
    console.error('❌ Error fetching events:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) await client.close();
  }
});

// ORGANISATIONS route
app.get('/organisations', async (req, res) => {
  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db('techmonk');
    const collection = db.collection('organisations');

    const data = await collection.find({}, {
      projection: { _id: 1, name: 1 }
    }).toArray();

    res.json(data);

  } catch (err) {
    console.error('❌ Error fetching organisations:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
