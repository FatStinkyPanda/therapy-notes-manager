import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
import csv
from io import StringIO
from ...models.client import Client
from ...core.client_manager import ClientManager

class BatchImportDialog(tb.Toplevel):
    def __init__(self, parent, client_manager: ClientManager):
        super().__init__(parent)
        self.client_manager = client_manager
        self.result = False

        self.title("Batch Import Clients")
        self.geometry("500x400")
        self.transient(parent)
        self.grab_set()

        self.text_area = tb.Text(self, wrap="word")
        self.text_area.pack(expand=True, fill="both", padx=10, pady=10)

        self.import_button = tb.Button(self, text="Import", command=self.import_clients)
        self.import_button.pack(pady=10)

    def import_clients(self):
        text = self.text_area.get("1.0", "end-1c")
        if not text:
            return

        f = StringIO(text)
        reader = csv.reader(f)
        
        for row in reader:
            if len(row) == 3:
                client_id, name, dob = row
                client = Client(id=client_id.strip(), name=name.strip(), dob=dob.strip())
                self.client_manager.add_client(client)
        
        self.result = True
        self.destroy()

    def show(self):
        self.deiconify()
        self.wait_window()
        return self.result
