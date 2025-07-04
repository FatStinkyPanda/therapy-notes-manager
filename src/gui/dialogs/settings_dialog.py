import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...core.config_manager import ConfigManager

class SettingsDialog(tb.Toplevel):
    def __init__(self, parent, config_manager: ConfigManager):
        super().__init__(parent)
        self.config_manager = config_manager

        self.title("Settings")
        self.geometry("500x400")
        self.transient(parent)
        self.grab_set()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.notebook = ttk.Notebook(content_frame)
        self.notebook.pack(expand=True, fill="both", padx=10, pady=10)

        self.general_tab = tb.Frame(self.notebook)
        self.notebook.add(self.general_tab, text="General")
        self.create_general_tab_widgets()

        self.paths_tab = tb.Frame(self.notebook)
        self.notebook.add(self.paths_tab, text="Paths")

        self.save_button = tb.Button(content_frame, text="Save", command=self.save)
        self.save_button.pack(pady=10)

    def create_general_tab_widgets(self):
        # Counselor Name
        counselor_frame = ttk.Frame(self.general_tab)
        counselor_frame.pack(fill="x", padx=10, pady=5)
        counselor_label = ttk.Label(counselor_frame, text="Counselor Name:")
        counselor_label.pack(side="left", padx=5)
        self.counselor_name_entry = ttk.Entry(counselor_frame)
        self.counselor_name_entry.pack(side="left", expand=True, fill="x", padx=5)
        self.counselor_name_entry.insert(0, self.config_manager.get("counselor_name", ""))

        # Date Format
        self.date_formats = {
            "2023-01-01": "%Y-%m-%d",
            "01/01/2023": "%m/%d/%Y",
            "01-Jan-2023": "%d-%b-%Y",
            "January 01, 2023": "%B %d, %Y"
        }
        date_format_frame = ttk.Frame(self.general_tab)
        date_format_frame.pack(fill="x", padx=10, pady=5)
        date_format_label = ttk.Label(date_format_frame, text="Date Format:")
        date_format_label.pack(side="left", padx=5)
        self.date_format_combo = ttk.Combobox(date_format_frame, values=list(self.date_formats.keys()))
        self.date_format_combo.pack(side="left", expand=True, fill="x", padx=5)
        
        current_date_format_code = self.config_manager.get("date_format", "%Y-%m-%d")
        for key, value in self.date_formats.items():
            if value == current_date_format_code:
                self.date_format_combo.set(key)
                break
        else:
            self.date_format_combo.set(list(self.date_formats.keys())[0])

        # Time Format
        self.time_formats = {
            "24-hour (14:30)": "%H:%M",
            "12-hour (02:30 PM)": "%I:%M %p"
        }
        time_format_frame = ttk.Frame(self.general_tab)
        time_format_frame.pack(fill="x", padx=10, pady=5)
        time_format_label = ttk.Label(time_format_frame, text="Time Format:")
        time_format_label.pack(side="left", padx=5)
        self.time_format_combo = ttk.Combobox(time_format_frame, values=list(self.time_formats.keys()))
        self.time_format_combo.pack(side="left", expand=True, fill="x", padx=5)

        current_time_format_code = self.config_manager.get("time_format", "%H:%M")
        for key, value in self.time_formats.items():
            if value == current_time_format_code:
                self.time_format_combo.set(key)
                break
        else:
            self.time_format_combo.set(list(self.time_formats.keys())[0])

    def save(self):
        self.config_manager.set("counselor_name", self.counselor_name_entry.get())
        
        selected_date_key = self.date_format_combo.get()
        self.config_manager.set("date_format", self.date_formats.get(selected_date_key, "%Y-%m-%d"))

        selected_time_key = self.time_format_combo.get()
        self.config_manager.set("time_format", self.time_formats.get(selected_time_key, "%H:%M"))
        
        self.config_manager.save_config()
        self.destroy()
