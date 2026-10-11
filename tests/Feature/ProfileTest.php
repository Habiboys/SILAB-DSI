<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();
        $originalEmail = $user->email;
        $verifiedAt = $user->email_verified_at->toISOString();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'jenis_kelamin' => 'laki-laki',
                'nomor_induk' => 'AUDIT-001',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame($originalEmail, $user->email);
        $this->assertSame($verifiedAt, $user->email_verified_at->toISOString());
        $this->assertSame('laki-laki', $user->profile->jenis_kelamin);
        $this->assertSame('AUDIT-001', $user->profile->nomor_induk);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
                'jenis_kelamin' => 'perempuan',
                'nomor_induk' => 'AUDIT-002',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_staff_profile_requires_identity_fields_and_preserves_existing_data(): void
    {
        $user = User::factory()->create(['name' => 'Nama Awal']);
        $this->actingAs($user)->patch('/profile', ['name' => 'Tidak Tersimpan'])
            ->assertSessionHasErrors(['jenis_kelamin', 'nomor_induk']);
        $this->assertSame('Nama Awal', $user->fresh()->name);
        $this->assertNull($user->profile()->first());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
