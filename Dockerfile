FROM node:25-alpine

# Set working directory
WORKDIR /app

# Copy package.json only for caching
COPY package*.json ./

# Install all dependencies (dev + prod) needed for build
RUN npm ci --ignore-scripts --no-audit --progress=false

# Copy source code
COPY . .

# Build NestJS
RUN npm run build

# Start app
CMD ["node", "dist/main.js"]
