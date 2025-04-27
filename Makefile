# Logo Gallery Project Makefile

# Configuration
DOCKER_COMPOSE = docker compose
CONTAINER_NAME = logo-gallery
PORT = 5005
DEV_PORT = 5006

# Main targets
.PHONY: all build start stop restart logs clean scan-logos-dev help dev

all: build start

# Development mode with hot reloading
dev:
	$(DOCKER_COMPOSE) -f compose.dev.yml up --build

# Build the Docker container
build:
	@echo "Building the Logo Gallery container..."
	$(DOCKER_COMPOSE) build

# Start the application in the background
start:
	@echo "Starting Logo Gallery application on port $(PORT)..."
	$(DOCKER_COMPOSE) up -d
	@echo "Application is running at http://localhost:$(PORT)"

# Stop the application
stop:
	@echo "Stopping Logo Gallery application..."
	$(DOCKER_COMPOSE) down

# Restart the application
restart: stop start

# View the application logs
logs:
	@echo "Showing application logs (press Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f

# Run a command inside the container
# Usage: make run CMD="npm run build"
run:
	@echo "Running command in container: $(CMD)"
	$(DOCKER_COMPOSE) run --rm $(CONTAINER_NAME) $(CMD)

# Scan logos.json from files in the logos directory (for dev mode)
scan-logos-dev:
	@echo "Scanning logos directory and updating logos.json for development..."
	$(DOCKER_COMPOSE) -f compose.dev.yml run --rm logo-gallery-dev npm run scan-logos
	@echo "Logos have been updated - refresh the browser to see changes"

# Clean up build artifacts and temporary files
clean:
	@echo "Cleaning up build artifacts and temporary files..."
	$(DOCKER_COMPOSE) down
	docker builder prune -f

# Complete rebuild from scratch
rebuild:
	@echo "Performing complete rebuild..."
	$(DOCKER_COMPOSE) down
	docker builder prune -f
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d
	@echo "Rebuild complete. Application is running at http://localhost:$(PORT)"

# Display help information
help:
	@echo "Logo Gallery Makefile commands:"
	@echo "  make build          - Build the Docker container"
	@echo "  make start          - Start the application (http://localhost:$(PORT))"
	@echo "  make stop           - Stop the application"
	@echo "  make restart        - Restart the application"
	@echo "  make logs           - View the application logs"
	@echo "  make run CMD=<cmd>  - Run a command in the container"
	@echo "  make scan-logos-dev - Scan logos.json from assets directory"
	@echo "  make clean          - Clean up build artifacts"
	@echo "  make rebuild        - Completely rebuild from scratch"
	@echo "  make help           - Display this help information"
