@echo off
echo "Installing dependencies..."
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo "Launching Therapy Notes Manager..."
python -m src.main
echo "Application closed."
pause
