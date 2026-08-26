#!/usr/bin/env python
"""
Setup script for Tapo Surveillance VMS Backend
"""

import os
import django
from django.conf import settings
from django.core.management import execute_from_command_line
import sys


def setup_django():
    """Initialize Django for setup operations."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'surveillance_vms.settings')
    django.setup()


def create_directories():
    """Create necessary storage directories."""
    from django.conf import settings
    
    directories = [
        settings.SURVEILLANCE_CONFIG['STORAGE_PATH'],
        settings.SURVEILLANCE_CONFIG['TEMP_PATH'],
        settings.SURVEILLANCE_CONFIG['SNAPSHOTS_PATH'],
        os.path.join(settings.BASE_DIR, 'logs')
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")


def create_superuser():
    """Create default superuser if none exists."""
    from django.contrib.auth.models import User
    
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@localhost',
            password='admin123'
        )
        print("Created superuser: admin / admin123")
        print("IMPORTANT: Change the default password after first login!")
    else:
        print("Superuser already exists")


def initialize_settings():
    """Initialize default system settings."""
    from apps.system.models import SystemSettings
    
    settings_obj = SystemSettings.get_settings()
    print(f"Initialized system settings: {settings_obj.app_name}")


def create_sample_data():
    """Create sample camera data for testing."""
    from apps.cameras.models import Camera
    
    if not Camera.objects.exists():
        # Create sample cameras
        sample_cameras = [
            {
                'name': 'Front Porch TC40',
                'ip_address': '192.168.1.110',
                'port': 554,
                'onvif_port': 2020,
                'username': 'admin',
                'password': 'password123',
                'location': 'Main Entrance & Walkway',
                'model': 'Tapo TC40 Outdoor Pan/Tilt'
            },
            {
                'name': 'Driveway & Gate TC40',
                'ip_address': '192.168.1.112',
                'port': 554,
                'onvif_port': 2020,
                'username': 'admin',
                'password': 'password123',
                'location': 'Driveway South View',
                'model': 'Tapo TC40 Outdoor Pan/Tilt'
            }
        ]
        
        for camera_data in sample_cameras:
            camera = Camera.objects.create(**camera_data)
            print(f"Created sample camera: {camera.name}")
    else:
        print("Cameras already exist")


def main():
    """Main setup function."""
    print("=== Tapo Surveillance VMS Backend Setup ===")
    
    # Check if this is the first run
    first_run = not os.path.exists('db.sqlite3')
    
    if first_run:
        print("\nFirst time setup detected...")
        
        # Run migrations
        print("\n1. Creating database and running migrations...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Setup Django
        setup_django()
        
        # Create directories
        print("\n2. Creating storage directories...")
        create_directories()
        
        # Create superuser
        print("\n3. Creating admin user...")
        create_superuser()
        
        # Initialize settings
        print("\n4. Initializing system settings...")
        initialize_settings()
        
        # Ask about sample data
        response = input("\n5. Create sample camera data for testing? (y/n): ")
        if response.lower().startswith('y'):
            create_sample_data()
        
        print("\n=== Setup Complete! ===")
        print("\nNext steps:")
        print("1. Edit .env file with your configuration")
        print("2. Start Redis server")
        print("3. Run: python manage.py runserver")
        print("4. Visit: http://127.0.0.1:8000/admin/")
        print("5. Login with: admin / admin123")
        print("\nIMPORTANT: Change the default admin password!")
        
    else:
        print("\nDatabase already exists. Running migrations only...")
        execute_from_command_line(['manage.py', 'migrate'])
        print("Migration complete!")


if __name__ == '__main__':
    main()