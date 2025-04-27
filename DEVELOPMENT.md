# Logo Gallery - Developer Documentation

This document provides instructions for setting up, running, and contributing to the Logo Gallery project.

## Development Environment Setup

### Prerequisites

- Docker and Docker Compose
- Git

No local Node.js installation is required as all operations run inside Docker containers.

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/logos.git
   cd logos
   ```

2. Build and start the application:
   ```
   make build
   make start
   ```

3. Access the application at http://localhost:5005

## Common Development Tasks

### Adding New Logos

1. Add logo files (SVG or PNG preferred) to the `public/logos/` directory
2. Scan the logos directory and update the data file:
   ```
   make scan-logos-dev
   ```
   (This runs `npm run scan-logos` inside the dev container)
3. The application will automatically rebuild with the new logos

### Modifying the UI

1. Edit files in the `src/` directory
2. The changes will require a rebuild:
   ```
   make rebuild
   ```

### Running Custom Commands

To run any npm or shell command inside the Docker container:
```
make run CMD="your-command-here"
```

Examples:
- List logo files: `make run CMD="ls -la public/logos"`
- Run a specific npm script: `make run CMD="npm run some-script"`

## Project Structure

```
logos/
├── public/              # Static assets
│   ├── logos/           # Logo files (SVG, PNG)
│   ├── data/            # JSON data files
│   ├── build/           # Compiled JS/CSS (generated)
│   └── global.css       # Global styles
├── src/                 # Application source code
│   ├── components/      # Svelte components
│   ├── App.svelte       # Main app component
│   └── main.js          # App entry point
├── scripts/             # Utility scripts
├── Dockerfile           # Docker configuration
├── compose.yml          # Docker Compose configuration
├── Makefile             # Development commands
└── README.md            # Project overview
```

## Deployment to GitHub Pages

To deploy the application to GitHub Pages:

1. Build the application:
   ```
   make build
   ```

2. The `public/` directory contains all files needed for deployment

3. Push the contents of the `public/` directory to the `gh-pages` branch of your repository

## Available Make Commands

Run `make help` to see all available commands:

- `make build` - Build the Docker container
- `make start` - Start the application
- `make stop` - Stop the application
- `make restart` - Restart the application
- `make logs` - View the application logs
- `make run CMD=<cmd>` - Run a command in the container
- `make scan-logos-dev` - Scan logos directory and update logos.json
- `make clean` - Clean up build artifacts
- `make rebuild` - Completely rebuild from scratch

## Troubleshooting

If you encounter issues:

1. Check the logs: `make logs`
2. Try a complete rebuild: `make rebuild`
3. Ensure the Docker service is running
4. Verify your logo files are in the correct format and location
