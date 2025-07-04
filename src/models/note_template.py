from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class NoteTemplate:
    id: str
    name: str
    content: str
    variables: Dict[str, Any] = field(default_factory=dict)
