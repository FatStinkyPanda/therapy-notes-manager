import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...models.client import Client
from ..components.date_entry import DateEntry
from ...core.config_manager import ConfigManager

class EditClientDialog(tk.Toplevel):
    def __init__(self, parent, client: Client, config_manager: ConfigManager):
        super().__init__(parent)
        self.title("Edit Client")
        self.client = client
        self.config_manager = config_manager
        self.transient(parent)
        self.grab_set()
        self.result = None

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.create_widgets(content_frame)
        self.load_client_data()

    def create_widgets(self, parent):
        # Name
        name_frame = ttk.LabelFrame(parent, text="Name")
        name_frame.pack(fill="x", padx=10, pady=5)
        self.name_entry = ttk.Entry(name_frame)
        self.name_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # ID
        id_frame = ttk.LabelFrame(parent, text="ID")
        id_frame.pack(fill="x", padx=10, pady=5)
        self.id_entry = ttk.Entry(id_frame)
        self.id_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # DOB
        dob_frame = ttk.LabelFrame(parent, text="Date of Birth")
        dob_frame.pack(fill="x", padx=10, pady=5)
        self.dob_entry = DateEntry(dob_frame, self.config_manager)
        self.dob_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # Pronouns
        pronouns_frame = tb.LabelFrame(parent, text="Pronouns")
        pronouns_frame.pack(pady=5, padx=10, fill="x")

        self.pronoun_var = tk.StringVar()
        
        he_him_check = tb.Radiobutton(pronouns_frame, text="He/Him", variable=self.pronoun_var, value="He/Him")
        he_him_check.pack(side="left", padx=5)
        
        she_her_check = tb.Radiobutton(pronouns_frame, text="She/Her", variable=self.pronoun_var, value="She/Her")
        she_her_check.pack(side="left", padx=5)
        
        they_them_check = tb.Radiobutton(pronouns_frame, text="They/Them", variable=self.pronoun_var, value="They/Them")
        they_them_check.pack(side="left", padx=5)

        other_check = tb.Radiobutton(pronouns_frame, text="Other:", variable=self.pronoun_var, value="Other", command=self.toggle_other_pronoun)
        other_check.pack(side="left", padx=5)
        
        self.other_pronoun_entry = tb.Entry(pronouns_frame, state="disabled")
        self.other_pronoun_entry.pack(side="left", padx=5, fill="x", expand=True)

        # Email
        email_frame = ttk.LabelFrame(parent, text="Email")
        email_frame.pack(fill="x", padx=10, pady=5)
        self.email_entry = ttk.Entry(email_frame)
        self.email_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # Phone
        phone_frame = ttk.LabelFrame(parent, text="Phone")
        phone_frame.pack(fill="x", padx=10, pady=5)
        self.phone_entry = ttk.Entry(phone_frame)
        self.phone_entry.pack(fill="x", expand=True, padx=5, pady=5)

        # Buttons
        button_frame = ttk.Frame(parent)
        button_frame.pack(fill="x", padx=10, pady=10)
        
        save_button = ttk.Button(button_frame, text="Save", command=self.save_and_close)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ttk.Button(button_frame, text="Cancel", command=self.destroy)
        cancel_button.pack(side="right")

    def load_client_data(self):
        self.name_entry.insert(0, self.client.name or "")
        self.id_entry.insert(0, self.client.id or "")
        self.dob_entry.insert(0, self.client.dob or "")
        
        pronouns = self.client.pronouns or ""
        if pronouns in ["He/Him", "She/Her", "They/Them"]:
            self.pronoun_var.set(pronouns)
        elif pronouns:
            self.pronoun_var.set("Other")
            self.other_pronoun_entry.config(state="normal")
            self.other_pronoun_entry.insert(0, pronouns)

        self.email_entry.insert(0, self.client.email or "")
        self.phone_entry.insert(0, self.client.phone or "")

    def toggle_other_pronoun(self):
        if self.pronoun_var.get() == "Other":
            self.other_pronoun_entry.config(state="normal")
        else:
            self.other_pronoun_entry.config(state="disabled")

    def save_and_close(self):
        from tkinter import messagebox
        
        pronouns = self.pronoun_var.get()
        if pronouns == "Other":
            pronouns = self.other_pronoun_entry.get()

        if not pronouns:
            messagebox.showerror("Error", "Pronouns are required.")
            return

        self.client.name = self.name_entry.get() or None
        self.client.id = self.id_entry.get() or None
        self.client.dob = self.dob_entry.get() or None
        self.client.pronouns = pronouns
        self.client.email = self.email_entry.get() or None
        self.client.phone = self.phone_entry.get() or None
        self.result = self.client
        self.destroy()

    def show(self):
        self.wm_deiconify()
        self.wait_window()
        return self.result
