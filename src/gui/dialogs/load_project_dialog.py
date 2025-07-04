import os
import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...utils.paths import PATHS

class LoadProjectDialog(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Load Project")
        self.transient(parent)
        self.grab_set()
        self.selected_project = None

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        self.populate_projects()

    def create_widgets(self, parent):
        # Project list
        project_frame = ttk.LabelFrame(parent, text="Select a project to load")
        project_frame.pack(fill="both", expand=True, padx=10, pady=5)

        self.project_list = tk.Listbox(project_frame)
        self.project_list.pack(fill="both", expand=True, padx=5, pady=5)
        self.project_list.bind("<Double-Button-1>", self.load_selected_project)

        # Buttons
        button_frame = ttk.Frame(parent)
        button_frame.pack(fill="x", padx=10, pady=10)

        load_button = ttk.Button(button_frame, text="Load", command=self.load_selected_project)
        load_button.pack(side="right", padx=5)

        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def populate_projects(self):
        if not os.path.exists(PATHS.PROJECTS):
            return

        for filename in os.listdir(PATHS.PROJECTS):
            if filename.endswith(".tnm"):
                self.project_list.insert(tk.END, filename)

    def load_selected_project(self, event=None):
        selected_index = self.project_list.curselection()
        if not selected_index:
            return

        filename = self.project_list.get(selected_index)
        self.selected_project = os.path.join(PATHS.PROJECTS, filename)
        self.destroy()

    def show(self):
        self.wm_deiconify()
        self.wait_window()
        return self.selected_project
