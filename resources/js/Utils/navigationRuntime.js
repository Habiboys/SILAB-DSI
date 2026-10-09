import { router } from '@inertiajs/react';
import { matchPage, navigationContext, recordPage, withContext } from './navigation';

let currentPage;
let history = [];
let owner;
const STORAGE_KEY = 'silab.navigation.v1';

export const navigationHistory = () => history;
export const navigationRoutes = () => (typeof Ziggy !== 'undefined' ? Ziggy : globalThis.Ziggy)?.routes || {};

export function rememberPage(page) {
    const nextOwner = page.props?.auth?.user?.id;
    if (owner !== nextOwner) {
        owner = nextOwner;
        history = [];
        try {
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
            const savedCurrent = saved?.history?.at(-1)?.url;
            const initialPath = new URL(page.url, window.location.origin).pathname;
            const savedPath = savedCurrent && new URL(savedCurrent, window.location.origin).pathname;
            const referrer = document.referrer && new URL(document.referrer);
            if (saved?.owner === owner && Array.isArray(saved.history) && (initialPath === savedPath || (referrer?.origin === window.location.origin && referrer.pathname === savedPath))) {
                history = saved.history.filter((entry) => typeof entry?.url === 'string' && entry.context && typeof entry.context === 'object');
            }
        } catch { history = []; }
    }
    currentPage = page;
    if (!nextOwner || !matchPage(page.url, navigationRoutes(), window.location.origin)) history = [];
    else history = recordPage(history, page, window.location.origin);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner, history })); } catch { /* Navigation still works without browser storage. */ }
}

export function installNavigation(initialPage) {
    rememberPage(initialPage);
    router.on('navigate', (event) => rememberPage(event.detail.page));
    router.on('before', (event) => {
        const visit = event.detail.visit;
        if (!currentPage?.props?.auth?.user) return;
        if (visit.method !== 'get') {
            const context = navigationContext(currentPage);
            const previous = [...history].reverse().filter((entry) => entry.url !== currentPage.url
                && !/\/(?:create|edit)(?:\?|$)/.test(entry.url)
                && Object.entries(context).every(([key, value]) => !entry.context[key] || entry.context[key] === value));
            const urls = previous.slice(0, 8).map((entry) => entry.url).filter((url) => url.length < 800);
            if (urls.length) visit.headers['X-Silab-Return-Stack'] = JSON.stringify(urls);
            return;
        }
        const origin = window.location.origin;
        const destination = matchPage(visit.url, navigationRoutes(), origin);
        if (!destination) return;
        visit.url = new URL(withContext(visit.url, navigationContext(currentPage), origin), origin);
    });
}
