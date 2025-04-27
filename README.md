# Logo Gallery

A collection of company and brand logos hosted on GitHub Pages. This project provides an easy way to access and use various brand logos in SVG and PNG formats with a user-friendly interface.

## Features

- Browse logos in grid or list view
- Search functionality to find specific logos
- Copy direct URL to any logo with one click
- Download logos directly
- Responsive design that works on mobile and desktop

## Project Setup

### Running with Docker (Recommended)

The easiest way to run the project locally is using Docker, which doesn't require installing Node.js or npm packages directly on your system:

1. Clone this repository:
```
git clone https://github.com/yourusername/logos.git
cd logos
```

2. Start the Docker container:
```
docker-compose up
```

The application will be available at http://localhost:5000 with live reloading enabled.

### Running Manually (Alternative)

If you prefer to run the project without Docker:

1. Clone this repository:
```
git clone https://github.com/yourusername/logos.git
cd logos
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Build for production deployment:
```
npm run build
```

## Deploying to GitHub Pages

1. Build the project:
```
npm run build
```

2. Push the contents to your GitHub repository's `gh-pages` branch.

## Adding New Logos

To add new logos to the collection:

1. Add the logo file (SVG or PNG) to the `public/logos/` directory
2. Run the logo scan script:
```
make scan-logos-dev
```
(This runs `npm run scan-logos` inside the dev container)
3. The application will automatically rebuild with the new logos

## Directory Structure

```
logos/
├── public/              # Static assets
│   ├── assets/
│   │   └── logos/       # Logo files
│   └── global.css       # Global styles
├── src/                 # Application source code
│   ├── components/      # Svelte components
│   ├── data/            # Data files
│   ├── App.svelte       # Main app component
│   └── main.js          # App entry point
└── index.html           # HTML entry point
```

## License

This project is MIT licensed. Please note that the logos themselves are property of their respective owners and should be used according to their brand guidelines.
