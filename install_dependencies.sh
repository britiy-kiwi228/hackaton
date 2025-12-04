#!/bin/bash

echo "================================================================================"
echo "Installing Python dependencies for Hackathon API"
echo "================================================================================"
echo

echo "Installing core dependencies..."
pip install fastapi==0.109.0
pip install uvicorn[standard]==0.27.0
pip install sqlalchemy==2.0.25
pip install python-multipart==0.0.6

echo
echo "Installing authentication dependencies..."
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install bcrypt==4.1.2

echo
echo "Installing pydantic..."
pip install pydantic==2.5.3
pip install pydantic-settings==2.1.0

echo
echo "Installing admin panel..."
pip install sqladmin==0.16.0

echo
echo "================================================================================"
echo "Installation complete!"
echo "================================================================================"
echo
echo "You can now run:"
echo "  python main.py"
echo "  python debug_auth.py"
echo