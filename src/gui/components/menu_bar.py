import tkinter as tk
from tkinter import ttk
from ..dialogs.settings_dialog import SettingsDialog
from ..dialogs.help_dialog import HelpDialog
from ..dialogs.about_dialog import AboutDialog
from ...core.session_manager import SessionManager

class MenuBar(tk.Menu):
    def __init__(self, parent):
        super().__init__(parent)
        self.session_manager = SessionManager()

        # File menu
        file_menu = tk.Menu(self, tearoff=0)
        self.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New Project", command=self.new_project)
        file_menu.add_command(label="Open Project", command=self.open_project)
        file_menu.add_command(label="Save Project", command=self.save_project)
        file_menu.add_command(label="Save Project As...", command=self.save_project_as)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=parent.quit)

        # Edit menu
        edit_menu = tk.Menu(self, tearoff=0)
        self.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Undo", command=self.undo)
        edit_menu.add_command(label="Redo", command=self.redo)

        # Tools menu
        tools_menu = tk.Menu(self, tearoff=0)
        self.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="Settings", command=self.open_settings)

        # Help menu
        help_menu = tk.Menu(self, tearoff=0)
        self.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="Help", command=self.show_help)
        help_menu.add_command(label="About", command=self.show_about)

    def new_project(self):
        self.session_manager.new_session()
        self.master.refresh_ui()

    def open_project(self):
        self.session_manager.load_project(self.master)
        self.master.refresh_ui()

    def save_project(self):
        self.session_manager.save_project(self.master)

    def save_project_as(self):
        self.session_manager.save_project(self.master, ask_for_password=True)

    def undo(self):
        print("Undo")

    def redo(self):
        print("Redo")

    def open_settings(self):
        dialog = SettingsDialog(self.master, self.master.config_manager)
        dialog.wait_window()

    def show_help(self):
        dialog = HelpDialog(self.master)
        dialog.wait_window()

    def show_about(self):
        dialog = AboutDialog(self.master)
        dialog.wait_window()
