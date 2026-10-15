<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PraktikumSubmissionValidationTest extends TestCase
{
    public function test_empty_submission_returns_form_errors_instead_of_plain_json(): void
    {
        $this->withoutMiddleware();
        $this->from('/praktikan/daftar-tugas')->withHeader('X-Inertia', 'true')
            ->post(route('praktikum.tugas.pengumpulan.store', ['tugas' => 'unused']), [])
            ->assertRedirect('/praktikan/daftar-tugas')->assertSessionHasErrors('files');
    }

    public function test_invalid_uploaded_file_returns_indexed_form_errors(): void
    {
        $this->withoutMiddleware();
        $this->from('/praktikan/daftar-tugas')->withHeader('X-Inertia', 'true')
            ->post(route('praktikum.tugas.pengumpulan.store', ['tugas' => 'unused']), [
                'files' => [UploadedFile::fake()->create('script.exe', 1, 'application/octet-stream')],
            ])->assertRedirect('/praktikan/daftar-tugas')->assertSessionHasErrors('files.0');
    }

    public function test_blank_links_return_validation_errors(): void
    {
        $this->withoutMiddleware();
        $this->from('/praktikan/daftar-tugas')->withHeader('X-Inertia', 'true')
            ->post(route('praktikum.tugas.pengumpulan.store', ['tugas' => 'unused']), ['links' => ['']])
            ->assertRedirect('/praktikan/daftar-tugas')->assertSessionHasErrors('files');
    }
}
