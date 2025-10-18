const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware 
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xqgbxlh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const db = client.db("jobsPortal");
        const jobsCollection = db.collection('jobs');
        const jobApplications = db.collection('job-applications');

        console.log("✅ Connected to MongoDB");

        // 1️⃣ Get All or HR-specific Jobs 
        app.get('/jobs', async (req, res) => {
            try {
                const email = req.query.email;
                let query = {};
                if (email) query = { hr_email: email };

                const jobs = await jobsCollection.find(query).toArray();
                res.send(jobs);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 2️⃣ Get Job by ID 
        app.get('/jobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
                res.send(job);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 3️⃣ Add Job 
        app.post('/jobs', async (req, res) => {
            try {
                const newJob = req.body;
                const result = await jobsCollection.insertOne(newJob);
                res.status(201).send({ success: true, id: result.insertedId });
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 4️⃣ Get All Applications by User 
        app.get('/job-application', async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { applicant_email: email } : {};
                const apps = await jobApplications.find(query).toArray();
                res.send(apps);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        //  5️⃣ Add Job Application 
        app.post('/job-applications', async (req, res) => {
            try {
                const application = req.body;
                const result = await jobApplications.insertOne(application);
                res.send({ success: true, id: result.insertedId });
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

    } catch (err) {
        console.error(" Error:", err);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send(' Jobs API is running');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
