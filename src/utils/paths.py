import sys
from pathlib import Path

class Paths:
    def __init__(self):
        if getattr(sys, 'frozen', False):
            # Running as a bundled executable (PyInstaller)
            self.ROOT = Path(sys._MEIPASS)
        else:
            # Running as a script
            self.ROOT = Path(__file__).parent.parent.parent

        self.DATA = self.ROOT / "data"
        self.CONFIG = self.DATA / "config"
        self.WORKBOOKS = self.DATA / "workbooks"
        self.TEMPLATES = self.DATA / "templates"
        self.PROJECTS = Path.home() / "Documents" / "TherapyNotesManager" / "projects"
        self.OUTPUT = self.ROOT / "output"

        # Ensure the projects directory exists
        self.PROJECTS.mkdir(parents=True, exist_ok=True)

    def get_config_path(self, filename: str) -> Path:
        """Returns the path to a config file."""
        return self.CONFIG / filename

PATHS = Paths()
