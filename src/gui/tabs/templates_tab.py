import tkinter as tk
from tkinter import ttk, messagebox
from ..components.scrolled_frame import ScrolledFrame
from ...core.template_manager import TemplateManager
from ..dialogs.template_editor_dialog import TemplateEditorDialog

class TemplatesTab(ttk.Frame):
    def __init__(self, parent, master, template_manager: TemplateManager):
        super().__init__(parent)
        self.master = master
        self.template_manager = template_manager

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        self.populate_templates()

    def create_widgets(self, parent):
        # Template list
        template_frame = ttk.LabelFrame(parent, text="Note Templates")
        template_frame.pack(fill="both", expand=True, padx=10, pady=5)

        self.template_list = tk.Listbox(template_frame)
        self.template_list.pack(fill="both", expand=True, padx=5, pady=5)
        self.template_list.bind("<Double-1>", self.edit_template)

        # Buttons
        button_frame = ttk.Frame(parent)
        button_frame.pack(fill="x", padx=10, pady=5)

        add_button = ttk.Button(button_frame, text="Add", command=self.add_template)
        add_button.pack(side="left", padx=5)
        self.tooltip(add_button, "Add a new template.")

        edit_button = ttk.Button(button_frame, text="Edit", command=self.edit_template)
        edit_button.pack(side="left", padx=5)
        self.tooltip(edit_button, "Edit the selected template.")

        delete_button = ttk.Button(button_frame, text="Delete", command=self.delete_template)
        delete_button.pack(side="left", padx=5)
        self.tooltip(delete_button, "Delete the selected template.")

    def populate_templates(self):
        self.template_list.delete(0, tk.END)
        
        # Load default templates
        import json
        from ...utils.paths import PATHS
        from ...models.note_template import NoteTemplate
        try:
            with open(PATHS.get_config_path("default_templates.json"), 'r') as f:
                default_templates_data = json.load(f)
            
            default_templates = [NoteTemplate(**data) for data in default_templates_data]
            for template in default_templates:
                self.template_list.insert(tk.END, f"[Default] {template.name}")
        except Exception as e:
            print(f"Could not load default templates: {e}")

        for template in self.template_manager.get_all_templates():
            self.template_list.insert(tk.END, template.name)

    def add_template(self):
        dialog = TemplateEditorDialog(self)
        self.wait_window(dialog)
        if dialog.template_data:
            self.template_manager.create_template(
                dialog.template_data["name"], 
                dialog.template_data["content"],
                dialog.template_data.get("variables", {})
            )
            self.populate_templates()
            self.master.status_bar.show_temporary_message("Template saved successfully.")

    def edit_template(self, event=None):
        selection_indices = self.template_list.curselection()
        if not selection_indices:
            return

        selected_index = selection_indices[0]
        template_name = self.template_list.get(selected_index)
        
        if template_name.startswith("[Default]"):
            messagebox.showinfo("Info", "Default templates cannot be edited.")
            return

        template = self.template_manager.get_template(template_name)

        dialog = TemplateEditorDialog(self, template)
        self.wait_window(dialog)
        if dialog.template_data:
            self.template_manager.update_template(
                template_name, 
                dialog.template_data["name"], 
                dialog.template_data["content"],
                dialog.template_data.get("variables", {})
            )
            self.populate_templates()
            self.master.status_bar.show_temporary_message("Template saved successfully.")

    def delete_template(self):
        selection_indices = self.template_list.curselection()
        if not selection_indices:
            return

        selected_index = selection_indices[0]
        template_name = self.template_list.get(selected_index)

        if template_name.startswith("[Default]"):
            messagebox.showerror("Error", "Default templates cannot be deleted.")
            return
        
        if messagebox.askyesno("Delete Template", f"Are you sure you want to delete the template '{template_name}'?"):
            self.template_manager.delete_template(template_name)
            self.populate_templates()

    def tooltip(self, widget, text):
        from ttkbootstrap.tooltip import ToolTip
        tool_tip = ToolTip(widget, text)
