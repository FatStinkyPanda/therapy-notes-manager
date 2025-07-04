import tkinter as tk
from tkinter import ttk, messagebox
from typing import Dict, List
from ..components.scrolled_frame import ScrolledFrame
from ...models.client import Client

class GeneratedNotesDialog(tk.Toplevel):
    def __init__(self, parent, notes: Dict[str, str], clients: List[Client]):
        super().__init__(parent)
        self.title("Generated Notes")
        self.geometry("800x600")
        self.notes = notes
        self.clients = {client.id: client for client in clients}
        self.transient(parent)
        self.grab_set()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        self.populate_notes()

    def create_widgets(self, parent):
        self.notebook = ttk.Notebook(parent)
        self.notebook.pack(expand=True, fill="both", padx=10, pady=10)

        button_frame = ttk.Frame(parent)
        button_frame.pack(fill="x", padx=10, pady=10)

        copy_all_button = ttk.Button(button_frame, text="Copy All to Clipboard", command=self.copy_all_to_clipboard)
        copy_all_button.pack(side="left", padx=5)

        close_button = ttk.Button(button_frame, text="Close", command=self.destroy)
        close_button.pack(side="right", padx=5)

    def populate_notes(self):
        for client_id, note_content in self.notes.items():
            client = self.clients.get(client_id)
            tab_title = client_id
            if client:
                parts = []
                if client.name:
                    parts.append(client.name)
                if client.id:
                    parts.append(f"ID: {client.id}")
                if client.dob:
                    parts.append(f"DOB: {client.dob}")
                tab_title = " - ".join(parts)

            tab = ttk.Frame(self.notebook)
            self.notebook.add(tab, text=tab_title)

            text_area = tk.Text(tab, wrap="word")
            text_area.pack(expand=True, fill="both", padx=5, pady=5)
            text_area.insert("1.0", note_content)

            copy_button = ttk.Button(tab, text="Copy to Clipboard", command=lambda c=note_content: self.copy_to_clipboard(c))
            copy_button.pack(pady=5)

    def copy_to_clipboard(self, content: str):
        self.clipboard_clear()
        self.clipboard_append(content)
        messagebox.showinfo("Copied", "Note copied to clipboard.")

    def copy_all_to_clipboard(self):
        all_notes = "\n\n---\n\n".join(self.notes.values())
        self.clipboard_clear()
        self.clipboard_append(all_notes)
        messagebox.showinfo("Copied", "All notes copied to clipboard.")
