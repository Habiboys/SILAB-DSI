<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\MulticastSendReport;
use Kreait\Firebase\Messaging\Notification;

class TestFcmBroadcast extends Command
{
    protected $signature = 'fcm:test
                            {--title=  : Judul notifikasi}
                            {--body=   : Isi notifikasi}';

    protected $description = 'Kirim test FCM ke semua user yang punya token';

    public function __construct(private readonly Messaging $messaging)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $title = $this->option('title') ?: 'Test Notifikasi SILAB';
        $body  = $this->option('body')  ?: 'Ini adalah test push notification dari SILAB.';

        $tokens = User::whereNotNull('fcm_token')
            ->pluck('fcm_token', 'name');

        if ($tokens->isEmpty()) {
            $this->warn('Tidak ada user yang punya FCM token. Pastikan ada user yang sudah login dan allow notifikasi.');
            return self::SUCCESS;
        }

        $this->info("Mengirim ke {$tokens->count()} user...");
        $this->table(['Nama'], $tokens->keys()->map(fn($n) => [$n])->toArray());

        $message = CloudMessage::new()
            ->withNotification(Notification::create($title, $body))
            ->withData(['type' => 'test', 'url' => '/dashboard']);

        /** @var MulticastSendReport $report */
        $report = $this->messaging->sendMulticast($message, $tokens->values()->toArray());

        $this->info("Berhasil: {$report->successes()->count()}");

        if ($report->failures()->count() > 0) {
            $this->warn("Gagal   : {$report->failures()->count()}");
            foreach ($report->failures()->getItems() as $failure) {
                $this->line("  - {$failure->error()->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
