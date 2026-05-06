# ID Card Printing System (PICS)

A web-based ID card printing system built with **Laravel 12** + **React (Inertia.js)** and a **Python Flask** microservice for PDF generation.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** React 18, Inertia.js, Tailwind CSS, Radix UI
- **ID Card Engine:** Python 3.8+ (Flask microservice)
- **Database:** MySQL / MariaDB
- **Other:** Spatie Laravel Permission, Maatwebsite Excel

## Features

- Candidate management (add, bulk import via Excel, photo upload)
- NIK (employee ID) management
- ID card template management
- Single and batch ID card printing (output to PDF)
- Reprint support for existing candidates
- Role-based access control (Spatie Permission)
- Activity logging
- Department and job level management

## Architecture

```
Laravel App (port 8000)
    └── IdCardPrintingService  ──HTTP──►  Python Flask Service (port 5000)
                                              └── Generates PDF from card template + photo
```

The Python microservice detects a yellow marker (RGB: 246, 255, 0) on the card template image to position the candidate photo, then renders candidate details using Futura fonts.

## Quick Start

See [SETUP.md](SETUP.md) for the full setup guide.

### Requirements

| Requirement | Version |
|---|---|
| PHP | >= 8.2 |
| Composer | latest |
| Node.js & NPM | latest LTS |
| Python | >= 3.8 |
| MySQL / MariaDB | latest |

### Install & Run

```bash
# 1. Install PHP & JS dependencies
composer install
npm install

# 2. Configure environment
copy .env.example .env
php artisan key:generate
# Edit .env: database credentials, APP_URL, IDCARD_SERVICE_URL

# 3. Database
php artisan migrate
php artisan db:seed   # optional

# 4. Storage link & assets
php artisan storage:link
npm run build

# 5. Start Laravel
php artisan serve
```

```bash
# 6. Start Python microservice (in a separate terminal)
cd idcard_service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # edit paths to match your setup
python app.py
```

### Environment Variables

Add to your `.env`:

```env
IDCARD_SERVICE_URL=http://127.0.0.1:5000
IDCARD_SERVICE_TIMEOUT=60
```

## Project Structure

```
pics_system/
├── app/
│   ├── Http/Controllers/     # CandidateController, PrintIdCardController, etc.
│   ├── Models/               # Candidate, CardTemplate, Department, Joblevel, User
│   ├── Services/             # IdCardPrintingService (calls Python microservice)
│   ├── Imports/              # Excel import classes
│   └── Exports/              # Excel export/template classes
├── idcard_service/           # Python Flask microservice
│   ├── app.py
│   ├── config.py
│   └── fonts/                # Futura font files (not committed)
└── resources/views/          # Inertia/React entry point
```

## License

MIT
