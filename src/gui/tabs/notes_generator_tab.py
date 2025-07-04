import tkinter as tk
from tkinter import ttk, messagebox
import logging
import re
from ..components.scrolled_frame import ScrolledFrame
from ..dialogs.generated_notes_dialog import GeneratedNotesDialog
from ..dialogs.prompt_for_variables_dialog import PromptForVariablesDialog
from ..components.checkbox_treeview import CheckboxTreeview
from ...core.client_manager import ClientManager
from ...core.workbook_manager import WorkbookManager
from ...core.template_manager import TemplateManager
from ...core.group_manager import GroupManager
from ...core.notes_engine import NotesEngine
from ...core.custom_fields_manager import CustomFieldsManager
from ...core.session_manager import SessionManager

class NotesGeneratorTab(ttk.Frame):
    def __init__(self, parent, client_manager: ClientManager, workbook_manager: WorkbookManager, template_manager: TemplateManager, group_manager: GroupManager, notes_engine: NotesEngine, custom_fields_manager: CustomFieldsManager):
        super().__init__(parent)
        self.client_manager = client_manager
        self.workbook_manager = workbook_manager
        self.template_manager = template_manager
        self.group_manager = group_manager
        self.notes_engine = notes_engine
        self.custom_fields_manager = custom_fields_manager
        self.session_manager = SessionManager()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        self.populate_clients()
        self.populate_workbooks()
        self.populate_templates()

    def create_widgets(self, parent):
        # Paned window for client selection
        client_pane = ttk.PanedWindow(parent, orient=tk.HORIZONTAL)
        client_pane.pack(fill="both", expand=True, padx=10, pady=5)

        # Client selection
        client_frame = ttk.LabelFrame(client_pane, text="Select Clients")
        client_pane.add(client_frame, weight=1)

        self.client_tree = CheckboxTreeview(client_frame, selectmode="extended", columns=("type",), show="tree headings")
        self.client_tree.pack(fill="both", expand=True, padx=5, pady=5)
        self.client_tree.column("#0", width=250, minwidth=250, stretch=tk.YES)
        self.client_tree.column("type", width=100, minwidth=100, stretch=tk.NO)
        self.client_tree.heading("#0", text="Name", anchor=tk.W)
        self.client_tree.heading("type", text="Type", anchor=tk.W)
        self.client_tree.bind("<<TreeviewSelect>>", self.update_selected_clients)

        # Selected clients
        selected_clients_frame = ttk.LabelFrame(client_pane, text="Selected Clients")
        client_pane.add(selected_clients_frame, weight=1)

        self.selected_clients_list = tk.Listbox(selected_clients_frame)
        self.selected_clients_list.pack(fill="both", expand=True, padx=5, pady=5)

        # Workbook and Chapter selection
        workbook_frame = ttk.LabelFrame(parent, text="Select Workbook and Chapters")
        workbook_frame.pack(fill="x", padx=10, pady=5)

        self.workbook_tree = ttk.Treeview(workbook_frame, selectmode="extended", columns=("type",), show="tree headings")
        self.workbook_tree.pack(fill="x", expand=True, padx=5, pady=5)
        self.workbook_tree.column("#0", width=250, minwidth=250, stretch=tk.YES)
        self.workbook_tree.column("type", width=100, minwidth=100, stretch=tk.NO)
        self.workbook_tree.heading("#0", text="Title", anchor=tk.W)
        self.workbook_tree.heading("type", text="Type", anchor=tk.W)

        # Template selection
        template_frame = ttk.LabelFrame(parent, text="Select Note Template")
        template_frame.pack(fill="x", padx=10, pady=5)

        self.template_combo = ttk.Combobox(template_frame, state="readonly")
        self.template_combo.pack(fill="x", expand=True, padx=5, pady=5)

        # Generate button
        generate_button = ttk.Button(parent, text="Generate Notes", command=self.generate_notes)
        generate_button.pack(pady=10)
        self.tooltip(generate_button, "Generate notes for the selected clients and chapters.")

    def populate_clients(self):
        for i in self.client_tree.get_children():
            self.client_tree.delete(i)

        groups = self.group_manager.get_groups()
        clients_in_groups = {client_id for group in groups for client_id in group.client_ids}

        # Add groups and their clients
        for group in groups:
            group_node = self.client_tree.insert("", "end", text=group.name, values=("Group",), iid=group.id, open=True)
            for client_id in group.client_ids:
                client = self.client_manager.get_client_by_id(client_id)
                if client:
                    self.client_tree.insert(group_node, "end", text=client.name, values=("Client",), iid=client.id)

        # Add unassigned clients
        unassigned_node = self.client_tree.insert("", "end", text="Unassigned", values=("Group",), iid="unassigned", open=True)
        for client in self.client_manager.get_clients():
            if client.id not in clients_in_groups:
                self.client_tree.insert(unassigned_node, "end", text=client.name, values=("Client",), iid=client.id)

    def populate_workbooks(self):
        for i in self.workbook_tree.get_children():
            self.workbook_tree.delete(i)
        for workbook in self.workbook_manager.get_workbooks():
            wb_node = self.workbook_tree.insert("", "end", text=workbook.title, values=("Workbook",), iid=workbook.id, open=True)
            for chapter in workbook.chapters:
                self.workbook_tree.insert(wb_node, "end", text=chapter.title, values=("Chapter",), iid=chapter.id)

    def populate_templates(self):
        templates = self.template_manager.get_all_templates()
        self.template_combo['values'] = [t.name for t in templates]
        if templates:
            self.template_combo.current(0)

    def generate_notes(self):
        selected_items = self.workbook_tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Please select at least one chapter or workbook.")
            return

        selected_chapters = []
        for item_id in selected_items:
            if self.workbook_tree.parent(item_id):
                parent_id = self.workbook_tree.parent(item_id)
                workbook = self.workbook_manager.get_workbook_by_id(parent_id)
                if workbook:
                    chapter = next((ch for ch in workbook.chapters if ch.id == item_id), None)
                    if chapter:
                        selected_chapters.append(chapter)
            else:
                workbook = self.workbook_manager.get_workbook_by_id(item_id)
                if workbook:
                    selected_chapters.extend(workbook.chapters)

        unique_chapters = list(dict.fromkeys(selected_chapters))
        if not unique_chapters:
            messagebox.showerror("Error", "Could not find selected chapters.")
            return
        
        selected_chapters = unique_chapters

        template_name = self.template_combo.get()
        if not template_name:
            messagebox.showerror("Error", "Please select a note template.")
            return
        selected_template = self.template_manager.get_template(template_name)

        selected_clients = self.get_selected_clients()
        if not selected_clients:
            messagebox.showerror("Error", "Please select at least one client.")
            return

        # Handle prompted custom fields
        other_data = {}
        
        all_prompted_fields = [
            field['name'] for field in self.custom_fields_manager.get_custom_fields() 
            if field.get('prompt')
        ]

        standard_prompted_fields = [
            "Group_Topic", "Session_Number", "Next_Session_Date", 
            "Next_Session_Time", "Goals_Addressed"
        ]
        all_prompted_fields.extend(standard_prompted_fields)

        required_fields = [
            field_name for field_name in all_prompted_fields
            if f"${{{field_name}}}" in selected_template.content
        ]

        if required_fields:
            session = self.session_manager.get_session()
            last_values = session.prompted_field_values if session else {}
            
            # Get hints from custom fields
            hints = {field['name']: field.get('hint', '') for field in self.custom_fields_manager.get_custom_fields()}
            
            # Get hints from the template and merge them
            if selected_template.variables:
                template_hints = {var_name: var_data.get('hint', '') for var_name, var_data in selected_template.variables.items()}
                hints.update(template_hints)

            date_fields = [field['name'] for field in self.custom_fields_manager.get_custom_fields() if field.get('type') == 'date']
            
            standard_date_fields = ["Next_Session_Date"]
            date_fields.extend(standard_date_fields)

            dialog = PromptForVariablesDialog(self, required_fields, last_values, hints, date_fields, self.notes_engine.config_manager)
            self.wait_window(dialog)

            if dialog.result is None:
                messagebox.showinfo("Cancelled", "Note generation cancelled.")
                return
            
            other_data.update(dialog.result)
            if session:
                session.prompted_field_values.update(dialog.result)

        try:
            notes = self.notes_engine.generate_batch_notes(
                selected_clients,
                selected_template,
                selected_chapters,
                other_data
            )
            dialog = GeneratedNotesDialog(self, notes, selected_clients)
            dialog.wait_window()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate notes: {e}")

    def update_selected_clients(self, event=None):
        self.selected_clients_list.delete(0, tk.END)
        selected_ids = self.client_tree.get_checked()
        for item_id in selected_ids:
            if self.client_tree.parent(item_id) != "": # It's a client
                client = self.client_manager.get_client_by_id(item_id)
                if client:
                    self.selected_clients_list.insert(tk.END, client.name)

    def get_selected_clients(self):
        selected_ids = self.client_tree.get_checked()
        selected_clients = []
        for item_id in selected_ids:
            if self.client_tree.parent(item_id) != "": # It's a client
                client = self.client_manager.get_client_by_id(item_id)
                if client:
                    selected_clients.append(client)
            else: # It's a group
                group = self.group_manager.get_group_by_id(item_id)
                if group:
                    for client_id in group.client_ids:
                        client = self.client_manager.get_client_by_id(client_id)
                        if client:
                            selected_clients.append(client)
        
        # Remove duplicates
        unique_clients = []
        for client in selected_clients:
            if client not in unique_clients:
                unique_clients.append(client)
        return unique_clients

    def tooltip(self, widget, text):
        from ttkbootstrap.tooltip import ToolTip
        tool_tip = ToolTip(widget, text)
