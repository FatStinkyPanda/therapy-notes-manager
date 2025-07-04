import tkinter as tk
from tkinter import ttk, messagebox
from ...core.custom_fields_manager import CustomFieldsManager
from ...models.custom_field import CustomField

class CustomFieldsDialog(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Custom Fields Management")
        self.geometry("600x400")
        self.transient(parent)
        self.grab_set()

        self.custom_fields_manager = CustomFieldsManager()

        self.create_widgets()
        self.load_fields()

    def create_widgets(self):
        self.tree = ttk.Treeview(self, columns=("name", "type", "default"), show="headings")
        self.tree.heading("name", text="Name")
        self.tree.heading("type", text="Type")
        self.tree.heading("default", text="Default Value")
        self.tree.pack(expand=True, fill="both", padx=10, pady=10)

        button_frame = ttk.Frame(self)
        button_frame.pack(fill="x", padx=10, pady=10)

        add_button = ttk.Button(button_frame, text="Add", command=self.add_field)
        add_button.pack(side="left", padx=5)

        edit_button = ttk.Button(button_frame, text="Edit", command=self.edit_field)
        edit_button.pack(side="left", padx=5)

        remove_button = ttk.Button(button_frame, text="Remove", command=self.remove_field)
        remove_button.pack(side="left", padx=5)

    def load_fields(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for field in self.custom_fields_manager.get_custom_fields():
            self.tree.insert("", "end", values=(field['name'], field['type'], field.get('default_value', '')))

    def add_field(self):
        self.show_field_dialog()

    def edit_field(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showerror("Error", "Please select a field to edit.")
            return
        
        field_name = self.tree.item(selected_item, "values")[0]
        field_data = next((field for field in self.custom_fields_manager.get_custom_fields() if field['name'] == field_name), None)
        if field_data:
            self.show_field_dialog(field_data)

    def remove_field(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showerror("Error", "Please select a field to remove.")
            return

        field_name = self.tree.item(selected_item, "values")[0]
        if messagebox.askyesno("Confirm", f"Are you sure you want to remove the field '{field_name}'?"):
            self.custom_fields_manager.remove_custom_field(field_name)
            self.load_fields()

    def show_field_dialog(self, field_data=None):
        dialog = FieldEditorDialog(self, field_data)
        self.wait_window(dialog)
        self.load_fields()

class FieldEditorDialog(tk.Toplevel):
    def __init__(self, parent, field_data=None):
        super().__init__(parent)
        self.title("Field Editor" if field_data else "Add Field")
        self.geometry("300x200")
        self.transient(parent)
        self.grab_set()

        self.field_data = field_data
        self.custom_fields_manager = CustomFieldsManager()

        self.create_widgets()

    def create_widgets(self):
        frame = ttk.Frame(self, padding=10)
        frame.pack(expand=True, fill="both")

        ttk.Label(frame, text="Name:").grid(row=0, column=0, sticky="w")
        self.name_entry = ttk.Entry(frame)
        self.name_entry.grid(row=0, column=1, sticky="ew")

        ttk.Label(frame, text="Type:").grid(row=1, column=0, sticky="w")
        self.type_combo = ttk.Combobox(frame, values=["text", "date", "dropdown"])
        self.type_combo.grid(row=1, column=1, sticky="ew")

        ttk.Label(frame, text="Default Value:").grid(row=2, column=0, sticky="w")
        self.default_entry = ttk.Entry(frame)
        self.default_entry.grid(row=2, column=1, sticky="ew")

        if self.field_data:
            self.name_entry.insert(0, self.field_data['name'])
            self.type_combo.set(self.field_data['type'])
            self.default_entry.insert(0, self.field_data.get('default_value', ''))

        button_frame = ttk.Frame(self)
        button_frame.pack(fill="x", padx=10, pady=10)

        save_button = ttk.Button(button_frame, text="Save", command=self.save_field)
        save_button.pack(side="right", padx=5)

        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right", padx=5)

    def save_field(self):
        name = self.name_entry.get()
        field_type = self.type_combo.get()
        default_value = self.default_entry.get()

        if not name or not field_type:
            messagebox.showerror("Error", "Name and type are required.")
            return

        new_field_data = {
            "name": name,
            "type": field_type,
            "default_value": default_value,
            "options": [],
            "validation_rules": {}
        }

        if self.field_data:
            self.custom_fields_manager.remove_custom_field(self.field_data['name'])
        
        self.custom_fields_manager.add_custom_field(new_field_data)
        self.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    button = ttk.Button(root, text="Open Custom Fields", command=lambda: CustomFieldsDialog(root))
    button.pack(pady=20)
    root.mainloop()
