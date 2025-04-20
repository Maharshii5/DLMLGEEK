# TrustPort

**TrustPort** is a mobile-first web application built with **Flask**, designed to provide secure, efficient, and scalable features for user trust management, authentication workflows, or related verification services.

## 📱 Overview

TrustPort serves as a backend service for a mobile application, handling core logic, API routes, and dynamic rendering with HTML templates. It is structured with modularity in mind to support easy scaling and maintenance.
## 📸 Screenshots

### 🔹 Dashboard and Sample UI template
![TrustPort Dashboard](./TrustPort/images/dasahboardtp.jpg)
![TrustPort Dashboard](./TrustPort/images/dasahboard.tp2.jpg)
![UI](./TrustPort/images/dasahboard.tp3.jpg)



## 🚀 Features

- Flask-powered backend
- Modular architecture (`api.py`, `routes.py`, `models.py`, etc.)
- Secure instance and asset management
- Static file handling for frontend integration
- Templating using Jinja2 (`templates/`)
- Dependency management with `pyproject.toml` and `uv.lock`

## 🧩 Folder Structure

TrustPort/ ├── attached_assets/ # Static resources like images, icons ├── instance/ # Config or database instance files ├── static/ # CSS, JS, static content ├── templates/ # HTML templates for the UI ├── api.py # API endpoint logic ├── app.py # App creation and configuration ├── main.py # Entry point for running the app ├── models.py # Data models and ORM logic ├── routes.py # Route definitions ├── pyproject.toml # Project dependencies ├── uv.lock # Locked dependencies └── README.md # Project documentation


## ⚙️ Installation

### Prerequisites

- Python 3.8+
- `pip` package manager or `uv` (if using `uv` for ultra-fast installs)

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/yourusername/TrustPort.git
cd TrustPort

python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uv pip install -r requirements.txt
python main.py


