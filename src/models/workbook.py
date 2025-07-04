from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any
from .chapter import Chapter

@dataclass
class Workbook:
    id: str
    title: str
    author: str = ""
    version: str = "1.0"
    chapters: List[Chapter] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the workbook object to a dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "version": self.version,
            "chapters": [ch.to_dict() for ch in self.chapters]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Workbook':
        """Deserializes a dictionary to a workbook object."""
        chapters = [Chapter.from_dict(ch) for ch in data.get("chapters", [])]
        return cls(
            id=data.get("id"),
            title=data.get("title"),
            author=data.get("author"),
            version=data.get("version"),
            chapters=chapters
        )
