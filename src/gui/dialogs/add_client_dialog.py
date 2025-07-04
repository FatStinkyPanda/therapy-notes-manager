import tkinter as tk
from tkinter import ttk, messagebox
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...models.client import Client
from ...core.client_manager import ClientManager
from ..components.date_entry import DateEntry

class AddClientDialog(tb.Toplevel):
    def __init__(self, parent, client_manager: ClientManager):
        super().__init__(parent)
        self.client_manager = client_manager
        self.result = None

        self.title("Add Client")
        self.geometry("400x600")
        self.transient(parent)
        self.grab_set()

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        self.name_label = tb.Label(content_frame, text="Name:")
        self.name_label.pack(pady=5)
        self.name_entry = tb.Entry(content_frame)
        self.name_entry.pack(pady=5)

        self.id_label = tb.Label(content_frame, text="ID:")
        self.id_label.pack(pady=5)
        self.id_entry = tb.Entry(content_frame)
        self.id_entry.pack(pady=5)

        self.dob_label = tb.Label(content_frame, text="Date of Birth (Optional):")
        self.dob_label.pack(pady=5)
        self.dob_entry = DateEntry(content_frame)
        self.dob_entry.pack(pady=5, padx=10, fill="x")

        pronouns_frame = tb.LabelFrame(content_frame, text="Pronouns")
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

        self.email_label = tb.Label(content_frame, text="Email (Optional):")
        self.email_label.pack(pady=5)
        self.email_entry = tb.Entry(content_frame)
        self.email_entry.pack(pady=5)

        self.phone_label = tb.Label(content_frame, text="Phone (Optional):")
        self.phone_label.pack(pady=5)
        self.phone_entry = tb.Entry(content_frame)
        self.phone_entry.pack(pady=5)

        self.add_button = tb.Button(content_frame, text="Add", command=self.add)
        self.add_button.pack(pady=10)

    def toggle_other_pronoun(self):
        if self.pronoun_var.get() == "Other":
            self.other_pronoun_entry.config(state="normal")
        else:
            self.other_pronoun_entry.config(state="disabled")

    def add(self):
        name = self.name_entry.get() or None
        client_id = self.id_entry.get() or None
        dob = self.dob_entry.get() or None
        
        pronouns = self.pronoun_var.get()
        if pronouns == "Other":
            pronouns = self.other_pronoun_entry.get()

        email = self.email_entry.get() or None
        phone = self.phone_entry.get() or None

        if not name and not client_id:
            messagebox.showerror("Error", "Client must have at least a name or an ID.")
            return
            
        if not pronouns:
            messagebox.showerror("Error", "Pronouns are required.")
            return

        try:
            client = Client(id=client_id, name=name, dob=dob, pronouns=pronouns, email=email, phone=phone)
            self.client_manager.add_client(client)
            self.result = client
            self.destroy()
        except ValueError as e:
            messagebox.showerror("Error", str(e))

    def show(self):
        self.deiconify()
        self.wait_window()
        return self.result
