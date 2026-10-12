# Notifikasi aksi

Respons Inertia memakai flash backend (`success`, `error`, `warning`, atau `message`). Penampil bersama di `resources/js/Utils/notifications.js` menampilkan satu toast per respons. ID flash mencegah pesan yang sama ditampilkan ulang oleh event navigasi atau pemulihan riwayat browser.

Callback `onSuccess` dan `onError` halaman mengurus state, modal, dan form. Jangan menambahkan toast respons di callback tersebut atau efek yang membaca flash. Error validasi tetap tampil di field form; penampil bersama mengambil satu error untuk toast.

Jika aksi lama belum mengirim flash, penampil bersama menyediakan pesan sukses umum. Sebaiknya controller mengirim pesan yang menjelaskan hasil aksi.

Request JSON yang tidak melalui Inertia mengurus satu toast sendiri, memakai pesan respons backend. Detail error tambahan dapat ditaruh di `description` toast yang sama. Validasi lokal, kamera, lokasi, clipboard, dan kegagalan jaringan tetap dapat memakai pesan frontend sesuai konteks.

Verifikasi unit: `node tests/notifications.test.mjs`. Regresi browser: `tests/e2e/navigation/notifications.spec.js`.
