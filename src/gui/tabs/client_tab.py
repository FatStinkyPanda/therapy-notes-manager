import tkinter as tk
from tkinter import ttk, simpledialog
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ..dialogs.add_client_dialog import AddClientDialog
from ..dialogs.edit_client_dialog import EditClientDialog
from ..dialogs.select_group_dialog import SelectGroupDialog
from ...core.custom_fields_manager import CustomFieldsManager
from ...models.client import Client
from ...models.group import Group
from ...core.client_manager import ClientManager
from ...core.group_manager import GroupManager
from ...core.notes_engine import NotesEngine
from ...models.note_template import NoteTemplate
from ..dialogs.generated_notes_dialog import GeneratedNotesDialog
import uuid

from ...core.config_manager import ConfigManager

class ClientTab(tb.Frame):
    def __init__(self, parent, master, client_manager: ClientManager, group_manager: GroupManager, config_manager: ConfigManager):
        super().__init__(parent)
        self.master = master
        self.client_manager = client_manager
        self.group_manager = group_manager
        self.config_manager = config_manager

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        # Client and group tree view
        self.tree = tb.Treeview(content_frame, selectmode="extended", columns=("type",), show="tree headings")
        self.tree.pack(expand=True, fill="both", padx=5, pady=5)
        self.tree.column("#0", width=250, minwidth=250, stretch=tk.YES)
        self.tree.column("type", width=100, minwidth=100, stretch=tk.NO)
        self.tree.heading("#0", text="Name", anchor=tk.W)
        self.tree.heading("type", text="Type", anchor=tk.W)
        self.tree.bind("<<TreeviewSelect>>", self.on_client_select)
        self.populate_clients()

        # Button frame
        button_frame = tb.Frame(content_frame)
        button_frame.pack(pady=5)

        # Client buttons
        client_button_frame = tb.LabelFrame(button_frame, text="Client")
        client_button_frame.pack(side="left", padx=5)
        self.add_client_button = tb.Button(client_button_frame, text="Add", command=self.add_client)
        self.add_client_button.pack(side="left", padx=5)
        self.tooltip(self.add_client_button, "Add a new client.")
        self.edit_client_button = tb.Button(client_button_frame, text="Edit", command=self.edit_client)
        self.edit_client_button.pack(side="left", padx=5)
        self.tooltip(self.edit_client_button, "Edit the selected client.")
        self.delete_client_button = tb.Button(client_button_frame, text="Delete", command=self.delete_client)
        self.delete_client_button.pack(side="left", padx=5)
        self.tooltip(self.delete_client_button, "Delete the selected client.")

        # Group buttons
        group_button_frame = tb.LabelFrame(button_frame, text="Group")
        group_button_frame.pack(side="left", padx=5)
        self.add_group_button = tb.Button(group_button_frame, text="Add", command=self.add_group)
        self.add_group_button.pack(side="left", padx=5)
        self.tooltip(self.add_group_button, "Add a new group.")
        self.rename_group_button = tb.Button(group_button_frame, text="Rename", command=self.rename_group)
        self.rename_group_button.pack(side="left", padx=5)
        self.tooltip(self.rename_group_button, "Rename the selected group.")
        self.delete_group_button = tb.Button(group_button_frame, text="Delete", command=self.delete_group)
        self.delete_group_button.pack(side="left", padx=5)
        self.tooltip(self.delete_group_button, "Delete the selected group.")
        self.add_to_group_button = tb.Button(group_button_frame, text="Add to Group", command=self.add_to_group)
        self.add_to_group_button.pack(side="left", padx=5)
        self.tooltip(self.add_to_group_button, "Add the selected client to a group.")
        self.remove_from_group_button = tb.Button(group_button_frame, text="Remove from Group", command=self.remove_from_group)
        self.remove_from_group_button.pack(side="left", padx=5)
        self.tooltip(self.remove_from_group_button, "Remove the selected client from their group.")

    def add_client(self):
        dialog = AddClientDialog(self, self.client_manager)
        if dialog.show():
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def populate_clients(self):
        for i in self.tree.get_children():
            self.tree.delete(i)

        groups = self.group_manager.get_groups()
        clients_in_groups = {client_id for group in groups for client_id in group.client_ids}

        # Add groups and their clients
        for group in groups:
            group_node = self.tree.insert("", "end", text=group.name, values=("Group",), iid=group.id, open=True)
            for client_id in group.client_ids:
                client = self.client_manager.get_client_by_id(client_id)
                if client:
                    self.tree.insert(group_node, "end", text=client.name, values=("Client",), iid=client.id)

        # Add unassigned clients
        unassigned_node = self.tree.insert("", "end", text="Unassigned", values=("Group",), iid="unassigned", open=True)
        for client in self.client_manager.get_clients():
            if client.id not in clients_in_groups:
                self.tree.insert(unassigned_node, "end", text=client.name, values=("Client",), iid=client.id)

    def on_client_select(self, event):
        pass

    def add_group(self):
        group_name = simpledialog.askstring("New Group", "Enter a name for the new group:")
        if group_name:
            new_group = Group(id=str(uuid.uuid4()), name=group_name)
            self.group_manager.add_group(new_group)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def rename_group(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id): # It's a client
            simpledialog.messagebox.showerror("Error", "Please select a group to rename.")
            return

        group = self.group_manager.get_group_by_id(item_id)
        if not group:
            return

        new_name = simpledialog.askstring("Rename Group", "Enter a new name for the group:", initialvalue=group.name)
        if new_name:
            group.name = new_name
            self.group_manager.update_group(group)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def delete_group(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id): # It's a client
            simpledialog.messagebox.showerror("Error", "Please select a group to delete.")
            return

        if simpledialog.messagebox.askyesno("Confirm", "Are you sure you want to delete this group?"):
            self.group_manager.remove_group(item_id)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def add_to_group(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id) == "": # It's a group
            simpledialog.messagebox.showerror("Error", "Please select a client to add to a group.")
            return

        client_id = item_id
        
        groups = self.group_manager.get_groups()
        if not groups:
            simpledialog.messagebox.showinfo("No Groups", "There are no groups to add this client to.")
            return

        group_names = [g.name for g in groups]
        dialog = SelectGroupDialog(self, group_names)
        selected_group_name = dialog.show()

        if selected_group_name:
            group = next((g for g in groups if g.name == selected_group_name), None)
            if group:
                self.group_manager.add_client_to_group(group.id, client_id)
                self.master.refresh_ui()
                self.master.session_manager.save_project(self.master, ask_for_password=False)

    def remove_from_group(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        parent_id = self.tree.parent(item_id)
        if not parent_id or parent_id == "unassigned":
            simpledialog.messagebox.showerror("Error", "This client is not in a group.")
            return

        client_id = item_id
        self.group_manager.remove_client_from_group(parent_id, client_id)
        self.master.refresh_ui()
        self.master.session_manager.save_project(self.master, ask_for_password=False)

    def edit_client(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id) == "": # It's a group
            simpledialog.messagebox.showerror("Error", "Please select a client to edit.")
            return

        client = self.client_manager.get_client_by_id(item_id)
        if not client:
            return

        dialog = EditClientDialog(self, client, self.config_manager)
        updated_client = dialog.show()

        if updated_client:
            self.client_manager.update_client(updated_client)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def delete_client(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id) == "": # It's a group
            simpledialog.messagebox.showerror("Error", "Please select a client to delete.")
            return

        if simpledialog.messagebox.askyesno("Confirm", "Are you sure you want to delete this client?"):
            # Remove the client from any groups
            for group in self.group_manager.get_groups():
                if item_id in group.client_ids:
                    self.group_manager.remove_client_from_group(group.id, item_id)
            
            self.client_manager.remove_client(item_id)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def tooltip(self, widget, text):
        from ttkbootstrap.tooltip import ToolTip
        tool_tip = ToolTip(widget, text)
