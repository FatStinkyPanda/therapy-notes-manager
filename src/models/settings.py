from dataclasses import dataclass, field
from typing import Dict

@dataclass
class Settings:
    general: Dict[str, str] = field(default_factory=dict)
    paths: Dict[str, str] = field(default_factory=dict)
    ui: Dict[str, str] = field(default_factory=dict)
