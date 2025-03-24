document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('backup-form');
    const jobsList = document.getElementById('jobs-list');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const jobData = {
            sourcePath: formData.get('sourcePath'),
            backupPath: formData.get('backupPath'),
            jobName: formData.get('jobName')
        };

        fetch('/api/backup-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            form.reset();
            loadJobs();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create backup job');
        });
    });

    function loadJobs() {
        fetch('/api/backup-jobs')
            .then(response => response.json())
            .then(jobs => {
                if (jobs.length === 0) {
                    jobsList.innerHTML = '<p>No backup jobs yet.</p>';
                } else {
                    jobsList.innerHTML = jobs.map(job => `
                        <div class="job-item">
                            <h3>${job.name}</h3>
                            <p>Source: ${job.source_path}</p>
                            <p>Backup: ${job.backup_path}</p>
                            <p>Status: ${job.status}</p>
                            <p>Files: ${job.file_count || 0}</p>
                            <p>Last backup: ${job.last_backup ? new Date(job.last_backup).toLocaleString() : 'Never'}</p>
                            <button onclick="runBackup(${job.id})" class="run-btn">Run Backup</button>
                        </div>
                    `).join('');
                }
            })
            .catch(error => {
                console.error('Error loading jobs:', error);
            });
    }

    loadJobs();
});

function runBackup(jobId) {
    if (!confirm('Are you sure you want to run this backup?')) {
        return;
    }

    fetch(`/api/backup-jobs/${jobId}/run`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(`Backup completed! ${result.filesCopied}/${result.totalFiles} files copied.`);
        } else {
            alert(`Backup failed: ${result.error}`);
        }
        loadJobs();
    })
    .catch(error => {
        console.error('Error running backup:', error);
        alert('Failed to run backup');
    });
}