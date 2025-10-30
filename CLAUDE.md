# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Svelte-based logo gallery and quiz game application that displays company/brand logos and provides interactive games like flag quizzes. The project uses Docker for development and deploys to GitHub Pages.

## Development Commands

### Docker-based Development (Recommended)
- `make dev` - Start development server with live reload at http://localhost:5006
- `make build` - Build the Docker container
- `make start` - Start application in background
- `make stop` - Stop the application
- `make restart` - Restart the application
- `make logs` - View application logs
- `make run CMD="command"` - Run any command inside the container

### Data Management
- `make update-data` - Scan logos directory and regenerate data files
- `npm run update-data` - Same as above, but run directly (inside container)

### Asset Generation
- `make favicon` - Generate favicon variants
- `npm run generate-variants` - Generate SVG color variants
- `npm run generate-favicons` - Generate favicon files
- `npm run pwa-cache-list` - Generate PWA cache manifest

### Build Commands
- `npm run build` - Build production bundle using Rollup
- `npm run dev` - Development build with live reload
- `npm start` - Start sirv server on port 5006

## Architecture

### Tech Stack
- **Frontend**: Svelte 3.59.2 with SPA routing
- **Bundler**: Rollup with plugins for Svelte, CSS, and minification
- **Routing**: svelte-spa-router for single-page navigation
- **Styling**: CSS with theme support (light/dark/system)
- **Development**: Docker with live reload

### Key Application Structure

#### Main App (`src/App.svelte`)
- Central state management through `window.appData` global object
- Handles routing, theme management, and data collection switching
- Manages search, filtering (tags, brands, variants), and view modes
- Supports multiple collections (logos, flags) via dynamic data loading

#### Pages (`src/pages/`)
- `Home.svelte` - Main logo gallery with grid/list/compact views
- `Game.svelte` - Game selection landing page
- `FlagQuiz.svelte` - Flag identification quiz with adaptive learning
- `CapitalsQuiz.svelte` - Country capitals quiz
- `GeographyQuiz.svelte` - Geography-based quiz game
- `Preview.svelte` - Individual logo preview modal

#### Components (`src/components/`)
- `CardFull.svelte` - Full logo display card with actions
- `Header.svelte` - Navigation and search interface
- `Actions.svelte` - Action buttons for copy/download
- `Achievements.svelte` - Quiz achievement system
- Various card sizes (`CardSmall`, `CardMiddle`) for different views

#### Data Flow
- Logo data loaded from JSON files in `public/data/` (logos.json, flags.json)
- Collections switchable via dropdown, stored in localStorage
- Global state shared via `window.appData` object
- Theme persistence with system preference detection
- URL-based state for search/filter sharing

### Key Features

#### Multi-Collection Support
- Supports different data collections (logos, flags)
- Collection switching triggers data reload and state reset
- Each collection has its own data file structure

#### Advanced Filtering
- Text search across name, title, brand, and metadata
- Tag-based filtering with colored tags
- Brand filtering for logo variants
- Variant filtering (different logo styles)
- Compact mode to show unique brands only

#### Theme System
- Light/dark/system theme options
- CSS custom properties for theme switching
- Persistent theme preferences

#### Quiz System
- Adaptive learning algorithms
- Achievement tracking
- Score persistence
- Multiple quiz types with shared logic in `src/quizLogic/`

## File Structure Conventions

### Static Assets
- `public/logos/` - Logo files (SVG, PNG)
- `public/data/` - JSON data files generated from asset scanning
- `public/build/` - Compiled JS/CSS output (generated)

### Scripts (`scripts/`)
- `update-data.js` - Scans asset directories and generates JSON manifests
- `generate-svg-variants.js` - Creates color variants of SVG logos
- `generate-favicons.js` - Generates favicon files from source images
- `cleanup_worldmap.py` - SVG cleanup utilities

### Development Files
- `rollup.config.js` - Bundler configuration with dev/prod modes
- `Makefile` - Docker development commands
- `compose.dev.yml` - Docker Compose configuration
- `Dockerfile.dev` - Development container setup

## Development Workflow

1. **Adding New Logos**: Place files in `public/logos/`, run `make update-data`
2. **UI Changes**: Edit Svelte files in `src/`, changes auto-reload in dev mode
3. **Asset Changes**: Regenerate variants with `npm run generate-variants`
4. **Deployment**: Push to `main` branch triggers automatic GitHub Pages deployment

## Important Notes

- All development should use Docker containers for consistency
- The app uses a global `window.appData` object for component communication
- Theme changes require CSS custom property updates
- Data files are auto-generated - don't edit JSON files directly
- Quiz logic is modular and shared between different quiz types
- SVG logos support automatic color variant generation