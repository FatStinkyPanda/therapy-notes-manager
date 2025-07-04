from pathlib import Path
from data.json_handler import JsonHandler

SCHEMAS_DIR = Path(__file__).parent.parent.parent / "data" / "schemas"

def get_workbook_index_handler() -> JsonHandler:
    """Returns a JsonHandler for the workbook index schema."""
    schema_path = SCHEMAS_DIR / "workbook_index_schema.json"
    return JsonHandler(schema_path)

def get_workbook_handler() -> JsonHandler:
    """Returns a JsonHandler for the workbook schema."""
    schema_path = SCHEMAS_DIR / "workbook_schema.json"
    return JsonHandler(schema_path)

def get_chapter_handler() -> JsonHandler:
    """Returns a JsonHandler for the chapter schema."""
    schema_path = SCHEMAS_DIR / "chapter_schema.json"
    return JsonHandler(schema_path)

def get_content_handler() -> JsonHandler:
    """Returns a JsonHandler for the content schema."""
    schema_path = SCHEMAS_DIR / "content_schema.json"
    return JsonHandler(schema_path)
