FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    nginx \
    supervisor

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install Composer dependencies
RUN composer install --no-dev --no-scripts --no-autoloader

# Copy package.json files
COPY package*.json ./

# Install NPM dependencies with legacy peer deps to resolve React 19 compatibility
RUN npm install --legacy-peer-deps

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

# Create storage link for file uploads
RUN php artisan storage:link

# Build assets
RUN npm run build

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

EXPOSE 8000

# Start services via entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
