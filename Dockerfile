# Stage 1: Install Python dependencies
FROM python:3.12-slim AS python-deps

# Set working directory
WORKDIR /app

# Copy Python dependencies
COPY datascience/requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Build the web server
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy static files
COPY index.html ./
COPY style.css ./
COPY script.js ./
COPY additional.css ./
COPY images/ ./images/
COPY paintings/ ./paintings/

# Ensure painting files are readable and list them at build time to catch case/filename issues
RUN chmod -R a+r ./paintings || true
RUN echo "Paintings directory listing:" && ls -la ./paintings || true

# Copy Python scripts and dependencies
COPY --from=python-deps /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY datascience/ ./datascience/

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
