import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/firebase';
import { toast } from 'sonner';
import FcmToast from '@/Components/FcmToast';
import axios from 'axios';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useFCM({ onNotification } = {}) {
    const tokenSentRef = useRef(false);

    useEffect(() => {
        let unsubscribe = null;

        const init = async () => {
            const messaging = await getFirebaseMessaging();
            if (!messaging) return;

            const registration = await navigator.serviceWorker.register(
                '/firebase-messaging-sw.js',
                { scope: '/' }
            );

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            let token;
            try {
                token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration,
                });
            } catch (err) {
                console.error('[FCM] Gagal ambil token:', err);
                return;
            }

            if (token && !tokenSentRef.current) {
                tokenSentRef.current = true;
                axios.post(route('fcm.update-token'), { token }).catch(console.error);
            }

            unsubscribe = onMessage(messaging, (payload) => {
                const title = payload.notification?.title ?? 'SILAB';
                const body  = payload.notification?.body  ?? '';
                const url   = payload.data?.url ?? '/dashboard';

                if (onNotification) {
                    onNotification({ title, body, data: payload.data ?? {} });
                    return;
                }

                toast.custom((id) => (
                    <FcmToast
                        title={title}
                        body={body}
                        url={url}
                        onDismiss={() => toast.dismiss(id)}
                    />
                ), { duration: 6000 });

                // Update bell badge tanpa Inertia reload (reload = clear toast)
                window.dispatchEvent(new CustomEvent('silab:new-notif'));
            });
        };

        if ('Notification' in window && 'serviceWorker' in navigator) {
            init().catch(console.error);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);
}
