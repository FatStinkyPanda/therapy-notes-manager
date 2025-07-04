import os
import subprocess
import sys
import shutil

def create_executable():
    """Creates a Windows executable for the Therapy Notes Manager."""

    # --- Configuration ---
    APP_NAME = "TherapyNotesManager"
    ENTRY_POINT = "src/main.py"
    ICON_FILE = "icon.ico"
    VENV_DIR = "venv"

    # --- Check for virtual environment ---
    if not os.path.exists(VENV_DIR):
        print(f"Virtual environment '{VENV_DIR}' not found. Please create it first.")
        sys.exit(1)

    # --- Determine paths for the virtual environment ---
    if sys.platform == "win32":
        python_executable = os.path.join(VENV_DIR, "Scripts", "python.exe")
        pip_executable = os.path.join(VENV_DIR, "Scripts", "pip.exe")
    else:
        python_executable = os.path.join(VENV_DIR, "bin", "python")
        pip_executable = os.path.join(VENV_DIR, "bin", "pip")

    # --- Install PyInstaller if not present ---
    try:
        subprocess.check_call([pip_executable, "install", "pyinstaller"])
    except subprocess.CalledProcessError as e:
        print(f"Error installing PyInstaller: {e}")
        sys.exit(1)

    # --- Build the executable with PyInstaller ---
    pyinstaller_command = [
        python_executable,
        "-m", "PyInstaller",
        "--name", APP_NAME,
        "--onefile",
        "--windowed",
        f"--icon={ICON_FILE}",
        ENTRY_POINT
    ]

    print("Building executable...")
    try:
        subprocess.check_call(pyinstaller_command)
        print("Executable built successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        sys.exit(1)

    # --- Create necessary directories in the dist folder ---
    dist_path = os.path.join("dist", APP_NAME)
    if not os.path.exists(dist_path):
        os.makedirs(dist_path)

    data_dirs = [
        "data/config",
        "data/templates",
        "data/workbooks"
    ]

    for data_dir in data_dirs:
        dest_dir = os.path.join(dist_path, data_dir)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
            print(f"Created directory: {dest_dir}")

    print("Post-build setup complete.")

if __name__ == "__main__":
    create_executable()
