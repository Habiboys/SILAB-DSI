FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    gnupg \
    nano \
    vim \
    less \
    nginx 


# Install Node.js dan NPM
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Verifikasi instalasi Node.js dan npm
RUN node -v && npm -v

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure Nginx
RUN rm /etc/nginx/sites-enabled/default || true
COPY ./docker/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf

# Set working directory
WORKDIR /var/www

# Copy composer.json and package.json
COPY composer.json composer.lock package.json package-lock.json ./

# Copy existing application directory contents
COPY . /var/www

# Generate autoloader and optimize
RUN composer dump-autoload --optimize

COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80
EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
