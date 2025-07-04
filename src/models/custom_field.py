from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class CustomField:
    name: str
    type: str  # "text", "date", "dropdown"
    default_value: Optional[str] = None
    options: List[str] = field(default_factory=list)
    validation_rules: dict = field(default_factory=dict)
