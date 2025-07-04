from typing import List, Optional
import logging
from ..models.workbook import Workbook
from ..models.chapter import Chapter
from ..utils.singleton import Singleton

class WorkbookManager(metaclass=Singleton):
    def __init__(self):
        self.workbooks: List[Workbook] = []

    def add_workbook(self, workbook: Workbook):
        logging.info(f"Adding workbook: {workbook.title}")
        self.workbooks.append(workbook)

    def get_workbooks(self) -> List[Workbook]:
        return self.workbooks

    def set_workbooks(self, workbooks: List[Workbook]):
        self.workbooks = workbooks

    def get_workbook_by_id(self, workbook_id: str) -> Optional[Workbook]:
        logging.info(f"Searching for workbook with ID: {workbook_id}")
        for w in self.workbooks:
            logging.info(f"Checking workbook: {w.id}")
            if w.id == workbook_id:
                logging.info(f"Found workbook: {w.title}")
                return w
        logging.warning(f"Workbook with ID {workbook_id} not found.")
        return None

    def update_workbook(self, workbook: Workbook):
        logging.info(f"Updating workbook: {workbook.title}")
        for i, w in enumerate(self.workbooks):
            if w.id == workbook.id:
                self.workbooks[i] = workbook
                logging.info(f"Workbook '{workbook.title}' updated successfully.")
                break

    def remove_workbook(self, workbook_id: str):
        self.workbooks = [w for w in self.workbooks if w.id != workbook_id]

    def update_chapter(self, workbook_id: str, updated_chapter: Chapter):
        """Updates a chapter within a specific workbook."""
        workbook = self.get_workbook_by_id(workbook_id)
        if workbook:
            for i, chapter in enumerate(workbook.chapters):
                if chapter.id == updated_chapter.id:
                    workbook.chapters[i] = updated_chapter
                    logging.info(f"Updated chapter '{updated_chapter.title}' in workbook '{workbook.title}'.")
                    break
        else:
            logging.warning(f"Could not update chapter. Workbook with ID {workbook_id} not found.")
