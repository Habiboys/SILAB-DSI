<?php

declare(strict_types=1);

$sqlPath = __DIR__ . '/../struktur_db.sql';
$outputPath = __DIR__ . '/../docs/DOKUMENTASI_STRUKTUR_TABEL_PER_MODUL.md';

if (!file_exists($sqlPath)) {
	fwrite(STDERR, "File SQL tidak ditemukan: {$sqlPath}\n");
	exit(1);
}

$sql = file_get_contents($sqlPath);
if ($sql === false) {
	fwrite(STDERR, "Gagal membaca file SQL.\n");
	exit(1);
}

$tables = [];

if (preg_match_all('/CREATE TABLE\s+`([^`]+)`\s*\((.*?)\)\s*ENGINE=/is', $sql, $matches, PREG_SET_ORDER)) {
	foreach ($matches as $m) {
		$tableName = $m[1];
		$body = $m[2];

		$columns = [];
		$lines = preg_split('/\R/', $body) ?: [];
		foreach ($lines as $line) {
			$line = trim($line);
			if ($line === '' || !str_starts_with($line, '`')) {
				continue;
			}

			$line = rtrim($line, ',');
			if (!preg_match('/^`([^`]+)`\s+(.+)$/', $line, $colMatch)) {
				continue;
			}

			$colName = $colMatch[1];
			$rest = trim($colMatch[2]);

			$type = '';
			$desc = [];

			if (preg_match('/^(enum\([^)]*\)|set\([^)]*\)|[a-zA-Z0-9_]+(?:\([^)]*\))?)/i', $rest, $typeMatch)) {
				$type = $typeMatch[1];
				$restAfterType = trim(substr($rest, strlen($typeMatch[0])));
			} else {
				$parts = preg_split('/\s+/', $rest, 2);
				$type = $parts[0] ?? '';
				$restAfterType = $parts[1] ?? '';
			}

			if (stripos($restAfterType, 'NOT NULL') !== false) {
				$desc[] = 'Wajib (NOT NULL)';
			} else {
				$desc[] = 'Boleh NULL';
			}

			if (preg_match('/DEFAULT\s+([^\s,]+)/i', $restAfterType, $defMatch)) {
				$desc[] = 'Default: ' . $defMatch[1];
			}

			if (stripos($restAfterType, 'AUTO_INCREMENT') !== false) {
				$desc[] = 'AUTO_INCREMENT';
			}

			if (preg_match('/COMMENT\s+\'([^\']*)\'/i', $restAfterType, $commentMatch)) {
				$desc[] = 'Komentar: ' . $commentMatch[1];
			}

			$columns[$colName] = [
				'name' => $colName,
				'type' => $type,
				'desc' => implode('; ', $desc),
				'is_pk' => false,
				'is_fk' => false,
				'fk_ref' => null,
			];
		}

		$tables[$tableName] = [
			'name' => $tableName,
			'columns' => $columns,
			'pk' => [],
			'fk' => [],
		];
	}
}

if (preg_match_all('/ALTER TABLE\s+`([^`]+)`\s+(.*?);/is', $sql, $alterMatches, PREG_SET_ORDER)) {
	foreach ($alterMatches as $m) {
		$table = $m[1];
		$body = $m[2];

		if (!isset($tables[$table])) {
			continue;
		}

		if (preg_match('/ADD\s+PRIMARY\s+KEY\s*\(([^)]+)\)/i', $body, $pkMatch)) {
			preg_match_all('/`([^`]+)`/', $pkMatch[1], $pkCols);
			foreach ($pkCols[1] as $pkCol) {
				$tables[$table]['pk'][$pkCol] = true;
				if (isset($tables[$table]['columns'][$pkCol])) {
					$tables[$table]['columns'][$pkCol]['is_pk'] = true;
				}
			}
		}

		if (preg_match_all('/FOREIGN\s+KEY\s*\(`([^`]+)`\)\s+REFERENCES\s+`([^`]+)`\s*\(`([^`]+)`\)/i', $body, $fkMatches, PREG_SET_ORDER)) {
			foreach ($fkMatches as $fk) {
				$col = $fk[1];
				$refTable = $fk[2];
				$refCol = $fk[3];
				$tables[$table]['fk'][$col] = "{$refTable}.{$refCol}";

				if (isset($tables[$table]['columns'][$col])) {
					$tables[$table]['columns'][$col]['is_fk'] = true;
					$tables[$table]['columns'][$col]['fk_ref'] = "{$refTable}.{$refCol}";
				}
			}
		}
	}
}

$moduleMap = [
	'Sistem & Auth' => [
		'users', 'profile', 'roles', 'permissions', 'model_has_roles', 'model_has_permissions', 'role_has_permissions',
		'sessions', 'password_reset_tokens', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'migrations',
	],
	'Master Kepengurusan' => [
		'laboratorium', 'tahun_kepengurusan', 'kepengurusan_lab', 'struktur', 'kepengurusan_user', 'struktur_permissions',
	],
	'Praktikum' => [
		'mata_kuliah', 'praktikum', 'kelas', 'pertemuan_praktikum', 'aslab_praktikum', 'praktikan', 'praktikan_praktikum',
		'absensi_aslab', 'absensi_praktikan', 'tugas_praktikum', 'pengumpulan_tugas', 'komponen_rubrik', 'nilai_rubrik',
		'nilai_tambahan', 'modul_praktikum',
	],
	'Inventaris Aset' => [
		'kategori_aset', 'detail_aset', 'riwayat_kondisi_aset', 'permohonan_aset', 'wishlist_aset', 'peminjaman_aset',
		'template_surat_peminjaman',
	],
	'Keuangan' => [
		'nominal_kas', 'pemasukan_keuangan', 'pengeluaran_keuangan', 'laporan_keuangan',
	],
	'Kegiatan & Proker' => [
		'proker', 'proker_parameter', 'proker_pj', 'proker_dokumentasi', 'kegiatan', 'kegiatan_peserta',
		'dokumentasi_kegiatan', 'laporan_kegiatan', 'lpj_kepengurusan',
	],
	'Piket' => [
		'periode_piket', 'jadwal_piket', 'absensi', 'ganti_jadwal_piket', 'pengaturan_piket',
	],
	'Surat Menyurat' => [
		'konfigurasi_surat', 'surat_masuk', 'surat_keluar', 'disposisi_surat',
	],
	'Sertifikat' => [
		'sertifikat', 'sertifikat_templates',
	],
	'Kuesioner' => [
		'kuesioner', 'pertanyaan_kuesioner', 'opsi_pertanyaan', 'target_kuesioner', 'respon_kuesioner', 'jawaban_kuesioner',
	],
];

$allMapped = [];
foreach ($moduleMap as $modTables) {
	foreach ($modTables as $t) {
		$allMapped[$t] = true;
	}
}

$unmapped = array_values(array_filter(array_keys($tables), static fn ($t) => !isset($allMapped[$t])));
if (!empty($unmapped)) {
	sort($unmapped);
	$moduleMap['Lainnya'] = $unmapped;
}

$captionMap = [
	'users' => 'Data akun pengguna aplikasi.',
	'roles' => 'Daftar peran (role) pengguna sistem.',
	'permissions' => 'Daftar hak akses granular sistem.',
	'migrations' => 'Riwayat migrasi database Laravel.',
];

$md = [];
$md[] = '# Dokumentasi Struktur Tabel per Modul';
$md[] = '';
$md[] = 'Dokumen ini disusun dari file `struktur_db.sql` dan merangkum **semua tabel** ke dalam modul fungsional.';
$md[] = '';
$md[] = '- Total tabel terdeteksi: **' . count($tables) . '**';
$md[] = '- Tanggal generate: **' . date('Y-m-d H:i:s') . '**';
$md[] = '';

foreach ($moduleMap as $moduleName => $moduleTables) {
	$md[] = '## Modul: ' . $moduleName;
	$md[] = '';

	foreach ($moduleTables as $t) {
		if (!isset($tables[$t])) {
			continue;
		}

		$table = $tables[$t];
		$caption = $captionMap[$t] ?? ('Menyimpan data terkait `' . str_replace('_', ' ', $t) . '`.');

		$md[] = '### Tabel: `' . $t . '`';
		$md[] = '';
		$md[] = '> ' . $caption;
		$md[] = '';
		$md[] = '| Jenis | Nama Kolom | Tipe Data | Keterangan |';
		$md[] = '|---|---|---|---|';

		foreach ($table['columns'] as $col) {
			$jenis = [];
			if ($col['is_pk']) {
				$jenis[] = 'PK';
			}
			if ($col['is_fk']) {
				$jenis[] = 'FK';
			}
			if (empty($jenis)) {
				$jenis[] = 'Field';
			}

			$ket = $col['desc'];
			if ($col['is_fk'] && $col['fk_ref']) {
				$ket .= ($ket !== '' ? '; ' : '') . 'Relasi ke `' . $col['fk_ref'] . '`';
			}

			$md[] = '| ' . implode(', ', $jenis)
				. ' | `' . $col['name'] . '`'
				. ' | `' . $col['type'] . '`'
				. ' | ' . str_replace('|', '\\|', $ket) . ' |';
		}

		$md[] = '';
	}
}

file_put_contents($outputPath, implode(PHP_EOL, $md) . PHP_EOL);
echo "Dokumentasi berhasil dibuat: {$outputPath}\n";
echo "Total tabel: " . count($tables) . "\n";

