import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ..components.date_entry import DateEntry
from ...core.config_manager import ConfigManager

class PromptForVariablesDialog(tb.Toplevel):
    def __init__(self, parent, required_fields, last_values, hints, date_fields, config_manager: ConfigManager):
        super().__init__(parent)
        self.required_fields = required_fields
        self.last_values = last_values
        self.hints = hints
        self.date_fields = date_fields
        self.config_manager = config_manager
        self.result = None
        self.entries = {}

        self.title("Enter Field Values")
        self.transient(parent)
        self.grab_set()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)

    def create_widgets(self, parent):
        main_frame = ttk.Frame(parent, padding=10)
        main_frame.pack(fill="both", expand=True)

        for field_name in self.required_fields:
            field_frame = ttk.Frame(main_frame)
            field_frame.pack(fill="x", pady=5)
            
            label = ttk.Label(field_frame, text=f"{field_name}:")
            label.pack(side="left", padx=5)
            
            if field_name in self.date_fields:
                entry = DateEntry(field_frame)
            else:
                entry = ttk.Entry(field_frame)
            entry.pack(fill="x", expand=True)
            
            if field_name in self.last_values:
                entry.insert(0, self.last_values[field_name])
            
            self.entries[field_name] = entry

            hint = self.hints.get(field_name)
            if hint:
                hint_label = ttk.Label(field_frame, text=hint, font=("Helvetica", 8, "italic"))
                hint_label.pack(side="bottom", fill="x", padx=5)

        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill="x", pady=10)
        
        save_button = ttk.Button(button_frame, text="OK", command=self.save)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def save(self):
        self.result = {name: entry.get() for name, entry in self.entries.items()}
        self.destroy()
