import json
import jsonschema
from pathlib import Path

class JsonHandler:
    def __init__(self, schema_path: Path):
        self.schema = self.load_json(schema_path)

    def load_json(self, file_path: Path) -> dict:
        """Loads a JSON file."""
        with open(file_path, 'r') as f:
            return json.load(f)

    def save_json(self, file_path: Path, data: dict):
        """Saves data to a JSON file."""
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def validate_json(self, data: dict) -> bool:
        """Validates data against the schema."""
        try:
            jsonschema.validate(instance=data, schema=self.schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            print(f"Validation error: {e.message}")
            return False
