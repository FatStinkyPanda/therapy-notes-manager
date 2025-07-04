from pathlib import Path
from data.file_parser import FileParser
from models.workbook import Workbook

class ImportManager:
    def __init__(self):
        self.file_parser = FileParser()

    def import_workbook(self, file_path: Path) -> Workbook:
        """Imports a workbook from a file."""
        return self.file_parser.parse(file_path)
