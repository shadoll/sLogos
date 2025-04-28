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

3. Access the application at http://localhost:5006

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
├── Dockerfile.dev       # Docker configuration for development
├── compose.dev.yml      # Docker Compose configuration for development
├── Makefile             # Development commands
└── README.md            # Project overview
```

## Deployment to GitHub Pages

Deployment is fully automated using GitHub Actions. On every push to the `main` branch:

1. The application is built in a GitHub Actions workflow.
2. The build output and all required static assets are prepared as an artifact.
3. The workflow deploys the site to the `gh-pages` branch using the official GitHub Pages deployment action.
4. If a custom domain is configured, the `CNAME` file is included automatically.

**You do not need to manually build or push anything for deployment.**

To trigger a deployment, simply push your changes to the `main` branch:
```
git add .
git commit -m "Your changes"
git push
```

You can monitor deployment status in the GitHub Actions tab of your repository.

For custom domain setup, ensure your `public/CNAME` file contains your domain and your DNS is configured to point to GitHub Pages.

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
