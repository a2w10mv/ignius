# Base image: official Nginx on Alpine Linux pinned to 1.28 stable line
FROM nginx:1.28-alpine

# Replace default server configuration with our custom reverse proxy configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Document internal container port
EXPOSE 80

# Run Nginx in foreground as PID 1
CMD ["nginx", "-g", "daemon off;"]
