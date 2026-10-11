<?php

namespace Tests\Feature;

use App\Models\{DetailAset, KategoriAset, Laboratorium, User};
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ConcurrentAssetLoanTest extends TestCase
{
    public function test_two_concurrent_borrowers_cannot_reserve_the_same_asset(): void
    {
        $this->artisan('migrate:fresh', ['--force' => true])->assertSuccessful();
        $this->beforeApplicationDestroyed(fn () => RefreshDatabaseState::$migrated = false);
        $lab = Laboratorium::create(['nama' => 'Concurrent audit', 'is_active' => true]);
        $category = KategoriAset::create(['nama' => 'Audit', 'deskripsi' => '']);
        $asset = DetailAset::create(['nama' => 'Concurrent asset', 'kode_barang' => 'CONCURRENT-AUDIT', 'laboratorium_id' => $lab->id,
            'kategori_aset_id' => $category->id, 'foto' => '', 'keadaan' => 'baik', 'status' => 'tersedia']);
        $user = User::factory()->create();
        $run = bin2hex(random_bytes(16));
        $processes = [];
        foreach (['a', 'b'] as $worker) {
            $process = new Process([PHP_BINARY, base_path('tests/Support/audit-concurrent-loan.php'), $run, $worker, $user->id, $asset->id], base_path());
            $process->setTimeout(45);
            $process->start();
            $processes[] = $process;
        }
        $statuses = [];
        foreach ($processes as $process) {
            $process->wait();
            $this->assertTrue($process->isSuccessful(), $process->getErrorOutput().$process->getOutput());
            $statuses[] = json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR)['status'];
        }
        sort($statuses);
        $this->assertSame([302, 422], $statuses);
        $this->assertDatabaseCount('peminjaman_aset', 1);
        $this->assertDatabaseCount('peminjaman_aset_items', 1);
        $this->assertSame('dipinjam', $asset->fresh()->status);
    }
}
