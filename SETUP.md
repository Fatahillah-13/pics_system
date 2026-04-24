# 🚀 Setup Guide - ID Card Printing System

Panduan lengkap untuk setup sistem cetak ID Card dengan Laravel + Python Microservice.

## 📋 Prerequisites

- PHP >= 8.2
- Composer
- Node.js & NPM
- Python 3.8+
- MySQL/MariaDB

---

## 🔧 Setup Laravel Application

### 1. Clone & Install Dependencies

```bash
cd D:\sistem\pics_system

# Install PHP dependencies
composer install

# Install NPM dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate

# Edit .env file dan sesuaikan:
# - Database credentials
# - APP_URL
```

**Tambahkan ke `.env`:**
```env
# ID Card Printing Service
IDCARD_SERVICE_URL=http://127.0.0.1:5000
IDCARD_SERVICE_TIMEOUT=60
```

### 3. Database Setup

```bash
# Run migrations
php artisan migrate

# (Optional) Run seeders
php artisan db:seed
```

### 4. Storage Link

```bash
# Create storage symbolic link
php artisan storage:link
```

### 5. Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 6. Run Laravel Server

```bash
php artisan serve
```

Laravel akan berjalan di: `http://127.0.0.1:8000`

---

## 🐍 Setup Python Microservice

### 1. Navigasi ke Folder Service

```bash
cd idcard_service
```

### 2. Create Virtual Environment (Recommended)

```bash
# Create venv
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
# Copy .env file
copy .env.example .env
```

**Edit `.env` file:**
```env
DEBUG=True
HOST=127.0.0.1
PORT=5000

# PENTING: Sesuaikan path berikut
LARAVEL_PUBLIC_PATH=D:\sistem\pics_system\public
LARAVEL_STORAGE_PATH=D:\sistem\pics_system\storage\app\public
LARAVEL_BASE_URL=http://127.0.0.1:8000

CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

### 5. Setup Font Files

Buat folder `fonts/` dan copy file font:

```
idcard_service/
└── fonts/
    ├── Futura-Bold.ttf
    ├── FUTURAMEDIUM.TTF
    └── Futura.ttf
```

### 6. Run Python Service

```bash
python app.py
```

Python service akan berjalan di: `http://127.0.0.1:5000`

---

## ✅ Verification & Testing

### 1. Test Python Service Health

**Browser:**
```
http://127.0.0.1:5000/
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://127.0.0.1:5000/ -UseBasicParsing
```

**Expected Response:**
```json
{
  "service": "ID Card Printing Service",
  "status": "running",
  "version": "2.0"
}
```

### 2. Test dari Laravel (Tinker)

```bash
php artisan tinker
```

```php
// Test health check
app(\App\Services\IdCardPrintingService::class)->healthCheck()
// => true

// Get config
app(\App\Services\IdCardPrintingService::class)->getConfig()
// => array with configuration
```

### 3. Test via Browser

1. Login ke aplikasi Laravel: `http://127.0.0.1:8000`
2. Navigasi ke halaman Print ID Card
3. Pilih kandidat dan klik Print
4. PDF akan di-generate oleh Python service

---

## 📁 Struktur Folder Penting

```
pics_system/
├── app/
│   ├── Http/Controllers/
│   │   ├── PrintIdCardController.php      ← Print ID Cards
│   │   └── ReprintIdCardController.php    ← Reprint ID Cards
│   ├── Models/
│   │   ├── Candidate.php
│   │   └── CardTemplate.php
│   └── Services/
│       └── IdCardPrintingService.php      ← Service untuk call Python API
├── idcard_service/                         ← Python Microservice
│   ├── app.py                              ← Main Flask app
│   ├── config.py                           ← Configuration
│   ├── requirements.txt
│   ├── .env
│   └── fonts/                              ← Font files
├── storage/
│   └── app/
│       └── public/
│           ├── photos/                     ← Foto kandidat
│           ├── templates/                  ← Template ID card
│           └── idcards/                    ← Generated PDFs (auto-created)
└── public/
    └── storage → ../storage/app/public/   ← Symbolic link
```

---

## 🔄 Workflow

1. **User Upload Template** (via Settings → ID Card Template)
   - Upload template PNG/JPG dengan kotak kuning (RGB: 246,255,0) sebagai marker foto
   - Set department & joblevel yang menggunakan template ini

2. **User Upload Foto Kandidat**
   - Foto disimpan di `storage/app/public/photos/`

3. **User Print ID Card**
   - Laravel kirim request ke Python service (`POST http://127.0.0.1:5000/print`)
   - Python service:
     - Load template
     - Detect yellow box
     - Paste foto
     - Draw text (nama, departemen, level, employee_id)
     - Generate PDF
   - Return PDF URL ke Laravel
   - User download PDF

---

## 🐛 Troubleshooting

### Python Service tidak bisa diakses

**Cek service running:**
```powershell
netstat -ano | findstr :5000
```

**Restart service:**
```bash
# Stop dengan Ctrl+C
# Jalankan ulang
python app.py
```

### CORS Error

**Update `.env` di Python service:**
```env
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173
```

### Template/Foto tidak ditemukan

**Cek path di Python service `.env`:**
```env
LARAVEL_STORAGE_PATH=D:\sistem\pics_system\storage\app\public
```

**Cek file ada:**
```powershell
dir D:\sistem\pics_system\storage\app\public\photos
dir D:\sistem\pics_system\storage\app\public\templates
```

### Yellow box tidak terdeteksi

1. Pastikan template punya kotak dengan warna **RGB: (246, 255, 0)** - kuning terang
2. Edit `config.py` untuk adjust tolerance:
   ```python
   YELLOW_BOX_TOLERANCE = 20  # Default: 10
   ```

### Font tidak ditemukan

**Cek folder fonts:**
```powershell
dir idcard_service\fonts
```

**Pastikan ada:**
- Futura-Bold.ttf
- FUTURAMEDIUM.TTF
- Futura.ttf

---

## 🚀 Production Deployment

### Python Service

**Gunakan production WSGI server (Gunicorn/Waitress):**

```bash
pip install waitress

# Run with Waitress (Windows compatible)
waitress-serve --host=127.0.0.1 --port=5000 app:app
```

**Atau buat Windows Service dengan NSSM:**
```powershell
# Download NSSM dari https://nssm.cc/
nssm install IDCardService "D:\sistem\pics_system\idcard_service\venv\Scripts\python.exe" "D:\sistem\pics_system\idcard_service\app.py"
nssm start IDCardService
```

### Laravel

```bash
# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update .env
APP_ENV=production
APP_DEBUG=false
```

---

## 📞 Support

Untuk troubleshooting lebih lanjut, check:
- Laravel logs: `storage/logs/laravel.log`
- Python service console output
- Browser console (untuk CORS issues)

---

**Last Updated:** April 23, 2026
