<?php

return [
    /*
     * Path ke file Service Account JSON yang diunduh dari Firebase Console.
     * Simpan file ini di luar public directory, misalnya di storage/app/firebase.json
     * Jangan commit file ini ke git.
     */
    'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase-service-account.json')),

    'project_id' => env('FIREBASE_PROJECT_ID'),
];
