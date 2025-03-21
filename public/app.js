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