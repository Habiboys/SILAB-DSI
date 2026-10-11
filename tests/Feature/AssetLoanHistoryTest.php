<?php

namespace Tests\Feature;

use App\Models\{DetailAset, KategoriAset, Laboratorium, PeminjamanAset, PeminjamanAsetItem, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetLoanHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_asset_history_returns_current_and_returned_loans_for_that_asset(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $lab = Laboratorium::create(['nama' => 'Loan history', 'is_active' => true]);
        $category = KategoriAset::create(['nama' => 'History', 'deskripsi' => 'Audit']);
        $asset = DetailAset::create(['nama' => 'History asset', 'kode_barang' => 'HISTORY-1', 'laboratorium_id' => $lab->id,
            'kategori_aset_id' => $category->id, 'foto' => '', 'keadaan' => 'baik', 'status' => 'dipinjam']);
        foreach (['dikembalikan', 'dipinjam'] as $index => $status) {
            $loan = PeminjamanAset::create(['nama_peminjam' => 'Borrower '.$index, 'institusi' => 'Audit',
                'keperluan' => 'Regression', 'tanggal_pinjam' => $index ? '2026-10-10' : '2026-10-01',
                'tanggal_kembali_rencana' => '2026-10-12', 'status' => $status, 'diproses_oleh' => $user->id]);
            PeminjamanAsetItem::create(['peminjaman_aset_id' => $loan->id, 'aset_id' => $asset->id,
                'tanggal_kembali_aktual' => $index ? null : '2026-10-02', 'kondisi_setelah_kembali' => $index ? null : 'baik']);
        }
        $this->actingAs($user)->getJson(route('detail-inventaris.riwayat-peminjaman', $asset->id))
            ->assertOk()->assertJsonCount(2)->assertJsonPath('0.nama_peminjam', 'Borrower 1')
            ->assertJsonPath('0.status', 'dipinjam')->assertJsonPath('1.status', 'dikembalikan')
            ->assertJsonPath('0.diprosesoleh.name', $user->name);
    }
}
