from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from config import config

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=config.CORS_ORIGINS)

# ==================== HELPER FUNCTIONS ====================

def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    """Load font with fallback to default"""
    try:
        return ImageFont.truetype(path, size)
    except IOError:
        logger.warning(f"⚠️ Font '{path}' not found. Using default.")
        return ImageFont.load_default()

# Load fonts at startup
fonts = {
    key: load_font(cfg["path"], cfg["size"])
    for key, cfg in config.FONT_CONFIG.items()
}

def validate_candidate_data(candidate: Dict) -> Tuple[bool, Optional[str]]:
    """Validate required fields in candidate data"""
    required_fields = ['name', 'department', 'job_level', 'employee_id', 'photo_filename', 'card_template']

    for field in required_fields:
        if field not in candidate or not candidate[field]:
            return False, f"Missing required field: {field}"

    return True, None

def get_template_path(template_filename: str) -> Path:
    """Get absolute path for template file"""
    # Template path dari Laravel storage (relatif dari storage/app/public)
    return config.TEMPLATE_BASE_PATH / template_filename

def get_photo_path(photo_filename: str) -> Path:
    """Get absolute path for photo file, handle extension conversion"""
    # Convert to .jpg if needed
    path = Path(photo_filename)
    if path.suffix.lower() != '.jpg':
        photo_filename = str(path.with_suffix('.jpg'))

    return config.PHOTO_BASE_PATH / photo_filename

def detect_yellow_box(template_np: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Detect yellow marker box in template image"""
    target_rgb = np.array(config.YELLOW_BOX_RGB)
    tolerance = config.YELLOW_BOX_TOLERANCE

    # Create mask for yellow pixels
    mask = np.all(np.abs(template_np - target_rgb) <= tolerance, axis=-1).astype(np.uint8) * 255

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return None

    # Return bounding box of largest contour
    x, y, w, h = cv2.boundingRect(contours[0])
    return x, y, w, h

def draw_text_with_spacing(
    draw: ImageDraw.Draw,
    text: str,
    y_pos: int,
    center_x: int,
    box_width: int,
    font: ImageFont.FreeTypeFont,
    letter_spacing: int = 0
) -> int:
    """Draw centered text with custom letter spacing, return text height"""
    # Calculate total width with spacing
    char_widths = []
    total_width = 0

    for char in text:
        bbox = draw.textbbox((0, 0), char, font=font)
        width = bbox[2] - bbox[0]
        char_widths.append(width)
        total_width += width

    total_width += letter_spacing * (len(text) - 1)

    # Calculate starting x position (centered)
    start_x = center_x - total_width // 2
    current_x = start_x

    # Draw each character
    for i, char in enumerate(text):
        draw.text((current_x, y_pos), char, fill='black', font=font)
        current_x += char_widths[i] + letter_spacing

    # Return text height
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]

def process_single_card(candidate: Dict) -> Dict:
    """Process a single ID card"""
    try:
        # Extract data (uppercase untuk nama, departemen, jabatan)
        nama = candidate.get("name", "").upper()
        departemen = candidate.get("department", "").upper()
        level = candidate.get("job_level", "").upper()
        employee_id = candidate.get("employee_id", "")
        foto_filename = candidate.get("photo_filename", "")
        card_template = candidate.get("card_template", "")

        # Validate
        is_valid, error_msg = validate_candidate_data(candidate)
        if not is_valid:
            raise ValueError(error_msg)

        # Get file paths
        template_path = get_template_path(card_template)
        foto_path = get_photo_path(foto_filename)

        logger.info(f"Processing card for: {nama} (ID: {employee_id})")
        logger.debug(f"Template: {template_path}")
        logger.debug(f"Photo: {foto_path}")

        # Validate file existence
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        if not foto_path.exists():
            raise FileNotFoundError(f"Photo not found: {foto_path}")

        # Load template and detect yellow box
        template = Image.open(template_path).convert('RGB')
        template_np = np.array(template)

        box_coords = detect_yellow_box(template_np)
        if not box_coords:
            raise ValueError("Yellow marker box not found in template")

        x, y, w, h = box_coords
        logger.debug(f"Yellow box found at: x={x}, y={y}, w={w}, h={h}")

        # Load and resize photo
        foto = Image.open(foto_path).convert('RGB')
        foto_resized = foto.resize((w, h), Image.Resampling.LANCZOS)

        # Paste photo onto template
        template.paste(foto_resized, (x, y))

        # Draw text
        draw = ImageDraw.Draw(template)
        center_x = x + w // 2

        # Calculate Y positions with proper spacing
        current_y = y + h + config.SPACING_CONFIG["foto_to_nama"]

        # Draw nama
        text_height = draw_text_with_spacing(
            draw, nama, current_y, center_x, w,
            fonts["nama"], config.FONT_CONFIG["nama"]["letter_spacing"]
        )
        current_y += text_height + config.SPACING_CONFIG["nama_to_departemen"]

        # Draw departemen
        text_height = draw_text_with_spacing(
            draw, departemen, current_y, center_x, w,
            fonts["departemen"], config.FONT_CONFIG["departemen"]["letter_spacing"]
        )
        current_y += text_height + config.SPACING_CONFIG["departemen_to_level"]

        # Draw level
        text_height = draw_text_with_spacing(
            draw, level, current_y, center_x, w,
            fonts["level"], config.FONT_CONFIG["level"]["letter_spacing"]
        )
        current_y += text_height + config.SPACING_CONFIG["level_to_employee_id"]

        # Draw employee_id
        draw_text_with_spacing(
            draw, employee_id, current_y, center_x, w,
            fonts["employee_id"], config.FONT_CONFIG["employee_id"]["letter_spacing"]
        )

        logger.info(f"✓ Card processed successfully for: {nama}")

        return {
            "employee_id": employee_id,
            "status": "success",
            "image": template.convert("RGB")
        }

    except Exception as e:
        logger.error(f"✗ Error processing card for {candidate.get('employee_id', 'unknown')}: {str(e)}")
        return {
            "employee_id": candidate.get("employee_id", "unknown"),
            "status": "error",
            "message": str(e)
        }

def build_public_url(relative_path: str) -> str:
    """Build public URL for file access"""
    # Remove base path and build URL
    normalized = relative_path.replace("\\", "/")
    if 'storage/' in normalized:
        path_part = normalized.split('storage/')[-1]
        return f"{config.LARAVEL_BASE_URL}/storage/{path_part}"
    return f"{config.LARAVEL_BASE_URL}/{normalized}"

# ==================== ROUTES ====================

@app.route("/", methods=["GET"])
def index():
    """Health check endpoint"""
    return jsonify({
        "service": "ID Card Printing Service",
        "status": "running",
        "version": "2.0"
    }), 200

@app.route("/print", methods=["POST"])
def print_id_card():
    """Main endpoint for printing ID cards"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        logger.info(f"📥 Received print request")

        # Handle single or batch requests
        candidates = data if isinstance(data, list) else [data]
        logger.info(f"Processing {len(candidates)} card(s)")

        # Process all cards
        results = []
        successful_images = []

        for candidate in candidates:
            result = process_single_card(candidate)

            # Store result
            if result["status"] == "success":
                successful_images.append(result.pop("image"))

            results.append(result)

        # Generate PDF if there are successful cards
        if successful_images:
            # Ensure output directory exists
            config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"idcards_batch_{timestamp}.pdf"
            output_path = config.OUTPUT_DIR / output_filename

            # Save as PDF
            successful_images[0].save(
                str(output_path),
                save_all=True,
                append_images=successful_images[1:] if len(successful_images) > 1 else [],
                format="PDF",
                resolution=300.0
            )

            logger.info(f"✓ PDF saved: {output_path}")

            # Build public URL
            relative_path = f"idcards/{output_filename}"
            public_url = f"{config.LARAVEL_BASE_URL}/storage/{relative_path}"

            # Insert summary at the beginning
            results.insert(0, {
                "status": "success",
                "combined_output": public_url,
                "total_idcards": len(successful_images),
                "total_errors": len(candidates) - len(successful_images),
                "filename": output_filename
            })

        logger.info(f"📤 Request completed. Success: {len(successful_images)}, Errors: {len(candidates) - len(successful_images)}")

        return jsonify(results), 200

    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/config", methods=["GET"])
def get_config():
    """Get current configuration (for debugging)"""
    return jsonify({
        "laravel_storage_path": str(config.LARAVEL_STORAGE_PATH),
        "output_dir": str(config.OUTPUT_DIR),
        "fonts_available": list(config.FONT_CONFIG.keys()),
        "cors_origins": config.CORS_ORIGINS
    }), 200

# ==================== MAIN ====================

if __name__ == "__main__":
    # Validate paths on startup
    logger.info("🚀 Starting ID Card Printing Service...")
    logger.info(f"📁 Laravel Storage: {config.LARAVEL_STORAGE_PATH}")
    logger.info(f"📁 Output Directory: {config.OUTPUT_DIR}")
    logger.info(f"🌐 CORS Origins: {config.CORS_ORIGINS}")

    # Create output directory if not exists
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Run Flask app
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
