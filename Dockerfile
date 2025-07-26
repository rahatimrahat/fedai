# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Explicitly install missing types and dependencies that might be causing issues
RUN npm install @types/react@19.1.8 @types/react-dom@19.1.6 csstype@3.1.3

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
