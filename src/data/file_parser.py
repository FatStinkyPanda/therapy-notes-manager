from pathlib import Path
from typing import Optional
from models.workbook import Workbook
from data.parsers.pdf_parser import parse_pdf
from data.parsers.txt_parser import parse_txt
from data.parsers.docx_parser import parse_docx

class FileParser:
    def parse(self, file_path: Path) -> Optional[Workbook]:
        """Parses a file and returns a Workbook object."""
        extension = file_path.suffix.lower()
        if extension == ".pdf":
            return parse_pdf(file_path)
        elif extension == ".txt":
            return parse_txt(file_path)
        elif extension == ".docx":
            return parse_docx(file_path)
        else:
            return None
