from dataclasses import dataclass, field
from typing import List

@dataclass
class Group:
    id: str
    name: str
    client_ids: List[str] = field(default_factory=list)
