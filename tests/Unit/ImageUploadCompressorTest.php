<?php

namespace Tests\Unit;

use App\Services\ImageUploadCompressor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageUploadCompressorTest extends TestCase
{
    public function test_large_jpeg_is_resized_and_smaller_and_names_are_unique(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('photo.jpg', 3200, 1600);
        $service = new ImageUploadCompressor();
        $path = $service->store($file, 'photos');
        $other = $service->store($file, 'photos');
        $image = Storage::disk('public')->get($path);
        $this->assertNotSame($path, $other);
        $this->assertSame([1600, 800], array_slice(getimagesizefromstring($image), 0, 2));
        $this->assertLessThan($file->getSize(), strlen($image));
    }

    public function test_transparent_signature_is_not_flattened_and_small_png_does_not_grow(): void
    {
        Storage::fake('public');
        $image = imagecreatetruecolor(2000, 1000);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
        imageline($image, 0, 500, 1999, 500, imagecolorallocatealpha($image, 0, 0, 0, 0));
        ob_start(); imagepng($image); $binary = ob_get_clean(); imagedestroy($image);
        $service = new ImageUploadCompressor();
        $path = $service->storeDataUri('data:image/png;base64,'.base64_encode($binary), 'signatures');
        $result = imagecreatefromstring(Storage::disk('public')->get($path));
        $this->assertSame(1600, imagesx($result));
        $this->assertSame(127, imagecolorsforindex($result, imagecolorat($result, 0, 0))['alpha']);
        imagedestroy($result);
        $small = UploadedFile::fake()->image('small.png', 40, 40);
        $smallPath = $service->store($small, 'photos');
        $this->assertLessThanOrEqual($small->getSize(), Storage::disk('public')->size($smallPath));
    }

    public function test_non_image_document_is_unchanged_and_invalid_data_uri_is_rejected(): void
    {
        Storage::fake('public');
        $service = new ImageUploadCompressor();
        $file = UploadedFile::fake()->createWithContent('document.pdf', '%PDF-1.7 unchanged content');
        $path = $service->store($file, 'documents');
        $this->assertSame(file_get_contents($file->getRealPath()), Storage::disk('public')->get($path));
        $before = Storage::disk('public')->allFiles();
        $this->assertNull($service->storeDataUri('data:image/png;base64,not-valid!', 'photos'));
        $this->assertNull($service->storeDataUri('data:image/png;base64,'.base64_encode('not an image'), 'photos'));
        $this->assertSame($before, Storage::disk('public')->allFiles());
    }
}
