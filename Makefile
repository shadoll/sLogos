# Logo Gallery Project Makefile

# Configuration
DOCKER_COMPOSE = docker compose
CONTAINER_NAME = logo-gallery
DEV_PORT = 5006

# Main targets
.PHONY: all build start stop restart logs clean scan-logos dev rebuild favicon deps-favicon build-with-favicons sync-packages convert-colors

all: build start

# Development mode with hot reloading
dev:
	$(DOCKER_COMPOSE) -f compose.dev.yml up --build

# Build the Docker container
build:
	@echo "Building the Logo Gallery container..."
	$(DOCKER_COMPOSE) -f compose.dev.yml build

# Start the application in the background
start:
	@echo "Starting Logo Gallery application on port $(DEV_PORT)..."
	$(DOCKER_COMPOSE) -f compose.dev.yml up -d
	@echo "Application is running at http://localhost:$(DEV_PORT)"

# Stop the application
stop:
	@echo "Stopping Logo Gallery application..."
	$(DOCKER_COMPOSE) -f compose.dev.yml down

# Restart the application
restart: stop start

# View the application logs
logs:
	@echo "Showing application logs (press Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) -f compose.dev.yml logs -f

# Run a command inside the container
# Usage: make run CMD="npm run build"
run:
	@echo "Running command in container: $(CMD)"
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm $(CONTAINER_NAME) $(CMD)

# Scan logos.json from files in the logos directory (for dev mode)
scan-logos:
	@echo "Scanning logos directory and updating logos.json for development..."
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm slogos-dev npm run scan-logos
	@echo "Logos have been updated - refresh the browser to see changes"

# Convert logo colors format from array to object
convert-colors:
	@echo "Converting logo colors format in logos.json..."
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm slogos-dev npm run convert-colors
	@echo "Color format conversion complete"

# Clean up build artifacts and temporary files
clean:
	@echo "Cleaning up build artifacts and temporary files..."
	$(DOCKER_COMPOSE) -f compose.dev.yml down
	docker builder prune -f

# Complete rebuild from scratch
rebuild:
	$(DOCKER_COMPOSE) -f compose.dev.yml down -v
	$(DOCKER_COMPOSE) -f compose.dev.yml build --no-cache

# Generate favicons
favicon:
	@echo "Generating favicons..."
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm slogos-dev npm run generate-favicons
	@echo "Favicons have been generated"

# Build with favicons
build-with-favicons: favicon build

# Update package-lock.json by running npm install in Docker
update-lock:
	@echo "Updating package-lock.json to match package.json..."
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm slogos-dev npm install
	@echo "Package lock file has been updated"
