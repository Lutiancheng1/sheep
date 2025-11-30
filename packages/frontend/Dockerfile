FROM node:20-alpine

WORKDIR /app

# Copy entire monorepo to ensure workspace dependencies are resolved
COPY . .

# Install dependencies
RUN npm ci

# Build frontend
RUN npm run build --workspace=packages/frontend

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start", "--workspace=packages/frontend"]
