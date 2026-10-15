<?php

namespace Tests\Feature;

use App\Models\{KepengurusanLab, Laboratorium, NominalKas, PemasukanKeuangan, TagihanKas, TahunKepengurusan, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private KepengurusanLab $period;
    private TagihanKas $bill;

    protected function setUp(): void
    {
        parent::setUp();
        $lab = Laboratorium::create(['nama' => 'Finance integrity', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $this->period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $user = User::factory()->create(['access_lab_id' => $lab->id]);
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $this->actingAs($user);
        $nominal = NominalKas::create(['kepengurusan_lab_id' => $this->period->id, 'nominal' => 10000, 'periode' => 'bulanan', 'is_active' => true]);
        $this->bill = TagihanKas::create(['kepengurusan_lab_id' => $this->period->id, 'nominal_kas_id' => $nominal->id,
            'user_id' => $user->id, 'total_tagihan' => 10000, 'sudah_dibayar' => 0, 'status' => 'belum_lunas']);
    }

    private function pay(): PemasukanKeuangan
    {
        $this->post(route('tagihan-kas.bayar'), ['tagihan_kas_id' => $this->bill->id, 'nominal' => 10000, 'tanggal' => '2026-10-11'])->assertRedirect();
        return PemasukanKeuangan::sole();
    }

    public function test_finance_page_uses_server_permissions_instead_of_role_permission_list(): void
    {
        $this->withoutVite();
        $reader = User::factory()->create(['access_lab_id' => $this->period->laboratorium_id]);
        $role = Role::findOrCreate('asisten', 'web');
        foreach (['keuangan.view', 'keuangan.create-transaksi', 'keuangan.update-transaksi', 'keuangan.manage-nominal-kas'] as $name) {
            $permission = \App\Models\Permission\Permission::findOrCreate($name, 'web');
            if ($name === 'keuangan.view') $role->givePermissionTo($permission);
        }
        $reader->assignRole($role);
        $reader->profile()->create(['nomor_induk' => 'FINANCE-READER', 'jenis_kelamin' => 'laki-laki', 'no_hp' => '081234567890']);
        $this->actingAs($reader)->get(route('riwayat-keuangan.index', ['kepengurusan_lab_id' => $this->period->id]))
            ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('RiwayatKeuangan')->where('can.create', false)->where('can.update', false)
                ->where('can.delete', false)->where('can.manage_nominal_kas', false));
    }

    public function test_nominal_save_updates_one_record_and_page_returns_its_values(): void
    {
        $this->withoutVite();
        $id = $this->bill->nominal_kas_id;
        foreach ([15000, 20000] as $amount) {
            $this->post(route('nominal-kas.store'), ['kepengurusan_lab_id' => $this->period->id,
                'nominal' => $amount, 'periode' => 'mingguan', 'deskripsi' => 'Kas mingguan',
                'periode_mulai' => '2026-10-01', 'periode_berakhir' => '2026-12-31'])
                ->assertSessionHasNoErrors()->assertRedirect();
        }
        $this->assertDatabaseCount('nominal_kas', 1);
        $this->assertDatabaseHas('nominal_kas', ['id' => $id, 'nominal' => 20000]);
        $this->get(route('riwayat-keuangan.index', ['kepengurusan_lab_id' => $this->period->id]))
            ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->where('can.manage_nominal_kas', true)->has('nominalKas', 1)
                ->where('nominalKas.0.id', $id)->where('nominalKas.0.periode', 'mingguan')
                ->where('nominalKas.0.deskripsi', 'Kas mingguan'));
    }

    public function test_transaction_evidence_accepts_a_file_and_compresses_it(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $this->post(route('riwayat-keuangan.store'), ['kepengurusan_lab_id' => $this->period->id,
            'lab_id' => $this->period->laboratorium_id,
            'tanggal' => '2026-10-15', 'nominal' => 1000, 'jenis' => 'masuk', 'deskripsi' => 'Bukti unggahan',
            'bukti' => \Illuminate\Http\UploadedFile::fake()->image('bukti.jpg', 3200, 1600)])
            ->assertSessionHasNoErrors()->assertRedirect();
        $payment = PemasukanKeuangan::sole();
        $image = \Illuminate\Support\Facades\Storage::disk('public')->get($payment->bukti);
        $this->assertSame(1600, getimagesizefromstring($image)[0]);
    }

    public function test_editing_a_payment_keeps_the_bill_balance_consistent(): void
    {
        $payment = $this->pay();
        $this->put(route('riwayat-keuangan.update', ['riwayatKeuangan' => $payment->id]),
            ['tanggal' => '2026-10-11', 'nominal' => 4000, 'jenis' => 'masuk', 'deskripsi' => 'Corrected payment'])->assertRedirect();
        $this->assertSame(4000.0, (float) $this->bill->fresh()->sudah_dibayar);
        $this->assertSame('belum_lunas', $this->bill->fresh()->status);
    }

    public function test_deleting_a_payment_reopens_the_bill(): void
    {
        $payment = $this->pay();
        $this->delete(route('riwayat-keuangan.destroy', ['riwayatKeuangan' => $payment->id]))->assertRedirect();
        $this->assertSame(0.0, (float) $this->bill->fresh()->sudah_dibayar);
        $this->assertSame('belum_lunas', $this->bill->fresh()->status);
    }

    public function test_lab_access_alone_does_not_authorize_finance_writes(): void
    {
        foreach (['keuangan.create-transaksi', 'keuangan.update-transaksi', 'keuangan.manage-nominal-kas'] as $permission) {
            \App\Models\Permission\Permission::findOrCreate($permission, 'web');
        }
        $user = User::factory()->create(['access_lab_id' => $this->period->laboratorium_id]);
        $user->assignRole(Role::findOrCreate('asisten', 'web'));
        $user->profile()->create(['nomor_induk' => 'FINANCE-OUTSIDER', 'jenis_kelamin' => 'laki-laki', 'no_hp' => '081234567890']);
        $this->actingAs($user)->postJson(route('tagihan-kas.bayar'), ['tagihan_kas_id' => $this->bill->id, 'nominal' => 1000, 'tanggal' => '2026-10-11'])->assertForbidden();
        $this->postJson(route('nominal-kas.store'), ['kepengurusan_lab_id' => $this->period->id, 'nominal' => 90000, 'periode' => 'bulanan'])->assertForbidden();
        $this->assertDatabaseCount('pemasukan_keuangan', 0);
        $this->assertSame(10000.0, (float) $this->bill->nominalKas->fresh()->nominal);
    }

    public function test_edit_cannot_overpay_a_bill_and_rolls_back_the_ledger(): void
    {
        $payment = $this->pay();
        $this->putJson(route('riwayat-keuangan.update', ['riwayatKeuangan' => $payment->id]),
            ['tanggal' => '2026-10-11', 'nominal' => 20000, 'jenis' => 'masuk', 'deskripsi' => 'Overpayment'])
            ->assertUnprocessable()->assertJsonValidationErrors('nominal');
        $this->assertSame(10000, $payment->fresh()->nominal);
        $this->assertSame(10000.0, (float) $this->bill->fresh()->sudah_dibayar);
    }

    public function test_active_treasurer_can_manage_nominal_and_correct_payments_without_role_permissions(): void
    {
        $payment = $this->pay();
        $treasurer = User::factory()->create();
        $treasurer->assignRole(Role::findOrCreate('asisten', 'web'));
        $treasurer->profile()->create(['nomor_induk' => 'AUDIT-TREASURER', 'jenis_kelamin' => 'laki-laki', 'no_hp' => '081234567890']);
        $structure = \App\Models\Struktur::create(['struktur' => 'Bendahara']);
        $permission = \App\Models\Permission\Permission::findOrCreate('keuangan.update-transaksi', 'web');
        \Illuminate\Support\Facades\DB::table('struktur_permissions')->insert(['struktur_id' => $structure->id, 'permission_id' => $permission->id]);
        \App\Models\KepengurusanUser::create(['kepengurusan_lab_id' => $this->period->id, 'user_id' => $treasurer->id, 'struktur_id' => $structure->id, 'is_active' => true]);
        $this->actingAs($treasurer)->post(route('nominal-kas.store'), ['kepengurusan_lab_id' => $this->period->id, 'nominal' => 10000, 'periode' => 'bulanan'])->assertRedirect();
        $this->put(route('riwayat-keuangan.update', ['riwayatKeuangan' => $payment->id]),
            ['tanggal' => '2026-10-11', 'nominal' => 3000, 'jenis' => 'masuk', 'deskripsi' => 'Treasurer correction'])->assertRedirect();
        $this->assertSame(3000.0, (float) $this->bill->fresh()->sudah_dibayar);
    }

    public function test_fine_payment_edit_and_delete_update_the_fine_balance(): void
    {
        $period = \App\Models\PeriodePiket::create(['kepengurusan_lab_id' => $this->period->id, 'nama' => 'Audit fine',
            'tanggal_mulai' => '2026-10-01', 'tanggal_selesai' => '2026-10-31', 'isactive' => true, 'lama_piket' => 1]);
        $fine = \App\Models\DendaPiket::create(['kepengurusan_lab_id' => $this->period->id, 'periode_piket_id' => $period->id,
            'user_id' => auth()->id(), 'total_denda' => 10000, 'sudah_dibayar' => 0, 'status' => 'belum_lunas']);
        $this->post(route('piket.denda-piket.bayar'), ['denda_piket_id' => $fine->id, 'nominal' => 10000, 'tanggal' => '2026-10-11'])->assertRedirect();
        $payment = PemasukanKeuangan::sole();
        $this->put(route('riwayat-keuangan.update', ['riwayatKeuangan' => $payment->id]),
            ['tanggal' => '2026-10-11', 'nominal' => 3000, 'jenis' => 'masuk', 'deskripsi' => 'Corrected fine'])->assertRedirect();
        $this->assertSame(3000.0, (float) $fine->fresh()->sudah_dibayar);
        $this->assertSame('belum_lunas', $fine->fresh()->status);
        $this->delete(route('riwayat-keuangan.destroy', ['riwayatKeuangan' => $payment->id]))->assertRedirect();
        $this->assertSame(0.0, (float) $fine->fresh()->sudah_dibayar);
    }
}
