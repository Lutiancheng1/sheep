# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies
RUN npm ci

# Build admin
RUN npm run build --workspace=packages/admin

# Serve Stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
