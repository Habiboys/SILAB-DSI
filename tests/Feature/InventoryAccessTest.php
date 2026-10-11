<?php

namespace Tests\Feature;

use App\Models\{DetailAset, KategoriAset, Laboratorium, User};
use App\Models\Permission\{Permission, Role};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryAccessTest extends TestCase
{
    use RefreshDatabase;

    private Laboratorium $lab;
    private Laboratorium $otherLab;
    private KategoriAset $category;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->lab = Laboratorium::create(['nama' => 'Audit A', 'is_active' => true]);
        $this->otherLab = Laboratorium::create(['nama' => 'Audit B', 'is_active' => true]);
        $this->category = KategoriAset::create(['nama' => 'Komputer', 'deskripsi' => 'Audit']);
        $role = Role::findOrCreate('admin', 'web');
        foreach (['inventaris.view', 'inventaris.manage-items'] as $name) {
            $role->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }
        $this->admin = User::factory()->create(['access_lab_id' => $this->lab->id]);
        $this->admin->assignRole($role);
    }

    private function asset(Laboratorium $lab, string $code): DetailAset
    {
        return DetailAset::create($this->payload($lab, $code) + ['foto' => '']);
    }

    private function payload(Laboratorium $lab, string $code = 'AUDIT-001'): array
    {
        return ['kategori_aset_id' => $this->category->id, 'laboratorium_id' => $lab->id,
            'nama' => 'Komputer Audit', 'kode_barang' => $code, 'keadaan' => 'baik', 'status' => 'tersedia'];
    }

    public function test_users_without_inventory_permission_cannot_create_assets(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/detail-inventaris', $this->payload($this->lab))->assertForbidden();
        $this->assertDatabaseCount('aset', 0);
    }

    public function test_optional_asset_name_defaults_to_the_selected_category(): void
    {
        $payload = $this->payload($this->lab);
        $payload['nama'] = '';
        $this->actingAs($this->admin)->post('/detail-inventaris', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('aset', ['kode_barang' => $payload['kode_barang'], 'nama' => $this->category->nama]);
    }

    public function test_scoped_inventory_index_defaults_to_the_users_lab(): void
    {
        $own = $this->asset($this->lab, 'OWN');
        $this->asset($this->otherLab, 'FOREIGN');
        $this->actingAs($this->admin)->get('/inventaris')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Inventaris/Index')->has('inventaris.data', 1)->where('inventaris.data.0.id', $own->id));
    }

    public function test_foreign_asset_cannot_be_changed_by_manipulating_the_url(): void
    {
        $foreign = $this->asset($this->otherLab, 'FOREIGN');
        $this->actingAs($this->admin)->put('/detail-inventaris/'.$foreign->id,
            $this->payload($this->lab, 'HACKED'))->assertForbidden();
        $this->assertSame('FOREIGN', $foreign->fresh()->kode_barang);
    }

    public function test_foreign_lab_cannot_be_supplied_in_the_asset_payload(): void
    {
        $this->actingAs($this->admin)->post('/detail-inventaris', $this->payload($this->otherLab))->assertForbidden();
        $this->assertDatabaseCount('aset', 0);
    }

    public function test_bulk_delete_rejects_mixed_labs_before_deleting_any_asset(): void
    {
        $own = $this->asset($this->lab, 'OWN');
        $foreign = $this->asset($this->otherLab, 'FOREIGN');
        $this->actingAs($this->admin)->post('/detail-inventaris/bulk-delete', ['ids' => [$own->id, $foreign->id]])->assertForbidden();
        $this->assertDatabaseHas('aset', ['id' => $own->id]);
        $this->assertDatabaseHas('aset', ['id' => $foreign->id]);
    }

    public function test_optional_asset_photo_does_not_break_creation_and_qr_is_stored(): void
    {
        $this->actingAs($this->admin)->post('/detail-inventaris', $this->payload($this->lab))
            ->assertSessionHasNoErrors()->assertRedirect();
        $asset = DetailAset::where('kode_barang', 'AUDIT-001')->sole();
        $this->assertSame('', $asset->foto);
        Storage::disk('public')->assertExists($asset->qr_code_path);
        $this->assertDatabaseHas('riwayat_kondisi_aset', ['aset_id' => $asset->id, 'kondisi_sesudah' => 'baik']);
    }

    public function test_duplicate_asset_codes_are_rejected_without_creating_a_second_row(): void
    {
        $this->asset($this->lab, 'AUDIT-001');
        $this->actingAs($this->admin)->post('/detail-inventaris', $this->payload($this->lab))->assertSessionHasErrors('kode_barang');
        $this->assertDatabaseCount('aset', 1);
    }

    public function test_missing_asset_returns_not_found(): void
    {
        $this->actingAs($this->admin)->get('/detail-inventaris/00000000-0000-0000-0000-000000000001/riwayat-kondisi')->assertNotFound();
    }

    public function test_own_asset_can_be_updated_and_deleted_with_database_history(): void
    {
        $asset = $this->asset($this->lab, 'AUDIT-001');
        $this->actingAs($this->admin)->put('/detail-inventaris/'.$asset->id,
            array_merge($this->payload($this->lab, 'AUDIT-UPDATED'), ['keadaan' => 'rusak']))
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('aset', ['id' => $asset->id, 'kode_barang' => 'AUDIT-UPDATED', 'keadaan' => 'rusak']);
        $this->assertDatabaseHas('riwayat_kondisi_aset', ['aset_id' => $asset->id, 'kondisi_sebelum' => 'baik', 'kondisi_sesudah' => 'rusak']);
        $this->actingAs($this->admin)->delete('/detail-inventaris/'.$asset->id)->assertRedirect();
        $this->assertDatabaseMissing('aset', ['id' => $asset->id]);
    }

    public function test_optional_category_description_can_be_saved(): void
    {
        $role = Role::findOrCreate('superadmin', 'web');
        $this->admin->assignRole($role);
        $this->actingAs($this->admin)->post('/data-master/kategori-aset', ['nama' => 'Tanpa deskripsi'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('kategori_aset', ['nama' => 'Tanpa deskripsi', 'deskripsi' => '']);
    }
}
