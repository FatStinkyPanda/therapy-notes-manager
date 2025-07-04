@echo off
echo Creating virtual environment...
python -m venv installer_venv

echo Activating virtual environment...
call installer_venv\\Scripts\\activate.bat

echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo Creating executable and installer...
pyinstaller --name "TherapyNotesManager" ^
            --onefile ^
            --windowed ^
            --icon="icon.ico" ^
            --add-data "data;data" ^
            --add-data "icon.ico;." ^
            run.py

echo Deactivating virtual environment...
deactivate

echo Done. The installer can be found in the 'dist' directory.
