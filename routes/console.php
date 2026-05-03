<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reminder piket
Schedule::command('piket:send-reminders --tomorrow')->dailyAt('20:00');
Schedule::command('piket:send-reminders')->dailyAt('07:00');

// Reminder pertemuan praktikum hari ini — jam 07:30
Schedule::command('praktikum:send-reminders')->dailyAt('07:30');

// Reminder deadline tugas (H-3, H-1, H-0) — jam 07:00
Schedule::command('tugas:send-deadline-reminders')->dailyAt('07:00');
