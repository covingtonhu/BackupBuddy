const express = require('express');
const path = require('path');
const { initDatabase, createBackupJob, getAllBackupJobs } = require('./database');
const { performBackup } = require('./backup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/backup-jobs', async (req, res) => {
    try {
        const { jobName, sourcePath, backupPath } = req.body;

        if (!jobName || !sourcePath || !backupPath) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const job = await createBackupJob(jobName, sourcePath, backupPath);
        res.json(job);
    } catch (error) {
        console.error('Error creating backup job:', error);
        res.status(500).json({ error: 'Failed to create backup job' });
    }
});

app.get('/api/backup-jobs', async (req, res) => {
    try {
        const jobs = await getAllBackupJobs();
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching backup jobs:', error);
        res.status(500).json({ error: 'Failed to fetch backup jobs' });
    }
});

app.post('/api/backup-jobs/:id/run', async (req, res) => {
    try {
        const jobId = req.params.id;
        const jobs = await getAllBackupJobs();
        const job = jobs.find(j => j.id == jobId);

        if (!job) {
            return res.status(404).json({ error: 'Backup job not found' });
        }

        const result = await performBackup(job.id, job.source_path, job.backup_path);
        res.json(result);
    } catch (error) {
        console.error('Error running backup:', error);
        res.status(500).json({ error: 'Failed to run backup' });
    }
});

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});