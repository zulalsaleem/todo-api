# ─────────────────────────────────────────
# Base image: Node.js 20 on Alpine Linux
# Alpine = tiny Linux distro
# Only 5MB vs Ubuntu's 80MB!
# Perfect for containers
# ─────────────────────────────────────────
FROM node:20-alpine

# Set working directory inside container
# Like cd /app but creates it if not exists
# All commands below run from /app
WORKDIR /app

# ─────────────────────────────────────────
# COPY package.json FIRST (layer caching!)
# If package.json didn't change:
# npm install layer is CACHED
# Saves 2 minutes on every rebuild!
# ─────────────────────────────────────────
COPY package*.json ./

# Install only production dependencies
# --omit=dev = skip testing libraries
# Smaller image size!
RUN npm install --omit=dev

# ─────────────────────────────────────────
# Now copy rest of code
# This layer re-runs when code changes
# But npm install above is already cached!
# ─────────────────────────────────────────
COPY . .

# Document which port app uses
# This doesn't actually open the port!
# Port mapping happens in docker-compose.yml
EXPOSE 3000

# Command to run when container starts
# Array format is more reliable than string
CMD ["node", "index.js"]