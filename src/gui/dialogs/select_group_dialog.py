import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame

class SelectGroupDialog(tk.Toplevel):
    def __init__(self, parent, group_names):
        super().__init__(parent)
        self.title("Select Group")
        self.geometry("300x400")
        self.transient(parent)
        self.grab_set()

        self.selected_group = None

        self.create_widgets(group_names)

    def create_widgets(self, group_names):
        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        label = ttk.Label(content_frame, text="Select a group:")
        label.pack(pady=5)

        self.group_combobox = ttk.Combobox(content_frame, values=group_names, state="readonly")
        self.group_combobox.pack(pady=5)
        if group_names:
            self.group_combobox.current(0)

        button_frame = ttk.Frame(content_frame)
        button_frame.pack(pady=10)

        ok_button = ttk.Button(button_frame, text="OK", command=self.on_ok)
        ok_button.pack(side="left", padx=5)

        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="left", padx=5)

    def on_ok(self):
        self.selected_group = self.group_combobox.get()
        self.destroy()

    def show(self):
        self.wait_window()
        return self.selected_group
