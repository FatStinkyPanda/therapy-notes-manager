from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any
from .client import Client
from .workbook import Workbook
from .group import Group
from .note_template import NoteTemplate

@dataclass
class Session:
    clients: List[Client] = field(default_factory=list)
    workbooks: List[Workbook] = field(default_factory=list)
    groups: List[Group] = field(default_factory=list)
    templates: List[NoteTemplate] = field(default_factory=list)
    prompted_field_values: Dict[str, str] = field(default_factory=dict)
    password: str = None

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the session object to a dictionary."""
        return {
            "clients": [asdict(c) for c in self.clients],
            "workbooks": [wb.to_dict() for wb in self.workbooks],
            "groups": [asdict(g) for g in self.groups],
            "templates": [asdict(t) for t in self.templates],
            "prompted_field_values": self.prompted_field_values
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Session':
        """Deserializes a dictionary to a session object."""
        clients = [Client(**c) for c in data.get("clients", [])]
        workbooks = [Workbook.from_dict(wb) for wb in data.get("workbooks", [])]
        groups = [Group(**g) for g in data.get("groups", [])]
        templates = [NoteTemplate(**t) for t in data.get("templates", [])]
        prompted_field_values = data.get("prompted_field_values", {})
        return cls(
            clients=clients, 
            workbooks=workbooks, 
            groups=groups, 
            templates=templates,
            prompted_field_values=prompted_field_values
        )
