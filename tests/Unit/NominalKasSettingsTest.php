<?php

namespace Tests\Unit;

use App\Services\NominalKasSettings;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NominalKasSettingsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'nominal_unit', 'database.connections.nominal_unit' => [
            'driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true,
        ]]);
        Schema::create('kepengurusan_lab', fn (Blueprint $t) => $t->string('id')->primary());
        Schema::create('nominal_kas', function (Blueprint $t) {
            $t->string('id')->primary(); $t->string('kepengurusan_lab_id');
            $t->decimal('nominal'); $t->string('periode'); $t->boolean('is_active');
            $t->date('periode_mulai')->nullable(); $t->date('periode_berakhir')->nullable();
            $t->text('deskripsi')->nullable(); $t->timestamps();
        });
        Schema::create('tagihan_kas', function (Blueprint $t) {
            $t->string('id')->primary(); $t->string('user_id'); $t->string('kepengurusan_lab_id');
            $t->string('nominal_kas_id'); $t->decimal('total_tagihan'); $t->decimal('sudah_dibayar'); $t->string('status');
            $t->unique(['user_id', 'nominal_kas_id']);
            $t->foreign('nominal_kas_id')->references('id')->on('nominal_kas')->restrictOnDelete();
        });
        Schema::create('pemasukan_keuangan', function (Blueprint $t) {
            $t->string('id')->primary(); $t->string('kepengurusan_lab_id');
            $t->string('nominal_kas_id'); $t->string('tagihan_kas_id')->nullable(); $t->decimal('nominal');
            $t->foreign('nominal_kas_id')->references('id')->on('nominal_kas')->restrictOnDelete();
            $t->foreign('tagihan_kas_id')->references('id')->on('tagihan_kas')->restrictOnDelete();
        });
        DB::table('kepengurusan_lab')->insert(['id' => 'period']);
    }

    private function nominal(string $id, bool $active): void
    {
        DB::table('nominal_kas')->insert(['id' => $id, 'kepengurusan_lab_id' => 'period',
            'nominal' => 10000, 'periode' => 'bulanan', 'is_active' => $active,
            'created_at' => '2026-01-01', 'updated_at' => $active ? '2026-01-01' : '2026-10-15']);
    }

    public function test_saving_settings_updates_the_same_record_and_preserves_dates(): void
    {
        $service = new NominalKasSettings();
        $first = $service->save('period', ['nominal' => 10000, 'periode' => 'bulanan', 'is_active' => true]);
        $second = $service->save('period', ['nominal' => 20000, 'periode' => 'mingguan', 'is_active' => true,
            'periode_mulai' => '2026-10-01', 'periode_berakhir' => '2026-12-31', 'deskripsi' => 'Kas mingguan']);
        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, DB::table('nominal_kas')->count());
        $this->assertEquals(20000, $second->nominal);
        $this->assertSame('2026-10-01', $second->periode_mulai->toDateString());
    }

    public function test_saving_consolidates_duplicates_and_preserves_bills_and_payment_links(): void
    {
        $this->nominal('active', true); $this->nominal('newer-inactive', false);
        foreach (['active' => 'a', 'newer-inactive' => 'b'] as $nominal => $id) {
            DB::table('tagihan_kas')->insert(['id' => $id, 'user_id' => 'member', 'kepengurusan_lab_id' => 'period',
                'nominal_kas_id' => $nominal, 'total_tagihan' => 10000, 'sudah_dibayar' => 5000, 'status' => 'belum_lunas']);
            DB::table('pemasukan_keuangan')->insert(['id' => $id, 'kepengurusan_lab_id' => 'period',
                'nominal_kas_id' => $nominal, 'tagihan_kas_id' => $id, 'nominal' => 5000]);
        }
        (new NominalKasSettings())->save('period', ['nominal' => 15000, 'periode' => 'bulanan', 'is_active' => true]);
        $this->assertSame('active', DB::table('nominal_kas')->sole()->id);
        $bill = DB::table('tagihan_kas')->sole();
        $this->assertEquals(20000, $bill->total_tagihan);
        $this->assertEquals(10000, $bill->sudah_dibayar);
        $this->assertSame(['active'], DB::table('pemasukan_keuangan')->distinct()->pluck('nominal_kas_id')->all());
        $this->assertSame([$bill->id], DB::table('pemasukan_keuangan')->distinct()->pluck('tagihan_kas_id')->all());
        $this->assertSame(2, DB::table('pemasukan_keuangan')->count());
        $this->assertEquals(15000, DB::table('nominal_kas')->sole()->nominal);
    }
}
