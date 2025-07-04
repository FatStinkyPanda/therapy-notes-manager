from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any

@dataclass
class Content:
    id: str
    type: str
    content: str | List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the content object to a dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Content':
        """Deserializes a dictionary to a content object."""
        return cls(**data)

@dataclass
class Chapter:
    id: str
    title: str
    summary: str = ""
    content: str = "" # Added for simplicity from NotesEngine change
    sections: List[Content] = field(default_factory=list)
    workbook_title: str = ""

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        if not isinstance(other, Chapter):
            return NotImplemented
        return self.id == other.id

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the chapter object to a dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "content": self.content,
            "sections": [s.to_dict() for s in self.sections],
            "workbook_title": self.workbook_title
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Chapter':
        """Deserializes a dictionary to a chapter object."""
        sections = [Content.from_dict(s) for s in data.get("sections", [])]
        return cls(
            id=data.get("id"),
            title=data.get("title"),
            summary=data.get("summary"),
            content=data.get("content"),
            sections=sections,
            workbook_title=data.get("workbook_title")
        )
