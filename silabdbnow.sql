-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 25, 2026 at 12:43 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `silabprodnew`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi`
--

CREATE TABLE `absensi` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time NOT NULL,
  `jam_keluar` time DEFAULT NULL,
  `foto_checkout` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_checkin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jadwal_piket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kegiatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_manual` tinyint(1) NOT NULL DEFAULT '0',
  `manual_input_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `verified_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verification_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `absensi_aslab`
--

CREATE TABLE `absensi_aslab` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertemuan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aslab_praktikum_id` bigint UNSIGNED NOT NULL,
  `status` enum('hadir','sakit','izin','alpa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'alpa',
  `waktu_absen` datetime DEFAULT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `absensi_praktikan`
--

CREATE TABLE `absensi_praktikan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertemuan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `praktikan_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('hadir','sakit','izin','alpa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'alpa',
  `waktu_absen` datetime DEFAULT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aset`
--

CREATE TABLE `aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori_aset_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `laboratorium_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tanggal_perolehan` date DEFAULT NULL,
  `harga_perolehan` decimal(15,2) DEFAULT NULL,
  `asal_barang` enum('pengadaan','hibah','pembelian_mandiri','lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wishlist_aset_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_barang` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('tersedia','dipinjam') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `keadaan` enum('baik','rusak','hilang') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'baik',
  `jumlah` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aslab_praktikum`
--

CREATE TABLE `aslab_praktikum` (
  `id` bigint UNSIGNED NOT NULL,
  `praktikum_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `disposisi_surat`
--

CREATE TABLE `disposisi_surat` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `surat_masuk_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dari_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepada_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('belum_dibaca','sudah_dibaca','selesai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'belum_dibaca',
  `dibaca_at` timestamp NULL DEFAULT NULL,
  `diselesaikan_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dokumentasi_kegiatan`
--

CREATE TABLE `dokumentasi_kegiatan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kegiatan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ganti_jadwal_piket`
--

CREATE TABLE `ganti_jadwal_piket` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jadwal_piket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode_piket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hari_lama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hari_baru` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alasan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `catatan_admin` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_piket`
--

CREATE TABLE `jadwal_piket` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hari` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jawaban_kuesioner`
--

CREATE TABLE `jawaban_kuesioner` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `respon_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertanyaan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jawaban` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori_aset`
--

CREATE TABLE `kategori_aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kegiatan`
--

CREATE TABLE `kegiatan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proker_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kegiatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi_kegiatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipe_kegiatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lokasi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_meeting` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `status_approval` enum('diajukan','disetujui','ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diajukan',
  `approved_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kegiatan_peserta`
--

CREATE TABLE `kegiatan_peserta` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kegiatan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `peran` enum('peserta','panitia') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'peserta',
  `is_lulus` tinyint(1) NOT NULL DEFAULT '0',
  `no_sertifikat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_sertifikat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kelas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `praktikum_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_kelas_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('aktif','nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `hari` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jam_mulai` time DEFAULT NULL,
  `jam_selesai` time DEFAULT NULL,
  `ruangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kepengurusan_lab`
--

CREATE TABLE `kepengurusan_lab` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun_kepengurusan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `laboratorium_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sk` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kepengurusan_user`
--

CREATE TABLE `kepengurusan_user` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `struktur_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `tanggal_bergabung` date NOT NULL DEFAULT '2025-08-16',
  `tanggal_keluar` date DEFAULT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `komponen_rubrik`
--

CREATE TABLE `komponen_rubrik` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tugas_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_komponen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `bobot` decimal(5,2) NOT NULL,
  `nilai_maksimal` decimal(5,2) NOT NULL DEFAULT '100.00',
  `urutan` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `konfigurasi_surat`
--

CREATE TABLE `konfigurasi_surat` (
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `inisial_lab` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LAB',
  `format_nomor` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}',
  `variabel_aktif` json DEFAULT NULL,
  `reset_tiap_tahun` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kuesioner`
--

CREATE TABLE `kuesioner` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipe` enum('internal','eksternal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_eksternal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_mulai` datetime DEFAULT NULL,
  `tanggal_selesai` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `dibuat_oleh` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laboratorium`
--

CREATE TABLE `laboratorium` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_kegiatan`
--

CREATE TABLE `laporan_kegiatan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kegiatan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_laporan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode_bulan` int DEFAULT NULL,
  `periode_tahun` int DEFAULT NULL,
  `deskripsi_capaian` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_lpj` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mata_kuliah`
--

CREATE TABLE `mata_kuliah` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode_mata_kuliah` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sks` tinyint UNSIGNED NOT NULL,
  `semester` tinyint UNSIGNED NOT NULL,
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_has_permissions`
--

CREATE TABLE `model_has_permissions` (
  `permission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_has_roles`
--

CREATE TABLE `model_has_roles` (
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modul_praktikum`
--

CREATE TABLE `modul_praktikum` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertemuan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_pertemuan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nilai_rubrik`
--

CREATE TABLE `nilai_rubrik` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengumpulan_tugas_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `komponen_rubrik_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nilai` decimal(5,2) NOT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dinilai_oleh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dinilai_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nilai_tambahan`
--

CREATE TABLE `nilai_tambahan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengumpulan_tugas_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nilai` decimal(5,2) NOT NULL,
  `kategori` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bonus',
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `diberikan_oleh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `diberikan_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nominal_kas`
--

CREATE TABLE `nominal_kas` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nominal` decimal(10,2) NOT NULL,
  `periode` enum('mingguan','bulanan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode_mulai` date DEFAULT NULL,
  `periode_berakhir` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `opsi_pertanyaan`
--

CREATE TABLE `opsi_pertanyaan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertanyaan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `urutan` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pemasukan_keuangan`
--

CREATE TABLE `pemasukan_keuangan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `nominal` bigint NOT NULL,
  `deskripsi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bukti` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nominal_kas_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_uang_kas` tinyint(1) NOT NULL DEFAULT '0',
  `jenis_pembayaran_kas` enum('normal','lebih') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_pembayaran` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peminjaman_aset`
--

CREATE TABLE `peminjaman_aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aset_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `peminjam_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_peminjam` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institusi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keperluan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_pinjam` date NOT NULL,
  `tanggal_kembali_rencana` date NOT NULL,
  `tanggal_kembali_aktual` date DEFAULT NULL,
  `status` enum('dipinjam','dikembalikan','terlambat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dipinjam',
  `surat_peminjaman_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `diproses_oleh` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengaturan_piket`
--

CREATE TABLE `pengaturan_piket` (
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ada_denda` tinyint(1) NOT NULL DEFAULT '0',
  `nominal_denda` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran_keuangan`
--

CREATE TABLE `pengeluaran_keuangan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `nominal` bigint NOT NULL,
  `deskripsi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bukti` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengumpulan_tugas`
--

CREATE TABLE `pengumpulan_tugas` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tugas_praktikum_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `praktikan_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_pengumpulan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nilai` decimal(5,2) DEFAULT NULL,
  `status` enum('dikumpulkan','dinilai','terlambat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dikumpulkan',
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dinilai_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `periode_piket`
--

CREATE TABLE `periode_piket` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `isactive` tinyint(1) NOT NULL DEFAULT '0',
  `lama_piket` int UNSIGNED NOT NULL DEFAULT '120',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permohonan_aset`
--

CREATE TABLE `permohonan_aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_pemohon_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `laboratorium_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_permohonan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_permohonan` date NOT NULL,
  `alasan_umum_pengadaan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_permohonan` enum('diajukan','disetujui','ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diajukan',
  `catatan_approval` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `approved_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pertanyaan_kuesioner`
--

CREATE TABLE `pertanyaan_kuesioner` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kuesioner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertanyaan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_pertanyaan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wajib_diisi` tinyint(1) NOT NULL DEFAULT '0',
  `urutan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pertemuan_praktikum`
--

CREATE TABLE `pertemuan_praktikum` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelas_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tanggal` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `praktikan`
--

CREATE TABLE `praktikan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nim` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `angkatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_hp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `praktikan_praktikum`
--

CREATE TABLE `praktikan_praktikum` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `praktikan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelas_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('aktif','nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `praktikum`
--

CREATE TABLE `praktikum` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mata_kuliah` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mata_kuliah_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profile`
--

CREATE TABLE `profile` (
  `nomor_induk` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kelamin` enum('laki-laki','perempuan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto_profile` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanda_tangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_hp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_lahir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `nomor_anggota` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proker`
--

CREATE TABLE `proker` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `struktur_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_proker` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tujuan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sasaran` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `output_kegiatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('belum_mulai','sedang_berjalan','selesai','ditunda') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'belum_mulai',
  `status_pengajuan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kendala` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `solusi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `saran` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status_evaluasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_proker` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proker_parameter`
--

CREATE TABLE `proker_parameter` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proker_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_parameter` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bobot` smallint UNSIGNED NOT NULL DEFAULT '0',
  `capaian` smallint UNSIGNED DEFAULT NULL,
  `urutan` smallint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proker_pj`
--

CREATE TABLE `proker_pj` (
  `proker_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `respon_kuesioner`
--

CREATE TABLE `respon_kuesioner` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kuesioner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_submit` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_kondisi_aset`
--

CREATE TABLE `riwayat_kondisi_aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aset_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kondisi_sebelum` enum('baik','rusak','hilang') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kondisi_sesudah` enum('baik','rusak','hilang') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dicatat_oleh` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_has_permissions`
--

CREATE TABLE `role_has_permissions` (
  `permission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sertifikat`
--

CREATE TABLE `sertifikat` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_sertifikat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_sertifikat` enum('asisten','praktikan','kepengurusan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_terbit` date NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sertifikat_templates`
--

CREATE TABLE `sertifikat_templates` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` enum('kegiatan','praktikum','aslab','umum') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `struktur`
--

CREATE TABLE `struktur` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `struktur` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jabatan_tunggal` tinyint(1) NOT NULL DEFAULT '1',
  `default_role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `struktur_permissions`
--

CREATE TABLE `struktur_permissions` (
  `struktur_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surat_keluar`
--

CREATE TABLE `surat_keluar` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_urut` int UNSIGNED NOT NULL,
  `nomor_surat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `perihal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tujuan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_surat` date NOT NULL,
  `isi_ringkas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_surat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_klasifikasi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dibuat_oleh` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surat_masuk`
--

CREATE TABLE `surat_masuk` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kepengurusan_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_agenda` int UNSIGNED NOT NULL,
  `nomor_surat_asal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `asal_surat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `perihal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_surat` date NOT NULL,
  `tanggal_terima` date NOT NULL,
  `isi_ringkas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_surat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diterima_oleh` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tahun_kepengurusan`
--

CREATE TABLE `tahun_kepengurusan` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isactive` tinyint(1) NOT NULL DEFAULT '0',
  `mulai` date NOT NULL,
  `selesai` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `target_kuesioner`
--

CREATE TABLE `target_kuesioner` (
  `kuesioner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `template_surat_peminjaman`
--

CREATE TABLE `template_surat_peminjaman` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_template` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `laboratorium_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tugas_praktikum`
--

CREATE TABLE `tugas_praktikum` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertemuan_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelas_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul_tugas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_tugas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deadline` datetime NOT NULL,
  `status` enum('aktif','nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_lab_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wishlist_aset`
--

CREATE TABLE `wishlist_aset` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permohonan_aset_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_barang` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_barang` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spesifikasi_teknis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `perkiraan_harga` decimal(15,2) DEFAULT NULL,
  `jumlah_diminta` int NOT NULL DEFAULT '1',
  `satuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urgensi` enum('rendah','sedang','tinggi','sangat_tinggi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sedang',
  `referensi_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_item` enum('diajukan','disetujui','ditolak','dipesan','diterima') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diajukan',
  `jumlah_disetujui` int DEFAULT NULL,
  `catatan_item` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi`
--
ALTER TABLE `absensi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `absensi_jadwal_piket_foreign` (`jadwal_piket_id`),
  ADD KEY `absensi_manual_input_by_foreign` (`manual_input_by`),
  ADD KEY `absensi_verified_by_foreign` (`verified_by`);

--
-- Indexes for table `absensi_aslab`
--
ALTER TABLE `absensi_aslab`
  ADD PRIMARY KEY (`id`),
  ADD KEY `absensi_aslab_pertemuan_id_foreign` (`pertemuan_id`),
  ADD KEY `absensi_aslab_aslab_praktikum_id_foreign` (`aslab_praktikum_id`);

--
-- Indexes for table `absensi_praktikan`
--
ALTER TABLE `absensi_praktikan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `absensi_praktikan_pertemuan_id_foreign` (`pertemuan_id`),
  ADD KEY `absensi_praktikan_praktikan_praktikum_id_foreign` (`praktikan_praktikum_id`);

--
-- Indexes for table `aset`
--
ALTER TABLE `aset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detail_aset_aset_id_foreign` (`kategori_aset_id`),
  ADD KEY `detail_aset_laboratorium_id_foreign` (`laboratorium_id`),
  ADD KEY `detail_aset_wishlist_aset_id_foreign` (`wishlist_aset_id`);

--
-- Indexes for table `aslab_praktikum`
--
ALTER TABLE `aslab_praktikum`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `aslab_praktikum_praktikum_id_user_id_unique` (`praktikum_id`,`user_id`),
  ADD KEY `aslab_praktikum_praktikum_id_foreign` (`praktikum_id`),
  ADD KEY `aslab_praktikum_user_id_foreign` (`user_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `disposisi_surat`
--
ALTER TABLE `disposisi_surat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `disposisi_surat_surat_masuk_id_foreign` (`surat_masuk_id`),
  ADD KEY `disposisi_surat_dari_user_id_foreign` (`dari_user_id`),
  ADD KEY `disposisi_surat_kepada_user_id_foreign` (`kepada_user_id`);

--
-- Indexes for table `dokumentasi_kegiatan`
--
ALTER TABLE `dokumentasi_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dokumentasi_kegiatan_kegiatan_id_foreign` (`kegiatan_id`),
  ADD KEY `dokumentasi_kegiatan_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `ganti_jadwal_piket`
--
ALTER TABLE `ganti_jadwal_piket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ganti_jadwal_piket_jadwal_piket_id_foreign` (`jadwal_piket_id`),
  ADD KEY `ganti_jadwal_piket_approved_by_foreign` (`approved_by`),
  ADD KEY `ganti_jadwal_piket_periode_piket_id_status_index` (`periode_piket_id`,`status`),
  ADD KEY `ganti_jadwal_piket_user_id_status_index` (`user_id`,`status`),
  ADD KEY `ganti_jadwal_piket_status_created_at_index` (`status`,`created_at`);

--
-- Indexes for table `jadwal_piket`
--
ALTER TABLE `jadwal_piket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jadwal_piket_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`),
  ADD KEY `jadwal_piket_user_id_foreign` (`user_id`);

--
-- Indexes for table `jawaban_kuesioner`
--
ALTER TABLE `jawaban_kuesioner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jawaban_kuesioner_respon_id_foreign` (`respon_id`),
  ADD KEY `jawaban_kuesioner_pertanyaan_id_foreign` (`pertanyaan_id`),
  ADD KEY `jawaban_kuesioner_opsi_id_foreign` (`opsi_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori_aset`
--
ALTER TABLE `kategori_aset`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_proker_id_foreign` (`proker_id`),
  ADD KEY `kegiatan_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `kegiatan_peserta`
--
ALTER TABLE `kegiatan_peserta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_peserta_kegiatan_id_foreign` (`kegiatan_id`),
  ADD KEY `kegiatan_peserta_user_id_foreign` (`user_id`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kelas_praktikum_id_nama_kelas_index` (`praktikum_id`,`nama_kelas`),
  ADD KEY `kelas_parent_kelas_id_index` (`parent_kelas_id`);

--
-- Indexes for table `kepengurusan_lab`
--
ALTER TABLE `kepengurusan_lab`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kepengurusan_lab_tahun_kepengurusan_id_foreign` (`tahun_kepengurusan_id`),
  ADD KEY `kepengurusan_lab_laboratorium_id_foreign` (`laboratorium_id`),
  ADD KEY `kepengurusan_lab_lab_active_idx` (`laboratorium_id`,`is_active`);

--
-- Indexes for table `kepengurusan_user`
--
ALTER TABLE `kepengurusan_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kepengurusan_user_kepengurusan_lab_id_user_id_unique` (`kepengurusan_lab_id`,`user_id`),
  ADD KEY `kepengurusan_user_user_id_foreign` (`user_id`),
  ADD KEY `kepengurusan_user_struktur_id_foreign` (`struktur_id`);

--
-- Indexes for table `komponen_rubrik`
--
ALTER TABLE `komponen_rubrik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `komponen_rubrik_tugas_praktikum_id_foreign` (`tugas_praktikum_id`);

--
-- Indexes for table `konfigurasi_surat`
--
ALTER TABLE `konfigurasi_surat`
  ADD PRIMARY KEY (`kepengurusan_lab_id`),
  ADD UNIQUE KEY `konfigurasi_surat_kepengurusan_lab_id_unique` (`kepengurusan_lab_id`);

--
-- Indexes for table `kuesioner`
--
ALTER TABLE `kuesioner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kuesioner_dibuat_oleh_foreign` (`dibuat_oleh`);

--
-- Indexes for table `laboratorium`
--
ALTER TABLE `laboratorium`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `laporan_kegiatan`
--
ALTER TABLE `laporan_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `laporan_kegiatan_kegiatan_id_foreign` (`kegiatan_id`);

--
-- Indexes for table `mata_kuliah`
--
ALTER TABLE `mata_kuliah`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mata_kuliah_kode_mata_kuliah_unique` (`kode_mata_kuliah`),
  ADD KEY `mata_kuliah_status_nama_index` (`status`,`nama`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`model_uuid`,`model_type`),
  ADD KEY `model_has_permissions_model_id_model_type_index` (`model_uuid`,`model_type`);

--
-- Indexes for table `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD PRIMARY KEY (`role_id`,`model_uuid`,`model_type`),
  ADD KEY `model_has_roles_model_id_model_type_index` (`model_uuid`,`model_type`);

--
-- Indexes for table `modul_praktikum`
--
ALTER TABLE `modul_praktikum`
  ADD PRIMARY KEY (`id`),
  ADD KEY `modul_praktikum_pertemuan_id_foreign` (`pertemuan_id`);

--
-- Indexes for table `nilai_rubrik`
--
ALTER TABLE `nilai_rubrik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nilai_rubrik_pengumpulan_tugas_id_foreign` (`pengumpulan_tugas_id`),
  ADD KEY `nilai_rubrik_dinilai_oleh_foreign` (`dinilai_oleh`),
  ADD KEY `idx_komponen_rubrik_temp` (`komponen_rubrik_id`);

--
-- Indexes for table `nilai_tambahan`
--
ALTER TABLE `nilai_tambahan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nilai_tambahan_diberikan_oleh_foreign` (`diberikan_oleh`),
  ADD KEY `nilai_tambahan_pengumpulan_tugas_id_foreign` (`pengumpulan_tugas_id`);

--
-- Indexes for table `nominal_kas`
--
ALTER TABLE `nominal_kas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nominal_kas_id_kep` (`id`,`kepengurusan_lab_id`),
  ADD KEY `nominal_kas_kepengurusan_lab_id_is_active_index` (`kepengurusan_lab_id`,`is_active`);

--
-- Indexes for table `opsi_pertanyaan`
--
ALTER TABLE `opsi_pertanyaan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `opsi_pertanyaan_pertanyaan_id_foreign` (`pertanyaan_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `pemasukan_keuangan`
--
ALTER TABLE `pemasukan_keuangan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pemasukan_keuangan_user_id_foreign` (`user_id`),
  ADD KEY `pemasukan_keuangan_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`),
  ADD KEY `idx_pemasukan_nominal_kas_id` (`nominal_kas_id`),
  ADD KEY `idx_pemasukan_nominal_kep` (`nominal_kas_id`,`kepengurusan_lab_id`);

--
-- Indexes for table `peminjaman_aset`
--
ALTER TABLE `peminjaman_aset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `peminjaman_aset_detail_aset_id_foreign` (`aset_id`),
  ADD KEY `peminjaman_aset_peminjam_id_foreign` (`peminjam_id`),
  ADD KEY `peminjaman_aset_diproses_oleh_foreign` (`diproses_oleh`);

--
-- Indexes for table `pengaturan_piket`
--
ALTER TABLE `pengaturan_piket`
  ADD PRIMARY KEY (`kepengurusan_lab_id`),
  ADD UNIQUE KEY `pengaturan_piket_kepengurusan_lab_id_unique` (`kepengurusan_lab_id`);

--
-- Indexes for table `pengeluaran_keuangan`
--
ALTER TABLE `pengeluaran_keuangan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pengeluaran_keuangan_user_id_foreign` (`user_id`),
  ADD KEY `pengeluaran_keuangan_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`);

--
-- Indexes for table `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pt_unique_tugas_praktikan` (`tugas_praktikum_id`,`praktikan_praktikum_id`),
  ADD KEY `pengumpulan_tugas_praktikan_praktikum_id_foreign` (`praktikan_praktikum_id`);

--
-- Indexes for table `periode_piket`
--
ALTER TABLE `periode_piket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `periode_piket_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `permohonan_aset`
--
ALTER TABLE `permohonan_aset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permohonan_aset_nomor_permohonan_unique` (`nomor_permohonan`),
  ADD KEY `permohonan_aset_user_pemohon_id_foreign` (`user_pemohon_id`),
  ADD KEY `permohonan_aset_laboratorium_id_foreign` (`laboratorium_id`),
  ADD KEY `permohonan_aset_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `pertanyaan_kuesioner`
--
ALTER TABLE `pertanyaan_kuesioner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pertanyaan_kuesioner_kuesioner_id_foreign` (`kuesioner_id`);

--
-- Indexes for table `pertemuan_praktikum`
--
ALTER TABLE `pertemuan_praktikum`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pertemuan_praktikum_kelas_id_foreign` (`kelas_id`);

--
-- Indexes for table `praktikan`
--
ALTER TABLE `praktikan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `praktikan_nim_praktikum_id_unique` (`nim`),
  ADD UNIQUE KEY `praktikan_user_id_unique` (`user_id`),
  ADD KEY `praktikan_user_id_foreign` (`user_id`);

--
-- Indexes for table `praktikan_praktikum`
--
ALTER TABLE `praktikan_praktikum`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `praktikan_praktikum_praktikan_id_praktikum_id_unique` (`praktikan_id`,`praktikum_id`),
  ADD KEY `praktikan_praktikum_praktikum_id_foreign` (`praktikum_id`),
  ADD KEY `praktikan_praktikum_kelas_id_foreign` (`kelas_id`);

--
-- Indexes for table `praktikum`
--
ALTER TABLE `praktikum`
  ADD PRIMARY KEY (`id`),
  ADD KEY `praktikum_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`),
  ADD KEY `praktikum_mata_kuliah_id_index` (`mata_kuliah_id`);

--
-- Indexes for table `profile`
--
ALTER TABLE `profile`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `profile_user_id_foreign` (`user_id`);

--
-- Indexes for table `proker`
--
ALTER TABLE `proker`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proker_struktur_id_foreign` (`struktur_id`),
  ADD KEY `proker_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`);

--
-- Indexes for table `proker_parameter`
--
ALTER TABLE `proker_parameter`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proker_parameter_proker_id_foreign` (`proker_id`);

--
-- Indexes for table `proker_pj`
--
ALTER TABLE `proker_pj`
  ADD PRIMARY KEY (`proker_id`,`user_id`),
  ADD UNIQUE KEY `proker_pj_proker_id_user_id_unique` (`proker_id`,`user_id`),
  ADD KEY `proker_pj_user_id_foreign` (`user_id`);

--
-- Indexes for table `respon_kuesioner`
--
ALTER TABLE `respon_kuesioner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `respon_kuesioner_kuesioner_id_foreign` (`kuesioner_id`),
  ADD KEY `respon_kuesioner_user_id_foreign` (`user_id`);

--
-- Indexes for table `riwayat_kondisi_aset`
--
ALTER TABLE `riwayat_kondisi_aset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `riwayat_kondisi_aset_detail_aset_id_foreign` (`aset_id`),
  ADD KEY `riwayat_kondisi_aset_dicatat_oleh_foreign` (`dicatat_oleh`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`);

--
-- Indexes for table `sertifikat`
--
ALTER TABLE `sertifikat`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sertifikat_nomor_sertifikat_unique` (`nomor_sertifikat`),
  ADD KEY `sertifikat_user_id_foreign` (`user_id`),
  ADD KEY `sertifikat_kepengurusan_lab_id_foreign` (`kepengurusan_lab_id`),
  ADD KEY `sertifikat_praktikum_id_foreign` (`praktikum_id`);

--
-- Indexes for table `sertifikat_templates`
--
ALTER TABLE `sertifikat_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `struktur`
--
ALTER TABLE `struktur`
  ADD PRIMARY KEY (`id`),
  ADD KEY `struktur_default_role_id_foreign` (`default_role_id`),
  ADD KEY `struktur_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `struktur_permissions`
--
ALTER TABLE `struktur_permissions`
  ADD PRIMARY KEY (`struktur_id`,`permission_id`),
  ADD UNIQUE KEY `struktur_permissions_struktur_id_permission_id_unique` (`struktur_id`,`permission_id`),
  ADD KEY `struktur_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `surat_keluar`
--
ALTER TABLE `surat_keluar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `surat_keluar_kepengurusan_lab_id_nomor_urut_unique` (`kepengurusan_lab_id`,`nomor_urut`),
  ADD UNIQUE KEY `surat_keluar_nomor_surat_unique` (`nomor_surat`),
  ADD KEY `surat_keluar_dibuat_oleh_foreign` (`dibuat_oleh`);

--
-- Indexes for table `surat_masuk`
--
ALTER TABLE `surat_masuk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `surat_masuk_kepengurusan_lab_id_nomor_agenda_unique` (`kepengurusan_lab_id`,`nomor_agenda`),
  ADD KEY `surat_masuk_diterima_oleh_foreign` (`diterima_oleh`);

--
-- Indexes for table `tahun_kepengurusan`
--
ALTER TABLE `tahun_kepengurusan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `target_kuesioner`
--
ALTER TABLE `target_kuesioner`
  ADD PRIMARY KEY (`kuesioner_id`,`role_id`),
  ADD KEY `target_kuesioner_kuesioner_id_foreign` (`kuesioner_id`),
  ADD KEY `target_kuesioner_role_id_foreign` (`role_id`);

--
-- Indexes for table `template_surat_peminjaman`
--
ALTER TABLE `template_surat_peminjaman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `template_surat_peminjaman_laboratorium_id_foreign` (`laboratorium_id`);

--
-- Indexes for table `tugas_praktikum`
--
ALTER TABLE `tugas_praktikum`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tugas_praktikum_kelas_id_praktikum_id_index` (`kelas_id`),
  ADD KEY `tugas_praktikum_pertemuan_id_foreign` (`pertemuan_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_laboratory_id_foreign` (`access_lab_id`);

--
-- Indexes for table `wishlist_aset`
--
ALTER TABLE `wishlist_aset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wishlist_aset_permohonan_aset_id_foreign` (`permohonan_aset_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aslab_praktikum`
--
ALTER TABLE `aslab_praktikum`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi`
--
ALTER TABLE `absensi`
  ADD CONSTRAINT `absensi_jadwal_piket_id_foreign` FOREIGN KEY (`jadwal_piket_id`) REFERENCES `jadwal_piket` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_manual_input_by_foreign` FOREIGN KEY (`manual_input_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensi_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `absensi_aslab`
--
ALTER TABLE `absensi_aslab`
  ADD CONSTRAINT `absensi_aslab_aslab_praktikum_id_foreign` FOREIGN KEY (`aslab_praktikum_id`) REFERENCES `aslab_praktikum` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_aslab_pertemuan_id_foreign` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `absensi_praktikan`
--
ALTER TABLE `absensi_praktikan`
  ADD CONSTRAINT `absensi_praktikan_pertemuan_id_foreign` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_praktikum` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_praktikan_praktikan_praktikum_id_foreign` FOREIGN KEY (`praktikan_praktikum_id`) REFERENCES `praktikan_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `aset`
--
ALTER TABLE `aset`
  ADD CONSTRAINT `detail_aset_aset_id_foreign` FOREIGN KEY (`kategori_aset_id`) REFERENCES `kategori_aset` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_aset_laboratorium_id_foreign` FOREIGN KEY (`laboratorium_id`) REFERENCES `laboratorium` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `detail_aset_wishlist_aset_id_foreign` FOREIGN KEY (`wishlist_aset_id`) REFERENCES `wishlist_aset` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `aslab_praktikum`
--
ALTER TABLE `aslab_praktikum`
  ADD CONSTRAINT `aslab_praktikum_praktikum_id_foreign` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `aslab_praktikum_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `disposisi_surat`
--
ALTER TABLE `disposisi_surat`
  ADD CONSTRAINT `disposisi_surat_dari_user_id_foreign` FOREIGN KEY (`dari_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `disposisi_surat_kepada_user_id_foreign` FOREIGN KEY (`kepada_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `disposisi_surat_surat_masuk_id_foreign` FOREIGN KEY (`surat_masuk_id`) REFERENCES `surat_masuk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dokumentasi_kegiatan`
--
ALTER TABLE `dokumentasi_kegiatan`
  ADD CONSTRAINT `dokumentasi_kegiatan_kegiatan_id_foreign` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dokumentasi_kegiatan_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ganti_jadwal_piket`
--
ALTER TABLE `ganti_jadwal_piket`
  ADD CONSTRAINT `ganti_jadwal_piket_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ganti_jadwal_piket_jadwal_piket_id_foreign` FOREIGN KEY (`jadwal_piket_id`) REFERENCES `jadwal_piket` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ganti_jadwal_piket_periode_piket_id_foreign` FOREIGN KEY (`periode_piket_id`) REFERENCES `periode_piket` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ganti_jadwal_piket_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jadwal_piket`
--
ALTER TABLE `jadwal_piket`
  ADD CONSTRAINT `jadwal_piket_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jadwal_piket_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jawaban_kuesioner`
--
ALTER TABLE `jawaban_kuesioner`
  ADD CONSTRAINT `jawaban_kuesioner_opsi_id_foreign` FOREIGN KEY (`opsi_id`) REFERENCES `opsi_pertanyaan` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `jawaban_kuesioner_pertanyaan_id_foreign` FOREIGN KEY (`pertanyaan_id`) REFERENCES `pertanyaan_kuesioner` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jawaban_kuesioner_respon_id_foreign` FOREIGN KEY (`respon_id`) REFERENCES `respon_kuesioner` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD CONSTRAINT `kegiatan_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `kegiatan_proker_id_foreign` FOREIGN KEY (`proker_id`) REFERENCES `proker` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kegiatan_peserta`
--
ALTER TABLE `kegiatan_peserta`
  ADD CONSTRAINT `kegiatan_peserta_kegiatan_id_foreign` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kegiatan_peserta_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kelas`
--
ALTER TABLE `kelas`
  ADD CONSTRAINT `kelas_parent_kelas_id_foreign` FOREIGN KEY (`parent_kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_praktikum_id_foreign` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kepengurusan_lab`
--
ALTER TABLE `kepengurusan_lab`
  ADD CONSTRAINT `kepengurusan_lab_laboratorium_id_foreign` FOREIGN KEY (`laboratorium_id`) REFERENCES `laboratorium` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kepengurusan_lab_tahun_kepengurusan_id_foreign` FOREIGN KEY (`tahun_kepengurusan_id`) REFERENCES `tahun_kepengurusan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kepengurusan_user`
--
ALTER TABLE `kepengurusan_user`
  ADD CONSTRAINT `kepengurusan_user_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kepengurusan_user_struktur_id_foreign` FOREIGN KEY (`struktur_id`) REFERENCES `struktur` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kepengurusan_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `komponen_rubrik`
--
ALTER TABLE `komponen_rubrik`
  ADD CONSTRAINT `komponen_rubrik_tugas_praktikum_id_foreign` FOREIGN KEY (`tugas_praktikum_id`) REFERENCES `tugas_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `konfigurasi_surat`
--
ALTER TABLE `konfigurasi_surat`
  ADD CONSTRAINT `konfigurasi_surat_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kuesioner`
--
ALTER TABLE `kuesioner`
  ADD CONSTRAINT `kuesioner_dibuat_oleh_foreign` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `laporan_kegiatan`
--
ALTER TABLE `laporan_kegiatan`
  ADD CONSTRAINT `laporan_kegiatan_kegiatan_id_foreign` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `modul_praktikum`
--
ALTER TABLE `modul_praktikum`
  ADD CONSTRAINT `modul_praktikum_pertemuan_id_foreign` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nilai_rubrik`
--
ALTER TABLE `nilai_rubrik`
  ADD CONSTRAINT `nilai_rubrik_dinilai_oleh_foreign` FOREIGN KEY (`dinilai_oleh`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_rubrik_komponen_rubrik_id_foreign` FOREIGN KEY (`komponen_rubrik_id`) REFERENCES `komponen_rubrik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_rubrik_pengumpulan_tugas_id_foreign` FOREIGN KEY (`pengumpulan_tugas_id`) REFERENCES `pengumpulan_tugas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nilai_tambahan`
--
ALTER TABLE `nilai_tambahan`
  ADD CONSTRAINT `nilai_tambahan_diberikan_oleh_foreign` FOREIGN KEY (`diberikan_oleh`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_tambahan_pengumpulan_tugas_id_foreign` FOREIGN KEY (`pengumpulan_tugas_id`) REFERENCES `pengumpulan_tugas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nominal_kas`
--
ALTER TABLE `nominal_kas`
  ADD CONSTRAINT `nominal_kas_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `opsi_pertanyaan`
--
ALTER TABLE `opsi_pertanyaan`
  ADD CONSTRAINT `opsi_pertanyaan_pertanyaan_id_foreign` FOREIGN KEY (`pertanyaan_id`) REFERENCES `pertanyaan_kuesioner` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pemasukan_keuangan`
--
ALTER TABLE `pemasukan_keuangan`
  ADD CONSTRAINT `fk_pemasukan_nominal_kas_id` FOREIGN KEY (`nominal_kas_id`) REFERENCES `nominal_kas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pemasukan_nominal_kep` FOREIGN KEY (`nominal_kas_id`,`kepengurusan_lab_id`) REFERENCES `nominal_kas` (`id`, `kepengurusan_lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `pemasukan_keuangan_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pemasukan_keuangan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `peminjaman_aset`
--
ALTER TABLE `peminjaman_aset`
  ADD CONSTRAINT `peminjaman_aset_aset_id_foreign` FOREIGN KEY (`aset_id`) REFERENCES `aset` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peminjaman_aset_diproses_oleh_foreign` FOREIGN KEY (`diproses_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `peminjaman_aset_peminjam_id_foreign` FOREIGN KEY (`peminjam_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengaturan_piket`
--
ALTER TABLE `pengaturan_piket`
  ADD CONSTRAINT `pengaturan_piket_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pengeluaran_keuangan`
--
ALTER TABLE `pengeluaran_keuangan`
  ADD CONSTRAINT `pengeluaran_keuangan_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pengeluaran_keuangan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD CONSTRAINT `pengumpulan_tugas_praktikan_praktikum_id_foreign` FOREIGN KEY (`praktikan_praktikum_id`) REFERENCES `praktikan_praktikum` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pengumpulan_tugas_tugas_praktikum_id_foreign` FOREIGN KEY (`tugas_praktikum_id`) REFERENCES `tugas_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `periode_piket`
--
ALTER TABLE `periode_piket`
  ADD CONSTRAINT `periode_piket_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permohonan_aset`
--
ALTER TABLE `permohonan_aset`
  ADD CONSTRAINT `permohonan_aset_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `permohonan_aset_laboratorium_id_foreign` FOREIGN KEY (`laboratorium_id`) REFERENCES `laboratorium` (`id`),
  ADD CONSTRAINT `permohonan_aset_user_pemohon_id_foreign` FOREIGN KEY (`user_pemohon_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `pertanyaan_kuesioner`
--
ALTER TABLE `pertanyaan_kuesioner`
  ADD CONSTRAINT `pertanyaan_kuesioner_kuesioner_id_foreign` FOREIGN KEY (`kuesioner_id`) REFERENCES `kuesioner` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pertemuan_praktikum`
--
ALTER TABLE `pertemuan_praktikum`
  ADD CONSTRAINT `pertemuan_praktikum_kelas_id_foreign` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `praktikan`
--
ALTER TABLE `praktikan`
  ADD CONSTRAINT `praktikan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `praktikan_praktikum`
--
ALTER TABLE `praktikan_praktikum`
  ADD CONSTRAINT `praktikan_praktikum_kelas_id_foreign` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `praktikan_praktikum_praktikan_id_foreign` FOREIGN KEY (`praktikan_id`) REFERENCES `praktikan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `praktikan_praktikum_praktikum_id_foreign` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `praktikum`
--
ALTER TABLE `praktikum`
  ADD CONSTRAINT `praktikum_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `praktikum_mata_kuliah_id_foreign` FOREIGN KEY (`mata_kuliah_id`) REFERENCES `mata_kuliah` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `profile`
--
ALTER TABLE `profile`
  ADD CONSTRAINT `profile_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proker`
--
ALTER TABLE `proker`
  ADD CONSTRAINT `proker_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proker_struktur_id_foreign` FOREIGN KEY (`struktur_id`) REFERENCES `struktur` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proker_parameter`
--
ALTER TABLE `proker_parameter`
  ADD CONSTRAINT `proker_parameter_proker_id_foreign` FOREIGN KEY (`proker_id`) REFERENCES `proker` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proker_pj`
--
ALTER TABLE `proker_pj`
  ADD CONSTRAINT `proker_pj_proker_id_foreign` FOREIGN KEY (`proker_id`) REFERENCES `proker` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proker_pj_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `respon_kuesioner`
--
ALTER TABLE `respon_kuesioner`
  ADD CONSTRAINT `respon_kuesioner_kuesioner_id_foreign` FOREIGN KEY (`kuesioner_id`) REFERENCES `kuesioner` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `respon_kuesioner_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `riwayat_kondisi_aset`
--
ALTER TABLE `riwayat_kondisi_aset`
  ADD CONSTRAINT `riwayat_kondisi_aset_aset_id_foreign` FOREIGN KEY (`aset_id`) REFERENCES `aset` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `riwayat_kondisi_aset_dicatat_oleh_foreign` FOREIGN KEY (`dicatat_oleh`) REFERENCES `users` (`id`);

--
-- Constraints for table `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sertifikat`
--
ALTER TABLE `sertifikat`
  ADD CONSTRAINT `sertifikat_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`),
  ADD CONSTRAINT `sertifikat_praktikum_id_foreign` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum` (`id`),
  ADD CONSTRAINT `sertifikat_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `struktur`
--
ALTER TABLE `struktur`
  ADD CONSTRAINT `struktur_default_role_id_foreign` FOREIGN KEY (`default_role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `struktur_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `struktur` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `struktur_permissions`
--
ALTER TABLE `struktur_permissions`
  ADD CONSTRAINT `struktur_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `struktur_permissions_struktur_id_foreign` FOREIGN KEY (`struktur_id`) REFERENCES `struktur` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `surat_keluar`
--
ALTER TABLE `surat_keluar`
  ADD CONSTRAINT `surat_keluar_dibuat_oleh_foreign` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `surat_keluar_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `surat_masuk`
--
ALTER TABLE `surat_masuk`
  ADD CONSTRAINT `surat_masuk_diterima_oleh_foreign` FOREIGN KEY (`diterima_oleh`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `surat_masuk_kepengurusan_lab_id_foreign` FOREIGN KEY (`kepengurusan_lab_id`) REFERENCES `kepengurusan_lab` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `target_kuesioner`
--
ALTER TABLE `target_kuesioner`
  ADD CONSTRAINT `target_kuesioner_kuesioner_id_foreign` FOREIGN KEY (`kuesioner_id`) REFERENCES `kuesioner` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `target_kuesioner_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `template_surat_peminjaman`
--
ALTER TABLE `template_surat_peminjaman`
  ADD CONSTRAINT `template_surat_peminjaman_laboratorium_id_foreign` FOREIGN KEY (`laboratorium_id`) REFERENCES `laboratorium` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tugas_praktikum`
--
ALTER TABLE `tugas_praktikum`
  ADD CONSTRAINT `tugas_praktikum_kelas_id_foreign` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tugas_praktikum_pertemuan_id_foreign` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_praktikum` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_access_lab_id_foreign` FOREIGN KEY (`access_lab_id`) REFERENCES `laboratorium` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `wishlist_aset`
--
ALTER TABLE `wishlist_aset`
  ADD CONSTRAINT `wishlist_aset_permohonan_aset_id_foreign` FOREIGN KEY (`permohonan_aset_id`) REFERENCES `permohonan_aset` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
