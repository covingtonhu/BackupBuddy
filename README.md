# BackupBuddy

A simple file backup tool with web interface and automatic monitoring.

## Features

- Create backup jobs through a web interface
- Manual backup execution
- Automatic file monitoring with change detection
- Simple SQLite database for job management
- Clean and responsive web UI

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and go to `http://localhost:3000`

3. Create backup jobs by specifying:
   - Source directory to backup
   - Destination backup directory
   - Job name

4. Run backups manually or let the automatic monitoring trigger them when files change

## Development

For development with auto-restart:
```bash
npm run dev
```

## How it works

- **Web Interface**: Simple HTML/CSS/JS frontend
- **Database**: SQLite for storing backup job configurations
- **File Monitoring**: Uses chokidar to watch for file changes
- **Backup Logic**: Recursively copies files preserving directory structure

## API Endpoints

- `GET /` - Web interface
- `GET /api/backup-jobs` - List all backup jobs
- `POST /api/backup-jobs` - Create new backup job
- `POST /api/backup-jobs/:id/run` - Run specific backup job

## License

MIT