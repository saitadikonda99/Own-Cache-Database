# Use the Node.js base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire project
COPY . .

# Expose the Redis-like server port (if applicable)
EXPOSE 6379
# Default command
CMD ["node", "src/server.js"]

