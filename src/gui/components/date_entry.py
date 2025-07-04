import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ttkbootstrap.dialogs import DatePickerDialog

class DateEntry(ttk.Frame):
    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)
        self.create_widgets()

    def create_widgets(self):
        self.entry = tb.Entry(self)
        self.entry.pack(side="left", fill="x", expand=True)

        self.button = tb.Button(self, text="📅", command=self.open_calendar, width=2)
        self.button.pack(side="left")

    def open_calendar(self):
        dialog = DatePickerDialog()
        date_obj = dialog.date_selected
        if date_obj:
            self.entry.delete(0, "end")
            self.entry.insert(0, date_obj.strftime("%Y-%m-%d"))

    def get(self):
        return self.entry.get()

    def insert(self, index, text):
        self.entry.insert(index, text)
