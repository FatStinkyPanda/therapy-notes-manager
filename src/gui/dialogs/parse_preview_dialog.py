import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb

class ParsePreviewDialog(tb.Toplevel):
    def __init__(self, parent, workbook):
        super().__init__(parent)

        self.title("Parse Preview")
        self.geometry("800x600")
        self.transient(parent)
        self.grab_set()

        self.workbook = workbook

        self.tree = tb.Treeview(self, columns=("type", "content"), show="headings")
        self.tree.heading("type", text="Type")
        self.tree.heading("content", text="Content")
        self.tree.pack(expand=True, fill="both", padx=10, pady=10)

        self.populate_tree()

        self.save_button = tb.Button(self, text="Save", command=self.save)
        self.save_button.pack(pady=10)

    def populate_tree(self):
        if self.workbook:
            for chapter in self.workbook.chapters:
                self.tree.insert("", "end", values=("Chapter", chapter.title))
                for section in chapter.sections:
                    self.tree.insert("", "end", values=(section.type, section.content))

    def save(self):
        # Logic to save the workbook will go here
        self.destroy()
