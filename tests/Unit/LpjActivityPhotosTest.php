<?php

namespace Tests\Unit;

use App\Http\Controllers\LpjKepengurusanController;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LpjActivityPhotosTest extends TestCase
{
    public function test_documents_and_missing_images_do_not_consume_the_three_photo_limit(): void
    {
        Storage::fake('public');
        $documents = collect();
        for ($i = 0; $i < 3; $i++) {
            Storage::disk('public')->put("docs/$i.pdf", '%PDF-1.7 test');
            $documents->push((object) ['file_path' => "docs/$i.pdf", 'judul' => "PDF $i"]);
        }
        $documents->push((object) ['file_path' => 'missing.png', 'judul' => 'Missing']);
        for ($i = 0; $i < 5; $i++) {
            $image = \Illuminate\Http\UploadedFile::fake()->image("$i.png", 10, 10);
            Storage::disk('public')->put("photos/$i.png", file_get_contents($image->getRealPath()));
            $documents->push((object) ['file_path' => "photos/$i.png", 'judul' => "Photo $i"]);
        }
        $method = new \ReflectionMethod(LpjKepengurusanController::class, 'activityPhotos');
        $photos = $method->invoke(new LpjKepengurusanController(), $documents,
            fn ($path) => $path === 'photos/0.png' ? null : 'data:image/png;base64,'.base64_encode(Storage::disk('public')->get($path)));
        $this->assertCount(3, $photos);
        $this->assertSame(['Photo 1', 'Photo 2', 'Photo 3'], array_column($photos, 'judul'));
        $this->assertStringStartsWith('data:image/png;base64,', $photos[0]['src']);
    }
}
