#!/bin/bash

# Prefer IPv4 for host.docker.internal (Docker Desktop often adds an
# unreachable IPv6 AAAA that makes MySQL "Network is unreachable").
if grep -q 'host.docker.internal' /etc/hosts; then
    IPV4=$(grep 'host.docker.internal' /etc/hosts | grep -v ':' | awk '{print $1}' | head -n1)
    if [ -n "$IPV4" ]; then
        sed -i '/host.docker.internal/d' /etc/hosts
        echo "$IPV4 host.docker.internal" >> /etc/hosts
    fi
fi

# Ensure storage directories exist
mkdir -p /var/www/html/storage/app/public
mkdir -p /var/www/html/storage/framework/cache
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Fix permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Create storage link if not exists
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link
fi

# Run migrations (non-fatal so container still boots if DB is temporarily unavailable)
php /var/www/html/artisan migrate --force || true

# Start Supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
