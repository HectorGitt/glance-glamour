# Use Node.js 18 with all required system dependencies
FROM node:18

# Install system dependencies needed for building
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for our application in the container
RUN mkdir -p /usr/src/app

# Set this new directory as our working directory for subsequent instructions
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set the environment variable for the application's port
ENV PORT=8080
ENV NODE_ENV=production

# Build the React app
RUN npm run build

# Install serve globally for production serving (production only)
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 8080

# Serve the 'dist' directory on port 8080 using 'serve'
CMD ["serve", "-s", "-l", "8080", "./dist"]