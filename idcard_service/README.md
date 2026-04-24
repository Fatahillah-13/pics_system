# ID Card Printing Service (Python Microservice)

Python Flask microservice untuk mencetak ID Card dengan integrasi Laravel.

## 📋 Fitur

- ✅ Deteksi kotak kuning (yellow box marker) untuk penempatan foto
- ✅ Custom letter spacing untuk text
- ✅ Batch processing multiple ID cards
- ✅ Output ke PDF
- ✅ CORS support untuk Laravel integration
- ✅ Comprehensive logging
- ✅ Health check endpoint

## 🚀 Setup

### 1. Install Python Dependencies

```bash
cd idcard_service
pip install -r requirements.txt
```

### 2. Setup Environment

```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env sesuai konfigurasi Anda
```

### 3. Setup Font Files

Buat folder `fonts/` dan letakkan file font berikut:
- `Futura-Bold.ttf`
- `FUTURAMEDIUM.TTF`
- `Futura.ttf`

Struktur folder:
```
idcard_service/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .env.example
├── README.md
└── fonts/
    ├── Futura-Bold.ttf
    ├── FUTURAMEDIUM.TTF
    └── Futura.ttf
```

### 4. Jalankan Service

```bash
python app.py
```

Service akan berjalan di `http://127.0.0.1:5000`

## 📡 API Endpoints

### Health Check
```
GET /
Response: {"service": "ID Card Printing Service", "status": "running", "version": "2.0"}
```

### Print ID Cards
```
POST /print
Content-Type: application/json

Body (array of candidates):
[
  {
    "name": "John Doe",
    "department": "IT Department",
    "job_level": "Senior Developer",
    "employee_id": "EMP001",
    "photo_filename": "photos/john_doe.jpg",
    "card_template": "templates/template_ctpat.png"
  }
]

Response:
[
  {
    "status": "success",
    "combined_output": "http://127.0.0.1:8000/storage/idcards/idcards_batch_20260423_120000.pdf",
    "total_idcards": 1,
    "total_errors": 0,
    "filename": "idcards_batch_20260423_120000.pdf"
  },
  {
    "employee_id": "EMP001",
    "status": "success"
  }
]
```

### Get Configuration
```
GET /config
Response: {"laravel_storage_path": "...", "output_dir": "...", ...}
```

## 🔧 Configuration

Edit `.env` file untuk konfigurasi:

```env
# Flask
DEBUG=True
HOST=127.0.0.1
PORT=5000

# Laravel Integration
LARAVEL_PUBLIC_PATH=D:\sistem\pics_system\public
LARAVEL_STORAGE_PATH=D:\sistem\pics_system\storage\app\public
LARAVEL_BASE_URL=http://127.0.0.1:8000

# CORS
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

## 📝 Template Requirements

Template gambar harus memiliki **kotak kuning** (RGB: 246, 255, 0) sebagai marker untuk posisi foto.

## 🧪 Testing

```bash
# Test health check
curl http://127.0.0.1:5000/

# Test get config
curl http://127.0.0.1:5000/config
```

## 📚 Laravel Integration

Di Laravel, service ini digunakan melalui `IdCardPrintingService`:

```php
use App\Services\IdCardPrintingService;

$service = app(IdCardPrintingService::class);

// Check service availability
$isAvailable = $service->healthCheck();

// Print cards
$result = $service->printCards($candidates);
```

## 🐛 Troubleshooting

### Service tidak bisa diakses dari Laravel
- Pastikan Python service sudah running
- Check CORS configuration di `.env`
- Pastikan port 5000 tidak digunakan aplikasi lain

### Font tidak ditemukan
- Pastikan font files ada di folder `fonts/`
- Check path di `config.py`

### Yellow box tidak terdeteksi
- Pastikan template memiliki kotak dengan warna RGB: [246, 255, 0]
- Adjust `YELLOW_BOX_TOLERANCE` di `config.py` jika perlu

## 📄 License

Proprietary - PICS System
