#!/usr/bin/env python
"""Wait for services and run migrations before starting Django app."""

import os
import sys
import time
import socket
import subprocess

def wait_for_service(host, port, timeout=60):
    """Wait for a service to be available."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            socket.create_connection((host, port), timeout=2)
            print(f"✓ Service {host}:{port} is available")
            return True
        except (socket.timeout, ConnectionRefusedError):
            print(f"Waiting for {host}:{port}...")
            time.sleep(1)
    print(f"✗ Timeout waiting for {host}:{port}")
    return False

def run_command(cmd):
    """Run a shell command."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, check=False)
    return result.returncode == 0

def main():
    # Wait for PostgreSQL
    if not wait_for_service("db", 5432):
        print("PostgreSQL not available")
        sys.exit(1)
    
    # Wait for Redis
    if not wait_for_service("redis", 6379):
        print("Redis not available")
        sys.exit(1)
    
    # Run migrations
    print("\nApplying migrations...")
    run_command(["python", "manage.py", "migrate", "--noinput"])
    
    # Collect static files
    print("\nCollecting static files...")
    run_command(["python", "manage.py", "collectstatic", "--noinput"])
    
    print("\nStarting Gunicorn...")
    # Start Gunicorn
    os.execvp("gunicorn", ["gunicorn", "backend.wsgi:application", 
                          "--bind", "0.0.0.0:8000", "--workers", "4"])

if __name__ == "__main__":
    main()
