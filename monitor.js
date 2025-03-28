const chokidar = require('chokidar');
const path = require('path');
const { performBackup } = require('./backup');
const { getAllBackupJobs } = require('./database');

class FileMonitor {
    constructor() {
        this.watchers = new Map();
        this.backupTimers = new Map();
        this.BACKUP_DELAY = 30000; // 30 seconds delay to avoid too frequent backups
    }

    async startMonitoring() {
        try {
            const jobs = await getAllBackupJobs();

            for (const job of jobs) {
                if (job.status === 'active') {
                    this.watchDirectory(job);
                }
            }

            console.log(`Started monitoring ${jobs.length} backup jobs`);
        } catch (error) {
            console.error('Error starting file monitoring:', error);
        }
    }

    watchDirectory(job) {
        if (this.watchers.has(job.id)) {
            this.watchers.get(job.id).close();
        }

        const watcher = chokidar.watch(job.source_path, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true
        });

        watcher
            .on('add', path => this.scheduleBackup(job, `File added: ${path}`))
            .on('change', path => this.scheduleBackup(job, `File changed: ${path}`))
            .on('unlink', path => this.scheduleBackup(job, `File removed: ${path}`))
            .on('error', error => console.error(`Watcher error for job ${job.id}:`, error));

        this.watchers.set(job.id, watcher);
        console.log(`Started watching ${job.source_path} for job: ${job.name}`);
    }

    scheduleBackup(job, reason) {
        // Clear existing timer if any
        if (this.backupTimers.has(job.id)) {
            clearTimeout(this.backupTimers.get(job.id));
        }

        // Schedule new backup after delay
        const timer = setTimeout(async () => {
            console.log(`Auto backup triggered for ${job.name}: ${reason}`);

            try {
                const result = await performBackup(job.id, job.source_path, job.backup_path);

                if (result.success) {
                    console.log(`Auto backup completed for ${job.name}: ${result.filesCopied} files`);
                } else {
                    console.error(`Auto backup failed for ${job.name}: ${result.error}`);
                }
            } catch (error) {
                console.error(`Auto backup error for ${job.name}:`, error);
            }

            this.backupTimers.delete(job.id);
        }, this.BACKUP_DELAY);

        this.backupTimers.set(job.id, timer);
    }

    stopWatching(jobId) {
        if (this.watchers.has(jobId)) {
            this.watchers.get(jobId).close();
            this.watchers.delete(jobId);
        }

        if (this.backupTimers.has(jobId)) {
            clearTimeout(this.backupTimers.get(jobId));
            this.backupTimers.delete(jobId);
        }
    }

    stopAll() {
        this.watchers.forEach(watcher => watcher.close());
        this.watchers.clear();

        this.backupTimers.forEach(timer => clearTimeout(timer));
        this.backupTimers.clear();
    }

    addJob(job) {
        if (job.status === 'active') {
            this.watchDirectory(job);
        }
    }
}

module.exports = FileMonitor;