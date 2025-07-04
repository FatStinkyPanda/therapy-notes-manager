import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ...models.workbook import Workbook
from ...core.workbook_manager import WorkbookManager
import uuid

class WorkbookEditorDialog(tb.Toplevel):
    def __init__(self, parent, workbook_manager: WorkbookManager, workbook: Workbook = None):
        super().__init__(parent)
        self.workbook_manager = workbook_manager
        self.workbook = workbook
        self.result = False

        self.title("Workbook Editor")
        self.geometry("600x400")
        self.transient(parent)
        self.grab_set()

        # Title
        self.title_label = tb.Label(self, text="Title:")
        self.title_label.pack(pady=(10,0))
        self.title_entry = tb.Entry(self)
        self.title_entry.pack(pady=5, fill="x", padx=10)

        # Author
        self.author_label = tb.Label(self, text="Author:")
        self.author_label.pack(pady=(10,0))
        self.author_entry = tb.Entry(self)
        self.author_entry.pack(pady=5, fill="x", padx=10)

        # Version
        self.version_label = tb.Label(self, text="Version:")
        self.version_label.pack(pady=(10,0))
        self.version_entry = tb.Entry(self)
        self.version_entry.pack(pady=5, fill="x", padx=10)

        if self.workbook:
            self.title_entry.insert(0, self.workbook.title)
            self.author_entry.insert(0, self.workbook.author)
            self.version_entry.insert(0, self.workbook.version)

        self.save_button = tb.Button(self, text="Save", command=self.save)
        self.save_button.pack(pady=20)

    def save(self):
        title = self.title_entry.get()
        author = self.author_entry.get()
        version = self.version_entry.get()

        if not title:
            return

        if self.workbook:
            self.workbook.title = title
            self.workbook.author = author
            self.workbook.version = version
            self.workbook_manager.update_workbook(self.workbook)
        else:
            new_workbook = Workbook(
                id=str(uuid.uuid4()), 
                title=title, 
                author=author, 
                version=version, 
                chapters=[]
            )
            self.workbook_manager.add_workbook(new_workbook)
        
        self.result = True
        self.destroy()

    def show(self):
        self.deiconify()
        self.wait_window()
        return self.result
