const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('BackupBuddy - File Backup Tool');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});