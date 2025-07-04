import json
from ..utils.paths import PATHS

class CustomFieldsManager:
    def __init__(self):
        self.custom_fields_file = PATHS.get_config_path("custom_fields.json")
        self.custom_fields = self.load_custom_fields()

    def load_custom_fields(self):
        try:
            with open(self.custom_fields_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def save_custom_fields(self):
        with open(self.custom_fields_file, 'w') as f:
            json.dump(self.custom_fields, f, indent=4)

    def add_custom_field(self, field_data):
        if 'name' not in field_data or not field_data['name']:
            raise ValueError("Field name cannot be empty.")
        
        # Ensure default for 'prompt' is set
        if 'prompt' not in field_data:
            field_data['prompt'] = False
        if 'value' not in field_data:
            field_data['value'] = ''
        if 'hint' not in field_data:
            field_data['hint'] = ''
        if 'type' not in field_data:
            field_data['type'] = 'text'
            
        self.custom_fields.append(field_data)
        self.save_custom_fields()

    def update_custom_field(self, old_field_name, new_field_data):
        if 'name' not in new_field_data or not new_field_data['name']:
            raise ValueError("Field name cannot be empty.")

        # Ensure default for 'prompt' is set
        if 'prompt' not in new_field_data:
            new_field_data['prompt'] = False
        if 'value' not in new_field_data:
            new_field_data['value'] = ''
        if 'hint' not in new_field_data:
            new_field_data['hint'] = ''
        if 'type' not in new_field_data:
            new_field_data['type'] = 'text'

        for i, field in enumerate(self.custom_fields):
            if field['name'] == old_field_name:
                self.custom_fields[i] = new_field_data
                self.save_custom_fields()
                return
        raise ValueError(f"Field '{old_field_name}' not found.")

    def remove_custom_field(self, field_name):
        self.custom_fields = [field for field in self.custom_fields if field['name'] != field_name]
        self.save_custom_fields()

    def get_custom_fields(self):
        return self.custom_fields
