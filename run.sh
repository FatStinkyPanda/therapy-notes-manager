#!/bin/bash
echo "Installing dependencies..."
source venv/Scripts/activate
pip install -r requirements.txt
echo "Launching Therapy Notes Manager..."
python -m src.main
echo "Application closed."
read -p "Press any key to continue . . ."
