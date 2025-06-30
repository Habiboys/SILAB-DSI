FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    nginx

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy .env file first
COPY .env .env

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install Composer dependencies
RUN composer install --no-dev --no-scripts --no-autoloader

# Copy package.json files
COPY package*.json ./

# Install NPM dependencies
RUN npm install

# Create storage directory structure first
RUN mkdir -p storage/app/public/kepengurusan_lab/sk \
    && mkdir -p storage/app/public/proker \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/logs \
    && mkdir -p public/storage

# Copy application code
COPY . .

# Create storage link before running any Laravel commands
RUN php artisan storage:link

# Complete composer installation
RUN composer dump-autoload --optimize

# Handle .env file
RUN if [ ! -f .env ]; then \
        cp .env.example .env; \
    fi

# Generate application key
RUN php artisan key:generate

# Build assets
RUN npm run build

# Copy nginx configuration
COPY docker/nginx/app.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default
RUN ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/public/storage

# Create startup script
RUN echo '#!/bin/bash\n\
# Ensure storage directory permissions\n\
chown -R www-data:www-data /var/www/html/storage\n\
chmod -R 775 /var/www/html/storage\n\
chown -R www-data:www-data /var/www/html/public/storage\n\
chmod -R 775 /var/www/html/public/storage\n\
\n\
# Start PHP-FPM in background\n\
php-fpm -D\n\
\n\
# Start Nginx in foreground\n\
nginx -g "daemon off;"\n\
' > /start.sh

RUN chmod +x /start.sh

# Expose port 8000
EXPOSE 8000

# Start services
CMD ["/start.sh"]