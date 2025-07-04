import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
import sys
from pathlib import Path
from .components.menu_bar import MenuBar
from .components.status_bar import StatusBar
from .tabs.client_tab import ClientTab
from .tabs.workbook_tab import WorkbookTab
from .tabs.notes_generator_tab import NotesGeneratorTab
from .tabs.templates_tab import TemplatesTab
from ..core.client_manager import ClientManager
from ..core.workbook_manager import WorkbookManager
from ..core.template_manager import TemplateManager
from ..core.notes_engine import NotesEngine
from ..core.session_manager import SessionManager
from ..core.group_manager import GroupManager
from ..core.custom_fields_manager import CustomFieldsManager
from ..core.config_manager import ConfigManager
from ..utils.paths import PATHS

class MainWindow(tb.Window):
    def __init__(self):
        super().__init__(themename="superhero")
        self.title("Therapy Notes Manager")
        self.geometry("1024x768")
        if getattr(sys, 'frozen', False):
            # Running as a bundled executable
            icon_path = Path(sys._MEIPASS) / "icon.ico"
        else:
            # Running as a script
            icon_path = PATHS.ROOT / "icon.ico"
        self.iconbitmap(icon_path)
        self.minsize(1024, 768)

        menu = MenuBar(self)
        self.config(menu=menu)

        # Create managers
        self.client_manager = ClientManager()
        self.workbook_manager = WorkbookManager()
        self.group_manager = GroupManager()
        self.template_manager = TemplateManager()
        self.custom_fields_manager = CustomFieldsManager()
        self.config_manager = ConfigManager(PATHS.get_config_path("default_settings.json"))
        self.notes_engine = NotesEngine(self.config_manager, self.custom_fields_manager)
        self.session_manager = SessionManager()
        self.session_manager.initialize_managers(self.client_manager, self.workbook_manager, self.group_manager, self.template_manager)
        
        self.status_bar = StatusBar(self, self.config_manager)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        help_label = ttk.Label(self, text="Need help? Check out the help menu at the top of this window!", anchor=tk.CENTER)
        help_label.pack(side=tk.BOTTOM, fill=tk.X)

        self.notebook = ttk.Notebook(self)
        self.notebook.pack(expand=True, fill='both', padx=5, pady=5)

        self.session_manager.new_session()

        # Add tabs
        self.client_tab = ClientTab(self.notebook, self, self.client_manager, self.group_manager, self.config_manager)
        self.notebook.add(self.client_tab, text='Clients')

        self.workbook_tab = WorkbookTab(self.notebook, self, self.workbook_manager)
        self.notebook.add(self.workbook_tab, text='Workbooks')

        self.notes_generator_tab = NotesGeneratorTab(
            self.notebook,
            self.client_manager,
            self.workbook_manager,
            self.template_manager,
            self.group_manager,
            self.notes_engine,
            self.custom_fields_manager
        )
        self.notebook.add(self.notes_generator_tab, text='Notes Generator')

        self.templates_tab = TemplatesTab(self.notebook, self, self.template_manager)
        self.notebook.add(self.templates_tab, text='Templates')

    def refresh_ui(self):
        self.client_tab.populate_clients()
        self.workbook_tab.populate_workbooks()
        self.notes_generator_tab.populate_clients()
        self.notes_generator_tab.populate_workbooks()
        self.templates_tab.populate_templates()


if __name__ == '__main__':
    app = MainWindow()
    app.mainloop()
