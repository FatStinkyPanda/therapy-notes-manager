import tkinter as tk
from tkinter import ttk, simpledialog, messagebox
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...models.note_template import NoteTemplate
from ...core.custom_fields_manager import CustomFieldsManager
from .custom_field_editor_dialog import CustomFieldEditorDialog

class TemplateEditorDialog(tb.Toplevel):
    def __init__(self, parent, template: NoteTemplate = None):
        super().__init__(parent)
        self.template = template
        self.template_data = None
        self.custom_fields_manager = CustomFieldsManager()

        self.title("Template Editor")
        self.geometry("800x600")
        self.transient(parent)
        self.grab_set()

        self.create_widgets()
        if self.template:
            self.load_template_data()

        self.variables_tree.bind("<<TreeviewSelect>>", self.on_variable_select)
        self.content_text.bind("<Control-space>", self.show_variable_popup)

    def create_widgets(self):
        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame_main = scrolled_frame.scrollable_frame

        # Main frame
        main_frame = ttk.Frame(content_frame_main)
        main_frame.pack(fill="both", expand=True)

        # Left frame for variables
        variables_frame = ttk.LabelFrame(main_frame, text="Replacement Variables")
        variables_frame.pack(side="left", fill="y", padx=10, pady=10)

        self.variables_tree = ttk.Treeview(variables_frame, show="tree")
        self.variables_tree.pack(fill="both", expand=True)
        self.populate_variables_tree()

        # Hint editor
        hint_frame = ttk.LabelFrame(variables_frame, text="Hint")
        hint_frame.pack(fill="x", pady=5)
        self.hint_entry = ttk.Entry(hint_frame)
        self.hint_entry.pack(fill="x", padx=5, pady=5)
        self.hint_entry.bind("<KeyRelease>", self.on_hint_change)

        variable_buttons_frame = ttk.Frame(variables_frame)
        variable_buttons_frame.pack(fill="x", pady=5)

        insert_button = ttk.Button(variable_buttons_frame, text="Insert", command=self.insert_variable)
        insert_button.pack(side="left", padx=2)

        self.add_custom_button = ttk.Button(variable_buttons_frame, text="Add", command=self.add_custom_field)
        self.add_custom_button.pack(side="left", padx=2)

        self.edit_custom_button = ttk.Button(variable_buttons_frame, text="Edit", command=self.edit_custom_field, state="disabled")
        self.edit_custom_button.pack(side="left", padx=2)

        self.delete_custom_button = ttk.Button(variable_buttons_frame, text="Delete", command=self.delete_custom_field, state="disabled")
        self.delete_custom_button.pack(side="left", padx=2)

        # Right frame for editor
        editor_frame = ttk.Frame(main_frame)
        editor_frame.pack(side="right", fill="both", expand=True, padx=10, pady=10)

        # Name
        name_frame = ttk.Frame(editor_frame)
        name_frame.pack(fill="x", pady=5)
        name_label = ttk.Label(name_frame, text="Name:")
        name_label.pack(side="left")
        self.name_entry = ttk.Entry(name_frame)
        self.name_entry.pack(fill="x", expand=True, padx=5)

        # Content
        content_frame = ttk.LabelFrame(editor_frame, text="Content")
        content_frame.pack(fill="both", expand=True, pady=5)
        self.content_text = tk.Text(content_frame, wrap="word")
        self.content_text.pack(fill="both", expand=True)

        # Buttons
        button_frame = ttk.Frame(content_frame_main)
        button_frame.pack(fill="x", padx=10, pady=10)
        save_button = ttk.Button(button_frame, text="Save", command=self.save)
        save_button.pack(side="right", padx=5)
        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def populate_variables_tree(self):
        for i in self.variables_tree.get_children():
            self.variables_tree.delete(i)

        # Standard variables
        std_vars = self.variables_tree.insert("", "end", text="Standard", open=True, tags=("standard",))
        
        # Client Variables
        client_vars = self.variables_tree.insert(std_vars, "end", text="Client", open=True)
        client_variables = ["${client_name}", "${client_id}", "${client_dob}", "${Client_Pronoun_He/She}", "${Client_Pronoun_his/her}"]
        for var in client_variables:
            self.variables_tree.insert(client_vars, "end", text=var, tags=("standard_field",))

        # Session Variables
        session_vars = self.variables_tree.insert(std_vars, "end", text="Session", open=True)
        session_variables = ["${date}", "${session_date}", "${session_time}", "${session_duration}", "${counselor_name}"]
        for var in session_variables:
            self.variables_tree.insert(session_vars, "end", text=var, tags=("standard_field",))

        # Workbook Variables
        workbook_vars = self.variables_tree.insert(std_vars, "end", text="Workbook", open=True)
        workbook_variables = ["${workbook_title}", "${workbook_content}", "${chapter_title}", "${chapter_summary}", "${section_content}"]
        for var in workbook_variables:
            self.variables_tree.insert(workbook_vars, "end", text=var, tags=("standard_field",))

        # Prompted Variables
        prompted_vars = self.variables_tree.insert(std_vars, "end", text="Prompted", open=True)
        prompted_variables = ["${Group_Topic}", "${Session_Number}", "${Next_Session_Date}", "${Next_Session_Time}", "${Goals_Addressed}"]
        for var in prompted_variables:
            self.variables_tree.insert(prompted_vars, "end", text=var, tags=("standard_field",))

        # Custom fields
        custom_fields = self.custom_fields_manager.get_custom_fields()
        if custom_fields:
            custom_vars = self.variables_tree.insert("", "end", text="Custom Fields", open=True, tags=("custom",))
            for field in custom_fields:
                display_text = f"${{{field['name']}}}"
                if field.get('prompt'):
                    display_text += "*"
                self.variables_tree.insert(custom_vars, "end", text=display_text, tags=("custom_field",))

    def on_variable_select(self, event):
        selected_item = self.variables_tree.selection()
        if not selected_item:
            self.edit_custom_button.config(state="disabled")
            self.delete_custom_button.config(state="disabled")
            self.hint_entry.config(state="disabled")
            self.hint_entry.delete(0, "end")
            return

        tags = self.variables_tree.item(selected_item, "tags")
        if "custom_field" in tags:
            self.edit_custom_button.config(state="normal")
            self.delete_custom_button.config(state="normal")
        else:
            self.edit_custom_button.config(state="disabled")
            self.delete_custom_button.config(state="disabled")

        if "standard_field" in tags or "custom_field" in tags:
            self.hint_entry.config(state="normal")
            variable_name = self.variables_tree.item(selected_item, "text").strip("*").strip("${}")
            if self.template and self.template.variables and variable_name in self.template.variables:
                self.hint_entry.delete(0, "end")
                self.hint_entry.insert(0, self.template.variables[variable_name].get("hint", ""))
            else:
                self.hint_entry.delete(0, "end")
        else:
            self.hint_entry.config(state="disabled")
            self.hint_entry.delete(0, "end")

    def add_custom_field(self):
        dialog = CustomFieldEditorDialog(self)
        self.wait_window(dialog)

        if dialog.result:
            try:
                self.custom_fields_manager.add_custom_field(dialog.result)
                self.populate_variables_tree()
            except ValueError as e:
                messagebox.showerror("Error", str(e), parent=self)

    def edit_custom_field(self):
        selected_item = self.variables_tree.selection()
        if not selected_item:
            return

        variable_name = self.variables_tree.item(selected_item, "text").strip("*")
        old_field_name = variable_name.strip("${}")
        
        # Find the full field data
        field_data = None
        for field in self.custom_fields_manager.get_custom_fields():
            if field['name'] == old_field_name:
                field_data = field
                break
        
        if not field_data:
            messagebox.showerror("Error", "Could not find custom field data to edit.", parent=self)
            return

        dialog = CustomFieldEditorDialog(self, field_data)
        self.wait_window(dialog)

        if dialog.result:
            try:
                self.custom_fields_manager.update_custom_field(old_field_name, dialog.result)
                self.populate_variables_tree()
            except ValueError as e:
                messagebox.showerror("Error", str(e), parent=self)

    def delete_custom_field(self):
        selected_item = self.variables_tree.selection()
        if not selected_item:
            return

        variable_name = self.variables_tree.item(selected_item, "text").strip("*")
        field_name = variable_name.strip("${}")
        
        if messagebox.askyesno("Delete Custom Field", f"Are you sure you want to delete '{field_name}'?"):
            self.custom_fields_manager.remove_custom_field(field_name)
            self.populate_variables_tree()

    def insert_variable(self, variable_name=None):
        if not variable_name:
            selected_item = self.variables_tree.selection()
            if not selected_item:
                return
            
            tags = self.variables_tree.item(selected_item, "tags")
            if "standard" in tags or "custom" in tags:
                return  # Don't insert group headers

            variable_name = self.variables_tree.item(selected_item, "text")
            # Strip the visual indicator '*' before inserting
            if variable_name.endswith('*'):
                variable_name = variable_name[:-1]
        
        self.content_text.insert(tk.INSERT, variable_name)

    def show_variable_popup(self, event):
        popup = tk.Menu(self, tearoff=0)
        
        # Standard variables
        standard_variables = [
            "${client_name}", "${client_id}", "${client_dob}", "${date}", 
            "${counselor_name}", "${workbook_content}", "${session_date}",
            "${session_time}", "${session_duration}", "${group_name}", "${group_id}",
            "${chapter_summary}"
        ]
        for var in standard_variables:
            popup.add_command(label=var, command=lambda v=var: self.insert_variable(v))

        popup.add_separator()

        # Custom fields
        custom_fields = self.custom_fields_manager.get_custom_fields()
        for field in custom_fields:
            var = f"${{{field['name']}}}"
            popup.add_command(label=var, command=lambda v=var: self.insert_variable(v))

        try:
            popup.tk_popup(event.x_root, event.y_root)
        finally:
            popup.grab_release()

    def on_hint_change(self, event):
        selected_item = self.variables_tree.selection()
        if not selected_item:
            return

        variable_name = self.variables_tree.item(selected_item, "text").strip("*").strip("${}")
        if not self.template.variables:
            self.template.variables = {}
        if variable_name not in self.template.variables:
            self.template.variables[variable_name] = {}
        self.template.variables[variable_name]["hint"] = self.hint_entry.get()

    def load_template_data(self):
        self.name_entry.insert(0, self.template.name)
        self.content_text.insert("1.0", self.template.content)
        self.populate_variables_tree()

    def save(self):
        name = self.name_entry.get()
        if not name:
            messagebox.showerror("Error", "Template name cannot be empty.", parent=self)
            return

        self.template_data = {
            "name": name,
            "content": self.content_text.get("1.0", tk.END).strip(),
            "variables": self.template.variables if self.template else {}
        }
        self.destroy()
