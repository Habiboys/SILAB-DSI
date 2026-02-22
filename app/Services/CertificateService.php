<?php

namespace App\Services;

use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;

class CertificateService
{
    /**
     * Generate certificate from DOCX template
     * 
     * @param string $templatePath Absolute path to .docx template
     * @param array $data Key-value pairs to replace in template
     * @param string $outputPath Relative path to save the output file
     * @param string $format 'docx' (PDF not supported without LibreOffice)
     * @return string|false Path to saved file or false on failure
     */
    public function generate(string $templatePath, array $data, string $outputPath, string $format = 'docx')
    {
        try {
            if (!file_exists($templatePath)) {
                Log::error("Certificate template not found: $templatePath");
                return false;
            }

            $templateProcessor = new TemplateProcessor($templatePath);

            // Generate QR code if 'nomor' is provided in data
            $qrImagePath = null;
            if (!empty($data['nomor'])) {
                $qrImagePath = $this->generateQrCode($data['nomor']);
            }

            // Replace text variables
            foreach ($data as $key => $value) {
                if ($key === 'qr_code') continue; // handled separately as image
                $templateProcessor->setValue($key, htmlspecialchars($value ?? '', ENT_COMPAT, 'UTF-8'));
            }

            // Inject QR code image if template has ${qr_code} placeholder and QR was generated
            if ($qrImagePath && file_exists($qrImagePath)) {
                try {
                    $templateProcessor->setImageValue('qr_code', [
                        'path'   => $qrImagePath,
                        'width'  => 80,
                        'height' => 80,
                        'ratio'  => false,
                    ]);
                } catch (\Throwable $e) {
                    // Placeholder might not exist in template, just skip it
                    Log::info('QR code placeholder not found in template, skipping: ' . $e->getMessage());
                }
            }

            // Save as DOCX
            $tempDocx = tempnam(sys_get_temp_dir(), 'cert_') . '.docx';
            $templateProcessor->saveAs($tempDocx);

            Storage::disk('public')->put($outputPath, file_get_contents($tempDocx));

            // Cleanup temp files
            @unlink($tempDocx);
            if ($qrImagePath) {
                @unlink($qrImagePath);
            }

            return $outputPath;

        } catch (\Exception $e) {
            Log::error("Certificate generation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a QR code PNG image pointing to the certificate verification URL.
     * Uses endroid/qr-code which works with GD (no imagick required).
     * Returns the absolute path to the temporary PNG file.
     */
    public function generateQrCode(string $nomorSertifikat): ?string
    {
        try {
            $verifyUrl = url('/verify/' . urlencode($nomorSertifikat));

            $qrCode = QrCode::create($verifyUrl)
                ->setEncoding(new Encoding('UTF-8'))
                ->setErrorCorrectionLevel(ErrorCorrectionLevel::High)
                ->setSize(200)
                ->setMargin(10)
                ->setRoundBlockSizeMode(RoundBlockSizeMode::Margin)
                ->setForegroundColor(new Color(0, 0, 0))
                ->setBackgroundColor(new Color(255, 255, 255));

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            $tempPath = tempnam(sys_get_temp_dir(), 'qr_') . '.png';
            $result->saveToFile($tempPath);

            return file_exists($tempPath) ? $tempPath : null;

        } catch (\Throwable $e) {
            Log::error('QR code generation failed: ' . $e->getMessage());
            return null;
        }
    }
}
