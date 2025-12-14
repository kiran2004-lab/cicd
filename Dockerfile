# Use official Node image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable
ENV PORT=3000

# Start app
CMD ["node", "server.js"]
