import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from datetime import datetime

class StatusBar(tb.Frame):
    def __init__(self, parent, config_manager):
        super().__init__(parent)
        self.config_manager = config_manager

        self.status_label = tb.Label(self, text="Ready", anchor=tk.W)
        self.status_label.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5, pady=2)

        info_frame = tb.Frame(self)
        info_frame.pack(side=tk.RIGHT, padx=5)

        self.counselor_label = tb.Label(info_frame, text="", anchor=tk.E)
        self.counselor_label.pack(side=tk.LEFT, padx=5)

        self.datetime_label = tb.Label(info_frame, text="", anchor=tk.E)
        self.datetime_label.pack(side=tk.LEFT, padx=5)

        self.update_info()

    def set_status(self, text):
        self.status_label.config(text=text)

    def show_temporary_message(self, text, duration=3000):
        self.set_status(text)
        self.after(duration, lambda: self.set_status("Ready"))

    def update_info(self):
        counselor_name = self.config_manager.get("counselor_name", "N/A")
        date_format = self.config_manager.get("date_format", "%Y-%m-%d")
        time_format = self.config_manager.get("time_format", "%H:%M")

        self.counselor_label.config(text=f"Counselor: {counselor_name}")
        
        now = datetime.now()
        date_str = now.strftime(date_format)
        time_str = now.strftime(time_format)
        self.datetime_label.config(text=f"{date_str} {time_str}")

        self.after(1000, self.update_info)
