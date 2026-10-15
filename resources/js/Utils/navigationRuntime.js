import { router } from '@inertiajs/react';
import { backDestination, consumeBackHistory, matchPage, navigationContext, recordPage, withContext } from './navigation';

let currentPage;
let history = [];
let owner;
const STORAGE_KEY = 'silab.navigation.v1';

export const navigationHistory = () => history;
export const navigationRoutes = () => (typeof Ziggy !== 'undefined' ? Ziggy : globalThis.Ziggy)?.routes || {};

let backInFlight = false;
function persistHistory() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner, history })); } catch { /* Storage is optional. */ }
}

export function goBack(page, fallback, mode = 'back') {
    if (backInFlight) return;
    const origin = window.location.origin;
    const before = history;
    const destination = backDestination(page, fallback, history, navigationRoutes(), origin, mode);
    if (new URL(destination, origin).href === new URL(page.url, origin).href) return;
    history = consumeBackHistory(history, page, destination, origin);
    persistHistory();
    backInFlight = true;
    let succeeded = false;
    router.visit(destination, {
        replace: true,
        headers: { 'X-Silab-Navigation': 'back' },
        onSuccess: () => { succeeded = true; },
        onFinish: () => {
            if (!succeeded) { history = before; persistHistory(); }
            backInFlight = false;
        },
    });
}

export function rememberPage(page, prune = false) {
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
    else history = recordPage(history, page, window.location.origin, prune);
    persistHistory();
}

export function installNavigation(initialPage) {
    rememberPage(initialPage);
    let traversingBrowserHistory = false;
    window.addEventListener('popstate', () => { traversingBrowserHistory = true; }, true);
    router.on('navigate', (event) => {
        rememberPage(event.detail.page, traversingBrowserHistory);
        traversingBrowserHistory = false;
    });
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
        if (visit.headers?.['X-Silab-Navigation'] === 'back') return;
        const origin = window.location.origin;
        const destination = matchPage(visit.url, navigationRoutes(), origin);
        if (!destination) return;
        visit.url = new URL(withContext(visit.url, navigationContext(currentPage), origin), origin);
    });
}
