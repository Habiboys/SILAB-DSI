export function firstMessage(value) {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.map(firstMessage).find(Boolean) || '';
    if (value && typeof value === 'object') return Object.values(value).map(firstMessage).find(Boolean) || '';
    return '';
}

export function flashNotification(flash = {}) {
    for (const [key, type] of [['error', 'error'], ['warning', 'warning'], ['success', 'success'], ['message', 'success']]) {
        const message = firstMessage(flash[key]);
        if (message) return { type, message };
    }
    return null;
}

export function installNotifications(router, toast, initialPage) {
    const shown = new Set();
    let mutation = false;
    let responseNotified = false;

    const showFlash = (page) => {
        const flash = page?.props?.flash;
        const notification = flashNotification(flash);
        if (!notification) return false;
        const id = flash.id || `${page.url}:${JSON.stringify(flash)}`;
        if (!shown.has(id)) {
            shown.add(id);
            toast[notification.type](notification.message);
        }
        return true;
    };

    const remove = [
        router.on('start', (event) => {
            mutation = event.detail.visit.method.toLowerCase() !== 'get';
            responseNotified = false;
        }),
        router.on('navigate', (event) => {
            responseNotified = showFlash(event.detail.page);
        }),
        router.on('error', (event) => {
            if (responseNotified) return;
            const message = firstMessage(event.detail.errors);
            if (message) toast.error(message);
            responseNotified = true;
        }),
        router.on('success', (event) => {
            if (!showFlash(event.detail.page) && mutation && !responseNotified) {
                toast.success('Perubahan berhasil disimpan.');
            }
            responseNotified = true;
        }),
    ];
    showFlash(initialPage);
    return () => remove.forEach((dispose) => dispose());
}
