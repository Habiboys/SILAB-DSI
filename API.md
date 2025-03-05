# API Specification - Sistem Informasi Laboratorium (SILAB)

## 1. Authentication (Laravel Breeze)
### 1.1 User Login
**Endpoint:** `POST /login`
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string",
    "remember": "boolean"
  }
  ```
- **Response:**
  ```json
  {
    "token": "string",
    "user": {
      "id": "int",
      "name": "string",
      "email": "string"
    }
  }
  ```

### 1.2 User Logout
**Endpoint:** `POST /logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Logout successful"
  }
  ```

### 1.3 User Registration
**Endpoint:** `POST /register`
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "password_confirmation": "string"
  }
  ```

### 1.4 Get Authenticated User
**Endpoint:** `GET /api/user`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "int",
    "name": "string",
    "email": "string"
  }
  ```

### 1.5 Update Profile
**Endpoint:** `PUT /user/profile-information`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```

### 1.6 Update Password
**Endpoint:** `PUT /user/password`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "current_password": "string",
    "password": "string",
    "password_confirmation": "string"
  }
  ```

### 1.7 Forgot Password
**Endpoint:** `POST /forgot-password`
- **Request Body:**
  ```json
  {
    "email": "string"
  }
  ```

### 1.8 Reset Password
**Endpoint:** `POST /reset-password`
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string",
    "password_confirmation": "string",
    "token": "string"
  }
  ```

## 2. Keanggotaan
### 2.1 Get All Members
**Endpoint:** `GET /api/members`
- **Response:**
  ```json
  [
    {
      "id": "int",
      "name": "string",
      "nim": "string",
      "status": "string",
      "jabatan": "string",
      "tahun": "int"
    }
  ]
  ```

### 2.2 Add Member
**Endpoint:** `POST /api/members`
- **Request Body:**
  ```json
  {
    "name": "string",
    "nim": "string",
    "status": "string",
    "jabatan": "string",
    "tahun": "int"
  }
  ```

## 3. Keuangan
### 3.1 Get Financial Records
**Endpoint:** `GET /api/finance`
- **Response:**
  ```json
  [
    {
      "id": "int",
      "tanggal": "string",
      "deskripsi": "string",
      "jumlah": "number",
      "tipe": "string"
    }
  ]
  ```

### 3.2 Add Financial Record
**Endpoint:** `POST /api/finance`
- **Request Body:**
  ```json
  {
    "tanggal": "string",
    "deskripsi": "string",
    "jumlah": "number",
    "tipe": "string"
  }
  ```

## 4. Surat
### 4.1 Get Incoming Letters
**Endpoint:** `GET /api/letters/inbox`
- **Response:**
  ```json
  [
    {
      "id": "int",
      "tanggal": "string",
      "judul": "string",
      "pengirim": "string",
      "nomor_surat": "string"
    }
  ]
  ```

### 4.2 Send Letter
**Endpoint:** `POST /api/letters/outbox`
- **Request Body:**
  ```json
  {
    "tanggal": "string",
    "judul": "string",
    "penerima": "string",
    "nomor_surat": "string",
    "file": "string (URL)"
  }
  ```

## 5. Piket

### 5.1 Get Piket Schedule

**Endpoint:** `GET /api/piket/schedule`

- **Response:**
  ```json
  [
    {
      "id": "int",
      "hari": "string",
      "petugas": ["string"]
    }
  ]
  ```

### 5.2 Mark Attendance

**Endpoint:** `POST /api/piket/attendance`

- **Request Body:**
  ```json
  {
    "tanggal": "string",
    "nama": "string",
    "jam_mulai": "string",
    "jam_selesai": "string",
    "kegiatan": "string"
  }
  ```

## 6. Praktikum

### 6.1 Get Praktikum List

**Endpoint:** `GET /api/praktikum`

- **Response:**
  ```json
  [
    {
      "id": "int",
      "mata_kuliah": "string",
      "jadwal": "string",
      "kelas": "string",
      "ruangan": "string"
    }
  ]
  ```

### 6.2 Add Praktikum

**Endpoint:** `POST /api/praktikum`

- **Request Body:**
  ```json
  {
    "mata_kuliah": "string",
    "jadwal": "string",
    "kelas": "string",
    "ruangan": "string"
  }
  ```

## 7. Inventori

### 7.1 Get Inventory List

**Endpoint:** `GET /api/inventory`

- **Response:**
  ```json
  [
    {
      "id": "int",
      "nama": "string",
      "deskripsi": "string",
      "jumlah": "int"
    }
  ]
  ```

### 7.2 Add Inventory Item

**Endpoint:** `POST /api/inventory`

- **Request Body:**
  ```json
  {
    "nama": "string",
    "deskripsi": "string",
    "jumlah": "int"
  }
  ```
