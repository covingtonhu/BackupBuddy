const fs = require('fs').promises;
const path = require('path');
const { updateBackupJob } = require('./database');

async function createBackupDirectory(backupPath) {
    try {
        await fs.mkdir(backupPath, { recursive: true });
        return true;
    } catch (error) {
        console.error('Failed to create backup directory:', error);
        return false;
    }
}

async function copyFile(source, destination) {
    try {
        const destDir = path.dirname(destination);
        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(source, destination);
        return true;
    } catch (error) {
        console.error(`Failed to copy ${source} to ${destination}:`, error);
        return false;
    }
}

async function scanDirectory(dirPath) {
    const files = [];

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                const subFiles = await scanDirectory(fullPath);
                files.push(...subFiles);
            } else {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
}

async function performBackup(jobId, sourcePath, backupPath) {
    try {
        console.log(`Starting backup job ${jobId}: ${sourcePath} -> ${backupPath}`);

        const success = await createBackupDirectory(backupPath);
        if (!success) {
            throw new Error('Failed to create backup directory');
        }

        const files = await scanDirectory(sourcePath);
        console.log(`Found ${files.length} files to backup`);

        let copiedCount = 0;
        for (const file of files) {
            const relativePath = path.relative(sourcePath, file);
            const destPath = path.join(backupPath, relativePath);

            const copied = await copyFile(file, destPath);
            if (copied) {
                copiedCount++;
            }
        }

        await updateBackupJob(jobId, {
            last_backup: new Date().toISOString(),
            file_count: copiedCount,
            status: 'completed'
        });

        console.log(`Backup completed: ${copiedCount}/${files.length} files copied`);
        return { success: true, filesCopied: copiedCount, totalFiles: files.length };

    } catch (error) {
        console.error(`Backup failed for job ${jobId}:`, error);

        await updateBackupJob(jobId, {
            status: 'failed'
        });

        return { success: false, error: error.message };
    }
}

module.exports = {
    performBackup,
    scanDirectory
};