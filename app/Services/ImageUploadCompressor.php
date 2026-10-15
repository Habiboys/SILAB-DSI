<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadCompressor
{
    private const MAX_WIDTH = 1600;

    private const JPEG_QUALITY = 75;

    public function isImage(UploadedFile $file): bool
    {
        return $this->isCompressibleMime($file->getMimeType() ?: '');
    }

    public function store(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $mime = $file->getMimeType() ?: '';
        if (! $this->isCompressibleMime($mime)) {
            return $file->store($directory, $disk);
        }

        $compressed = $this->compressPath($file->getRealPath(), $mime);
        if ($compressed === null) {
            return $file->store($directory, $disk);
        }

        return $this->put($disk, $directory, $compressed['extension'], $compressed['binary']);
    }

    public function storeBinary(string $binary, string $mime, string $directory, string $disk = 'public'): ?string
    {
        $info = @getimagesizefromstring($binary);
        if (! $info || ! $this->isCompressibleMime($mime) || $info['mime'] !== ($mime === 'image/jpg' ? 'image/jpeg' : $mime)) {
            return null;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'img');
        if ($tmp === false) {
            return null;
        }

        try {
            file_put_contents($tmp, $binary);
            $compressed = $this->compressPath($tmp, $mime);
        } finally {
            @unlink($tmp);
        }

        if ($compressed === null) {
            $extension = $this->extensionForMime($mime);
            return $this->put($disk, $directory, $extension, $binary);
        }

        return $this->put($disk, $directory, $compressed['extension'], $compressed['binary']);
    }

    public function storeDataUri(string $dataUri, string $directory, string $disk = 'public'): ?string
    {
        if (! preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,/', $dataUri, $matches)) {
            return null;
        }

        $binary = base64_decode(substr($dataUri, strpos($dataUri, ',') + 1), true);
        if ($binary === false) {
            return null;
        }

        return $this->storeBinary($binary, $matches[1], $directory, $disk);
    }

    private function isCompressibleMime(string $mime): bool
    {
        return in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], true);
    }

    private function extensionForMime(string $mime): string
    {
        return match ($mime) {
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg',
        };
    }

    /**
     * @return array{binary: string, extension: string}|null
     */
    private function compressPath(string $path, string $mime): ?array
    {
        if (! is_file($path) || ! function_exists('imagecreatetruecolor')) {
            return null;
        }

        $info = @getimagesize($path);
        if (! $info || $info[0] * $info[1] > 40000000) return null;
        if ($mime === 'image/gif' && preg_match_all('/\x00\x21\xF9\x04/', file_get_contents($path)) > 1) return null;
        $src = null;
        $bufferLevel = ob_get_level();
        try {
            $src = match (true) {
                str_contains($mime, 'png') => @imagecreatefrompng($path),
                str_contains($mime, 'gif') => @imagecreatefromgif($path),
                str_contains($mime, 'webp') && function_exists('imagecreatefromwebp') => @imagecreatefromwebp($path),
                default => @imagecreatefromjpeg($path),
            };

            if (! $src) {
                return null;
            }

            $rotated = false;
            if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
                $exif = @exif_read_data($path);
                $orientation = (int) ($exif['Orientation'] ?? 1);
                if (in_array($orientation, [2, 4, 5, 7], true)) imageflip($src, in_array($orientation, [2, 5, 7], true) ? IMG_FLIP_HORIZONTAL : IMG_FLIP_VERTICAL);
                $angle = match ($orientation) { 3 => 180, 5, 6 => -90, 7, 8 => 90, default => 0 };
                if ($angle) {
                    $next = imagerotate($src, $angle, 0);
                    imagedestroy($src);
                    $src = $next;
                }
                $rotated = $orientation !== 1;
            }
            $width = imagesx($src);
            $height = imagesy($src);
            $keepPng = str_contains($mime, 'png') || str_contains($mime, 'gif') || str_contains($mime, 'webp');

            if ($width > self::MAX_WIDTH) {
                $newWidth = self::MAX_WIDTH;
                $newHeight = max(1, (int) round($height * self::MAX_WIDTH / $width));
                $dst = imagecreatetruecolor($newWidth, $newHeight);
                if ($keepPng) {
                    imagealphablending($dst, false);
                    imagesavealpha($dst, true);
                    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                    imagefilledrectangle($dst, 0, 0, $newWidth, $newHeight, $transparent);
                }
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($src);
                $src = $dst;
            }

            ob_start();
            if ($keepPng) {
                imagealphablending($src, false);
                imagesavealpha($src, true);
                imagepng($src, null, 6);
                $extension = 'png';
            } else {
                imagejpeg($src, null, self::JPEG_QUALITY);
                $extension = 'jpg';
            }
            $binary = ob_get_clean();
            imagedestroy($src);
            $src = null;

            if (! is_string($binary) || $binary === '') {
                return null;
            }

            if ($width <= self::MAX_WIDTH && ! $rotated && strlen($binary) >= filesize($path)) {
                return ['binary' => file_get_contents($path), 'extension' => $this->extensionForMime($mime)];
            }
            return ['binary' => $binary, 'extension' => $extension];
        } catch (\Throwable) {
            return null;
        } finally {
            while (ob_get_level() > $bufferLevel) ob_end_clean();
            if ($src instanceof \GdImage) imagedestroy($src);
        }
    }

    private function put(string $disk, string $directory, string $extension, string $binary): string
    {
        $path = trim($directory, '/').'/'.Str::uuid().'.'.$extension;
        if (! Storage::disk($disk)->put($path, $binary)) {
            throw new \RuntimeException('Gagal menyimpan gambar unggahan.');
        }

        return $path;
    }
}
