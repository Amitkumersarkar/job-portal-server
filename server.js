require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { use } = require('react');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
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
        const db = client.db("jobsPortal");
        const jobsCollection = db.collection('jobs');
        const jobApplications = db.collection('job-applications');

        // await client.connect();
        // console.log("Connected to MongoDB");

        // 1 Get all or HR-specific jobs
        app.get('/jobs', async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { hr_email: email } : {};
                const jobs = await jobsCollection.find(query).toArray();
                res.send(jobs);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 2 Get job by ID
        app.get('/jobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
                res.send(job);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 3 Add job
        app.post('/jobs', async (req, res) => {
            try {
                const newJob = req.body;
                const result = await jobsCollection.insertOne(newJob);
                res.status(201).send({ success: true, id: result.insertedId });
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        // 4 Delete a job by ID
        app.delete('/jobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 1) {
                    res.send({ success: true, message: 'Job deleted successfully' });
                } else {
                    res.status(404).send({ success: false, message: 'Job not found' });
                }
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // 5 Job Applications
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

        app.post('/job-applications', async (req, res) => {
            try {
                const application = req.body;
                if (application.job_id && typeof application.job_id !== "string") {
                    application.job_id = application.job_id.toString();
                }
                const result = await jobApplications.insertOne(application);
                res.send({ success: true, id: result.insertedId });
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        app.get('/job-applications/jobs/:job_id', async (req, res) => {
            try {
                const jobId = req.params.job_id;
                const query = { job_id: jobId };
                const applications = await jobApplications.find(query).toArray();
                res.status(200).json(applications);
            } catch (error) {
                console.error('Error fetching job applications:', error);
                res.status(500).json({ message: 'Server error fetching applications' });
            }
        });

        app.delete('/job-applications/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await jobApplications.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 1) {
                    res.send({ success: true, message: 'Application deleted successfully' });
                } else {
                    res.status(404).send({ success: false, message: 'Application not found' });
                }
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

    } catch (err) {
        console.error("Error connecting to DB:", err);
    }
}
run().catch(console.dir);

// Root
app.get('/', (req, res) => {
    res.send('Jobs API is running');
});

app.listen(port, () => {
    console.log(` Server running on http://localhost:${port}`);
});