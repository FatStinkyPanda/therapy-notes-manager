import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional

@dataclass
class Client:
    id: Optional[str] = None
    name: Optional[str] = None
    dob: Optional[str] = None
    pronouns: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    custom_fields: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        if not self.id and not self.name:
            raise ValueError("Client must have at least an id or a name.")
        if not self.id:
            self.id = str(uuid.uuid4())
