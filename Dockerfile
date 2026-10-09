FROM node:22-bookworm-slim AS frontend

WORKDIR /build

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 \
    --fetch-timeout=300000

COPY resources ./resources
COPY public ./public
COPY vite.config.js ./

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_KEY
RUN npm run build

FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip
RUN printf 'post_max_size=30M\nupload_max_filesize=30M\nmemory_limit=512M\n' > /usr/local/etc/php/conf.d/silab-face-capture.ini

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install Composer dependencies
RUN composer install --no-dev --no-scripts --no-autoloader

# Create storage directory structure first
RUN mkdir -p storage/app/public/kepengurusan_lab/sk \
    && mkdir -p storage/app/public/proker \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache

# Copy application code
COPY . .

# Complete composer installation
RUN composer dump-autoload --optimize

# Link public uploads to the storage directory mounted by Compose
RUN ln -s /var/www/html/storage/app/public /var/www/html/public/storage

# Remove hosting-specific open_basedir that breaks Docker paths
RUN rm -f public/.user.ini

# Copy only the compiled frontend from the disposable Node build stage.
COPY --from=frontend /build/public/build ./public/build

# Copy nginx configuration
COPY docker/nginx/app.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default
RUN ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/public/storage

# Setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

# Start services via entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
