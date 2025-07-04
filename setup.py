import sys
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {
    "packages": ["os", "tkinter", "ttkbootstrap", "src.data"],
    "include_files": [("data", "data"), "icon.ico"],
}

# base="Win32GUI" should be used only for Windows GUI app
base = None
if sys.platform == "win32":
    base = "Win32GUI"

setup(
    name="TherapyNotesManager",
    version="0.1",
    description="Therapy Notes Manager",
    options={"build_exe": build_exe_options},
    executables=[Executable("run.py", base=base, icon="icon.ico")],
)
