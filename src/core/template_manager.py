from typing import List, Dict, Optional
from ..models.note_template import NoteTemplate
import uuid

class TemplateManager:
    def __init__(self):
        self.templates: Dict[str, NoteTemplate] = {}

    def get_template_by_id(self, template_id: str) -> Optional[NoteTemplate]:
        """Returns a specific template by its ID."""
        return self.templates.get(template_id)

    def get_template(self, name: str) -> Optional[NoteTemplate]:
        """Returns a specific template by its name."""
        for template in self.templates.values():
            if template.name == name:
                return template
        return None

    def get_all_templates(self) -> List[NoteTemplate]:
        """Returns all loaded templates."""
        return list(self.templates.values())

    def set_templates(self, templates: List[NoteTemplate]):
        """Sets the templates in the manager."""
        self.templates = {t.id: t for t in templates}

    def create_template(self, name: str, content: str, variables: Dict):
        """Creates a new template in memory."""
        template_id = str(uuid.uuid4())
        template = NoteTemplate(id=template_id, name=name, content=content, variables=variables)
        self.templates[template.id] = template

    def update_template(self, old_name: str, new_name: str, content: str, variables: Dict):
        """Updates an existing template in memory."""
        template = self.get_template(old_name)
        if template:
            template.name = new_name
            template.content = content
            template.variables = variables

    def delete_template(self, name: str):
        """Deletes a template from memory."""
        template = self.get_template(name)
        if template:
            del self.templates[template.id]
