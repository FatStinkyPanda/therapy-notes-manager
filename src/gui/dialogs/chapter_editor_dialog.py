import tkinter as tk
from tkinter import ttk
from ...models.chapter import Chapter

class ChapterEditorDialog(tk.Toplevel):
    def __init__(self, parent, workbook_manager, workbook_id: str, chapter: Chapter):
        super().__init__(parent)
        self.title("Chapter Editor")
        self.workbook_manager = workbook_manager
        self.workbook_id = workbook_id
        self.chapter = chapter
        self.transient(parent)
        self.grab_set()

        self.create_widgets()
        self.load_chapter_data()

    def create_widgets(self):
        # Chapter Title
        title_frame = ttk.LabelFrame(self, text="Chapter Title")
        title_frame.pack(fill="x", padx=10, pady=5)
        self.title_entry = ttk.Entry(title_frame)
        self.title_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # Chapter Summary
        summary_frame = ttk.LabelFrame(self, text="Summary")
        summary_frame.pack(fill="x", padx=10, pady=5)
        self.summary_text = tk.Text(summary_frame, height=5)
        self.summary_text.pack(fill="x", expand=True, padx=5, pady=5)

        # Chapter Content
        content_frame = ttk.LabelFrame(self, text="Content")
        content_frame.pack(fill="both", expand=True, padx=10, pady=5)
        self.content_text = tk.Text(content_frame, height=15)
        self.content_text.pack(fill="both", expand=True, padx=5, pady=5)

        # Buttons
        button_frame = ttk.Frame(self)
        button_frame.pack(fill="x", padx=10, pady=10)
        
        save_button = ttk.Button(button_frame, text="Save", command=self.save_and_close)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def load_chapter_data(self):
        self.title_entry.insert(0, self.chapter.title)
        self.summary_text.insert("1.0", self.chapter.summary)
        self.content_text.insert("1.0", self.chapter.content)

    def save_and_close(self):
        import logging
        logging.info("save_and_close called")
        self.chapter.title = self.title_entry.get()
        self.chapter.summary = self.summary_text.get("1.0", tk.END).strip()
        self.chapter.content = self.content_text.get("1.0", tk.END).strip()
        self.workbook_manager.update_chapter(self.workbook_id, self.chapter)
        # We need to notify the parent to refresh the UI
        self.master.master.refresh_ui()
        self.destroy()

    def get_chapter(self):
        return self.chapter
