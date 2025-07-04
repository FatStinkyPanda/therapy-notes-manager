import json
import os
import tkinter as tk
from tkinter import filedialog, simpledialog, messagebox
from ..gui.dialogs.load_project_dialog import LoadProjectDialog
from typing import Optional
from ..models.session import Session
from ..security.encryption import Encryption
from .client_manager import ClientManager
from .workbook_manager import WorkbookManager
from .group_manager import GroupManager
from ..utils.paths import PATHS
from ..utils.singleton import Singleton

class SessionManager(metaclass=Singleton):
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.current_session = None
            self.current_filepath = None
            self.client_manager = None
            self.workbook_manager = None
            self.group_manager = None
            self.initialized = True

    def initialize_managers(self, client_manager: ClientManager, workbook_manager: WorkbookManager, group_manager: GroupManager, template_manager):
        self.client_manager = client_manager
        self.workbook_manager = workbook_manager
        self.group_manager = group_manager
        self.template_manager = template_manager

    def get_session(self) -> Optional[Session]:
        return self.current_session

    def new_session(self):
        self.current_session = Session()
        self.current_filepath = None
        self.current_session.password = None
        self.load_default_templates()

    def clear_session(self):
        self.current_session = None
        self.current_filepath = None

    def save_project(self, main_window, ask_for_password=False):
        if not self.current_session:
            messagebox.showerror("Error", "No active session to save.")
            return

        filepath = self.current_filepath
        if not filepath or ask_for_password:
            if not os.path.exists(PATHS.PROJECTS):
                os.makedirs(PATHS.PROJECTS)
            
            filepath = filedialog.asksaveasfilename(
                initialdir=PATHS.PROJECTS,
                defaultextension=".tnm",
                filetypes=[("Therapy Notes Manager Files", "*.tnm"), ("All Files", "*.*")]
            )
            if not filepath:
                return
            self.current_filepath = filepath
            self.current_session.password = None

        password = self.current_session.password
        if not password:
            password = simpledialog.askstring("Password", "Enter a password to encrypt the file:", show='*', parent=main_window)
            if not password:
                messagebox.showwarning("Cancelled", "Save operation cancelled. Password is required.")
                return
            self.current_session.password = password

        hashed_password = Encryption.hash_password(password)
        
        self.current_session.clients = self.client_manager.get_clients()
        self.current_session.workbooks = self.workbook_manager.get_workbooks()
        self.current_session.groups = self.group_manager.get_groups()
        self.current_session.templates = self.template_manager.get_all_templates()

        session_data = self.current_session.to_dict()
        
        encrypted_data = {
            "password_hash": hashed_password.decode('utf-8'),
            "data": session_data
        }

        try:
            with open(filepath, 'w') as f:
                json.dump(encrypted_data, f, indent=4)
            self.current_filepath = filepath
            if hasattr(main_window, 'status_bar'):
                main_window.status_bar.show_temporary_message("Project saved successfully.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save project: {e}")

    def load_project(self, parent):
        dialog = LoadProjectDialog(parent)
        filepath = dialog.show()

        if not filepath:
            return

        password = simpledialog.askstring("Password", "Enter the password to decrypt the file:", show='*', parent=parent)
        if not password:
            messagebox.showwarning("Cancelled", "Load operation cancelled. Password is required.")
            return

        try:
            with open(filepath, 'r') as f:
                encrypted_data = json.load(f)
            
            hashed_password = encrypted_data["password_hash"].encode('utf-8')
            if not Encryption.check_password(password, hashed_password):
                messagebox.showerror("Error", "Invalid password.")
                return

            self.current_session = Session.from_dict(encrypted_data["data"])
            self.current_session.password = password
            self.current_filepath = filepath

            self.client_manager.set_clients(self.current_session.clients)
            self.workbook_manager.set_workbooks(self.current_session.workbooks)
            self.group_manager.set_groups(self.current_session.groups)
            
            self.load_default_templates()
            self.template_manager.set_templates(self.current_session.templates)
            
            root = tk._get_default_root()
            if hasattr(root, 'refresh_ui'):
                root.refresh_ui()

            messagebox.showinfo("Success", "Project loaded successfully.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load project: {e}")

    def load_default_templates(self):
        try:
            with open(PATHS.get_config_path("default_templates.json"), 'r') as f:
                default_templates_data = json.load(f)
            
            from ..models.note_template import NoteTemplate
            default_templates = [NoteTemplate(**data) for data in default_templates_data]
            
            # Add default templates if they don't exist in the current session
            existing_template_ids = {t.id for t in self.current_session.templates}
            for dt in default_templates:
                if dt.id not in existing_template_ids:
                    self.current_session.templates.append(dt)

            self.template_manager.set_templates(self.current_session.templates)
        except FileNotFoundError:
            # If the file doesn't exist, we just don't load any default templates.
            pass
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load default templates: {e}")
