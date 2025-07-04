import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame

class CustomFieldEditorDialog(tb.Toplevel):
    def __init__(self, parent, field_data=None):
        super().__init__(parent)
        self.field_data = field_data
        self.result = None

        self.title("Custom Field Editor")
        self.geometry("400x250")
        self.transient(parent)
        self.grab_set()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        if self.field_data:
            self.load_field_data()

    def create_widgets(self, parent):
        main_frame = ttk.Frame(parent, padding=10)
        main_frame.pack(fill="both", expand=True)

        # Name
        name_frame = ttk.Frame(main_frame)
        name_frame.pack(fill="x", pady=5)
        name_label = ttk.Label(name_frame, text="Field Name:")
        name_label.pack(side="left", padx=5)
        self.name_entry = ttk.Entry(name_frame)
        self.name_entry.pack(fill="x", expand=True)

        # Value
        self.value_frame = ttk.Frame(main_frame)
        self.value_frame.pack(fill="x", pady=5)
        value_label = ttk.Label(self.value_frame, text="Replacement Value:")
        value_label.pack(side="left", padx=5)
        self.value_entry = ttk.Entry(self.value_frame)
        self.value_entry.pack(fill="x", expand=True)

        # Hint
        hint_frame = ttk.Frame(main_frame)
        hint_frame.pack(fill="x", pady=5)
        hint_label = ttk.Label(hint_frame, text="Hint:")
        hint_label.pack(side="left", padx=5)
        self.hint_entry = ttk.Entry(hint_frame)
        self.hint_entry.pack(fill="x", expand=True)

        # Type
        type_frame = ttk.Frame(main_frame)
        type_frame.pack(fill="x", pady=5)
        self.is_date_var = tk.BooleanVar()
        is_date_check = ttk.Checkbutton(
            type_frame,
            text="This field is a date",
            variable=self.is_date_var
        )
        is_date_check.pack(side="left", padx=5)

        # Prompt on generate
        self.prompt_var = tk.BooleanVar()
        prompt_check = ttk.Checkbutton(
            main_frame,
            text="Prompt for value when generating notes",
            variable=self.prompt_var,
            command=self.toggle_value_field
        )
        prompt_check.pack(fill="x", pady=5)

        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill="x", pady=10)
        
        save_button = ttk.Button(button_frame, text="Save", command=self.save)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def load_field_data(self):
        self.name_entry.insert(0, self.field_data.get("name", ""))
        self.value_entry.insert(0, self.field_data.get("value", ""))
        self.hint_entry.insert(0, self.field_data.get("hint", ""))
        self.is_date_var.set(self.field_data.get("type", "text") == "date")
        self.prompt_var.set(self.field_data.get("prompt", False))
        self.toggle_value_field()

    def toggle_value_field(self):
        if self.prompt_var.get():
            self.value_entry.config(state="disabled")
        else:
            self.value_entry.config(state="normal")

    def save(self):
        self.result = {
            "name": self.name_entry.get(),
            "prompt": self.prompt_var.get(),
            "value": self.value_entry.get() if not self.prompt_var.get() else "",
            "hint": self.hint_entry.get(),
            "type": "date" if self.is_date_var.get() else "text"
        }
        self.destroy()
