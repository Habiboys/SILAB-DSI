<?php

namespace App\Console\Commands;

use App\Models\Absensi;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PrivatizeAttendancePhotos extends Command
{
    protected $signature = 'piket:privatize-photos {--execute : Salin, verifikasi checksum, dan hapus salinan publik}';

    protected $description = 'Pindahkan foto absensi lama ke storage privat';

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $seen = [];
        $moved = 0;
        $failed = 0;

        Absensi::query()->select(['id', 'foto_checkin', 'foto_checkout'])->chunkById(200, function ($records) use ($public, $private, &$seen, &$moved, &$failed) {
            foreach ($records as $record) {
                foreach ([$record->foto_checkin, $record->foto_checkout] as $path) {
                    if (!$path || $path === 'manual_input' || isset($seen[$path])) continue;
                    $seen[$path] = true;
                    if (str_contains($path, '..') || str_starts_with($path, '/') || str_contains($path, '\\')) {
                        $this->error("Path foto tidak aman: {$path}");
                        $failed++;
                        continue;
                    }
                    if (!$public->exists($path)) continue;
                    if (!$this->option('execute')) {
                        $moved++;
                        continue;
                    }

                    try {
                        $sourceHash = hash_file('sha256', $public->path($path));
                        if (!$private->exists($path)) {
                            $stream = $public->readStream($path);
                            if ($stream === false) throw new \RuntimeException('Foto sumber tidak dapat dibaca.');
                            try {
                                if (!$private->put($path, $stream)) throw new \RuntimeException('Foto privat gagal disimpan.');
                            } finally {
                                fclose($stream);
                            }
                        }
                        if ($sourceHash !== hash_file('sha256', $private->path($path))) {
                            throw new \RuntimeException('Checksum salinan tidak cocok.');
                        }
                        if (!$public->delete($path)) throw new \RuntimeException('Salinan publik gagal dihapus.');
                        $moved++;
                    } catch (\Throwable $e) {
                        $this->error("{$path}: {$e->getMessage()}");
                        $failed++;
                    }
                }
            }
        });

        $this->info($this->option('execute')
            ? "Foto dipindahkan: {$moved}; gagal: {$failed}."
            : "Foto publik yang akan dipindahkan: {$moved}; path bermasalah: {$failed}. Jalankan ulang dengan --execute.");

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
