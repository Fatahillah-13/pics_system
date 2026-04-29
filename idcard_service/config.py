import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))

    # Laravel Integration
    LARAVEL_PUBLIC_PATH = os.getenv('LARAVEL_PUBLIC_PATH', r'D:\sistem\pics_system\public')
    LARAVEL_STORAGE_PATH = os.getenv('LARAVEL_STORAGE_PATH', r'D:\sistem\pics_system\storage\app\public')
    LARAVEL_BASE_URL = os.getenv('LARAVEL_BASE_URL', 'http://10.10.16.125:8000')

    # Paths
    TEMPLATE_BASE_PATH = Path(LARAVEL_STORAGE_PATH)
    PHOTO_BASE_PATH = Path(LARAVEL_STORAGE_PATH)
    OUTPUT_DIR = Path(LARAVEL_STORAGE_PATH) / 'idcards'
    FONTS_DIR = Path(__file__).parent / 'fonts'

    # Image Processing
    MAX_FILE_SIZE_MB = 10
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

    # Yellow Box Detection (marker untuk posisi foto)
    YELLOW_BOX_RGB = [246, 255, 0]
    YELLOW_BOX_TOLERANCE = 10

    # Font Configuration
    FONT_CONFIG = {
        "nama": {
            "path": str(FONTS_DIR / "Futura-Bold.ttf"),
            "size": 40,
            "letter_spacing": 1
        },
        "departemen": {
            "path": str(FONTS_DIR / "FUTURAMEDIUM.TTF"),
            "size": 38,
            "letter_spacing": 2
        },
        "level": {
            "path": str(FONTS_DIR / "Futura.ttf"),
            "size": 36,
            "letter_spacing": 2
        },
        "employee_id": {
            "path": str(FONTS_DIR / "FUTURAMEDIUM.TTF"),
            "size": 36,
            "letter_spacing": 2
        }
    }

    # Spacing Configuration
    SPACING_CONFIG = {
        "foto_to_nama": 24,
        "nama_to_departemen": 40,
        "departemen_to_level": 28,
        "level_to_employee_id": 32
    }

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8000,http://127.0.0.1:8000,http://10.10.16.125:8000').split(',')

config = Config()
