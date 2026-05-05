import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Patch global fetch agar semua POST/PUT/DELETE otomatis pakai XSRF-TOKEN cookie
// (sama seperti axios) — fix CSRF 419 di balik Cloudflare proxy
const _fetch = window.fetch;
window.fetch = function (url, options = {}) {
    const method = (options.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) {
            options.headers = {
                ...options.headers,
                'X-XSRF-TOKEN': decodeURIComponent(match[1]),
            };
            delete options.headers['X-CSRF-TOKEN'];
        }
    }
    return _fetch(url, options);
};