FROM node:slim

# Update package index and upgrade packages to reduce vulnerabilities
RUN apt-get update && apt-get upgrade -y

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy all source files except those in .dockerignore
COPY . .

# Create necessary directories for the build
RUN mkdir -p public/build
RUN mkdir -p public/data

# Build the application
RUN npm run build

EXPOSE 5000
EXPOSE 35729

# Start the server
CMD ["npm", "run", "start"]
