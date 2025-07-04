from pathlib import Path
from typing import Optional
from models.workbook import Workbook

def parse_txt(file_path: Path) -> Optional[Workbook]:
    """Parses a TXT file and returns a Workbook object."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            # Placeholder for more sophisticated parsing
            content = f.read()
            # This is a very basic implementation.
            return Workbook(id=file_path.stem, title=file_path.stem)
    except Exception as e:
        print(f"Error parsing TXT {file_path}: {e}")
        return None
