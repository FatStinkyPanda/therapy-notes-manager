import logging
from string import Template
from typing import List, Dict, Optional
from datetime import datetime
from .config_manager import ConfigManager
from .custom_fields_manager import CustomFieldsManager
from ..models.client import Client
from ..models.note_template import NoteTemplate
from ..models.chapter import Chapter

class NotesEngine:
    def __init__(self, config_manager: ConfigManager, custom_fields_manager: CustomFieldsManager):
        self.config_manager = config_manager
        self.custom_fields_manager = custom_fields_manager

    def get_replacement_variables(self, chapters: List[Chapter]) -> Dict[str, str]:
        date_format = self.config_manager.get("date_format", "%Y-%m-%d")
        time_format = self.config_manager.get("time_format", "%H:%M")
        return {
            "date": datetime.now().strftime(date_format),
            "session_date": datetime.now().strftime(date_format),
            "session_time": datetime.now().strftime(time_format),
            "counselor_name": self.config_manager.get("counselor_name", "N/A"),
            "workbook_title": chapters[0].workbook_title if chapters else "N/A",
            "workbook_content": "\n".join([chapter.content for chapter in chapters]),
            "chapter_title": ", ".join([chapter.title for chapter in chapters]),
            "section_content": "\n".join([chapter.content for chapter in chapters]),
            "chapter_summary": "\n".join([chapter.content for chapter in chapters]),
            "session_duration": "N/A",
        }

    def generate_note(
        self,
        client: Client,
        template: NoteTemplate,
        chapters: List[Chapter],
        other_data: Dict[str, str]
    ) -> str:
        """Generates a note for a single client."""
        
        pronoun_map = {
            "he/him": {"He/She": "He", "his/her": "his"},
            "she/her": {"He/She": "She", "his/her": "her"},
            "they/them": {"He/She": "They", "his/her": "their"},
        }
        
        pronoun_data = {}
        if client.pronouns:
            pronoun_key = client.pronouns.lower()
            if pronoun_key in pronoun_map:
                pronoun_data = {
                    "Client_Pronoun_He/She": pronoun_map[pronoun_key]["He/She"],
                    "Client_Pronoun_his/her": pronoun_map[pronoun_key]["his/her"],
                }

        static_custom_fields = {
            field['name']: field['value']
            for field in self.custom_fields_manager.get_custom_fields()
            if not field.get('prompt') and field.get('value')
        }

        data = {
            "client_name": client.name,
            "client_id": client.id,
            "client_dob": client.dob,
            **self.get_replacement_variables(chapters),
            **pronoun_data,
            **static_custom_fields,
            **client.custom_fields,
            **other_data
        }
        
        logging.debug(f"Data for note generation: {data}")
        
        # Manually replace placeholders to support both $variable and ${variable}
        note_content = template.content
        for key, value in data.items():
            note_content = note_content.replace(f'${{{key}}}', str(value))
            note_content = note_content.replace(f'${key}', str(value))
            
        return note_content

    def generate_batch_notes(
        self, 
        clients: List[Client], 
        template: NoteTemplate,
        chapters: List[Chapter],
        other_data: Dict[str, str]
    ) -> Dict[str, str]:
        """Generates notes for a batch of clients."""
        notes = {}
        for client in clients:
            notes[client.id] = self.generate_note(client, template, chapters, other_data)
        return notes
