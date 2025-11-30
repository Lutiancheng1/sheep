FROM node:20-alpine

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies
RUN npm ci

# Build backend
RUN npm run build --workspace=packages/backend

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod", "--workspace=packages/backend"]
