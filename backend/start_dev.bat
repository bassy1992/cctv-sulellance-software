@echo off
echo === Tapo Surveillance VMS Development Server ===
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if database exists, if not run setup
if not exist "db.sqlite3" (
    echo First time setup detected...
    python setup.py
) else (
    echo Running migrations...
    python manage.py migrate
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please edit .env file with your configuration before starting the server.
    pause
)

echo.
echo === Starting Development Server ===
echo Server will be available at: http://127.0.0.1:8000
echo Admin interface at: http://127.0.0.1:8000/admin
echo API documentation at: http://127.0.0.1:8000/api
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Django development server
python manage.py runserver 127.0.0.1:8000