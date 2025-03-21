const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backup_buddy.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS backup_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                source_path TEXT NOT NULL,
                backup_path TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_backup DATETIME,
                file_count INTEGER DEFAULT 0
            )`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

function createBackupJob(name, sourcePath, backupPath) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO backup_jobs (name, source_path, backup_path) VALUES (?, ?, ?)`);
        stmt.run([name, sourcePath, backupPath], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    name,
                    source_path: sourcePath,
                    backup_path: backupPath,
                    status: 'active'
                });
            }
        });
        stmt.finalize();
    });
}

function getAllBackupJobs() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM backup_jobs ORDER BY created_at DESC`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function updateBackupJob(id, updates) {
    return new Promise((resolve, reject) => {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        db.run(`UPDATE backup_jobs SET ${setClause} WHERE id = ?`, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

module.exports = {
    initDatabase,
    createBackupJob,
    getAllBackupJobs,
    updateBackupJob,
    db
};