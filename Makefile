# Logo Gallery Project Makefile

# Configuration
CONTAINER_NAME = slogos-dev
DEV_PORT = 5006

# Auto-detect container runtime (docker or podman)
CONTAINER_RUNTIME := $(shell \
	if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then \
		echo "docker"; \
	elif command -v podman >/dev/null 2>&1; then \
		echo "podman"; \
	else \
		echo "none"; \
	fi)

COMPOSEFILE = compose.dev.yml
# Set compose command based on runtime
ifeq ($(CONTAINER_RUNTIME),docker)
	DOCKER_COMPOSE ?= docker compose -f $(COMPOSEFILE)
else ifeq ($(CONTAINER_RUNTIME),podman)
	DOCKER_COMPOSE ?= podman-compose -f $(COMPOSEFILE)
else
	$(error No container runtime found. Please install docker or podman)
endif


# Main targets
.PHONY: all build start stop restart logs clean update-data dev rebuild favicon build-with-favicons generate-svg-variants pwa-cache-list run update-lock

all: build start

dev: pwa-cache-list
	$(DOCKER_COMPOSE)  up --build

build:
	@echo "Building the Logo Gallery container..."
	$(DOCKER_COMPOSE)  build

# Start the application in the background
start: pwa-cache-list
	@echo "Starting Logo Gallery application on port $(DEV_PORT)..."
	$(DOCKER_COMPOSE)  up -d
	@echo "Application is running at http://localhost:$(DEV_PORT)"

# Stop the application
stop:
	@echo "Stopping Logo Gallery application..."
	$(DOCKER_COMPOSE)  down

# Restart the application
restart: stop start

# View the application logs
logs:
	@echo "Showing application logs (press Ctrl+C to exit)..."
	$(DOCKER_COMPOSE)  logs -f

# Run a command inside the container
# Usage: make run CMD="npm run build"
run:
	@echo "Running command in container: $(CMD)"
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) $(CMD)

exec:
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) $(CMD)

update-data:
	@echo "Scanning logos directory and updating logos.json for development..."
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) npm run update-data
	@echo "Logos and Flags have been updated - refresh the browser to see changes"

# Clean up build artifacts and temporary files
clean:
	@echo "Cleaning up build artifacts and temporary files..."
	$(DOCKER_COMPOSE)  down
	docker builder prune -f

# Complete rebuild from scratch
rebuild:
	$(DOCKER_COMPOSE)  down -v
	$(DOCKER_COMPOSE)  build --no-cache

# Generate favicons
favicon:
	@echo "Generating favicons..."
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) npm run generate-favicons
	@echo "Favicons have been generated"

# Build with favicons
build-with-favicons: favicon build

# Update package-lock.json by running npm install in Docker
update-lock:
	@echo "Updating package-lock.json to match package.json..."
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) npm install
	@echo "Package lock file has been updated"

# Generate SVG variants with color sets
generate-svg-variants:
	@echo "Generating SVG variants with color sets..."
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) node scripts/generate-svg-variants.js
	@echo "SVG variants have been generated"

# Generate PWA cache list
generate-pwa-cache-list:
	@echo "Generating PWA cache list..."
	$(DOCKER_COMPOSE)  run --rm $(CONTAINER_NAME) npm run pwa-cache-list
