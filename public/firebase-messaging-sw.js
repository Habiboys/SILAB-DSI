importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyBopyokhjvOBdar4FXPQ5E-rVgTp0-Xpvk',
    authDomain: 'silab-66a81.firebaseapp.com',
    projectId: 'silab-66a81',
    storageBucket: 'silab-66a81.firebasestorage.app',
    messagingSenderId: '255896643780',
    appId: '1:255896643780:web:d0d492d9995f519263c191',
});

const messaging = firebase.messaging();

// Handle pesan background (tab tidak aktif / browser minimize)
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {};
    const data = payload.data ?? {};

    self.registration.showNotification(title ?? 'SILAB', {
        body: body ?? '',
        icon: '/images/silab.png',
        data: { url: data.url ?? '/' },
        tag: data.type ?? 'silab-notif',
    });
});

// Klik notifikasi → buka URL dari payload.data.url
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? '/';
    event.waitUntil(clients.openWindow(url));
});
