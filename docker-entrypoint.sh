#!/bin/bash
set -e

chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

php artisan storage:link || true

php artisan optimize

nginx -g 'daemon off;' &

php-fpm
