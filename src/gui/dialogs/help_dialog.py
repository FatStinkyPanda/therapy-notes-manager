import tkinter as tk
from tkinter import ttk
from ...core.help_manager import HelpManager

class HelpDialog(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Help")
        self.geometry("700x500")
        self.transient(parent)
        self.grab_set()

        self.help_manager = HelpManager()

        self.create_widgets()

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding=10)
        main_frame.pack(expand=True, fill="both")

        search_frame = ttk.Frame(main_frame)
        search_frame.pack(fill="x", pady=5)

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self.search)
        
        ttk.Label(search_frame, text="Search:").pack(side="left", padx=5)
        search_entry = ttk.Entry(search_frame, textvariable=self.search_var)
        search_entry.pack(side="left", expand=True, fill="x", padx=5)

        self.text_area = tk.Text(main_frame, wrap="word", state="disabled")
        self.text_area.pack(expand=True, fill="both")

        self.load_topic("getting_started")

    def search(self, *args):
        query = self.search_var.get().lower()
        if not query:
            self.load_topic("getting_started")
            return

        # In a real app, you'd search through all topics
        if "keyboard" in query:
            self.load_topic("keyboard_shortcuts")
        else:
            self.load_topic("getting_started")

    def load_topic(self, topic):
        content = self.help_manager.get_help_topic(topic)
        self.text_area.config(state="normal")
        self.text_area.delete(1.0, "end")
        self.text_area.insert("end", content)
        self.text_area.config(state="disabled")


if __name__ == "__main__":
    root = tk.Tk()
    button = ttk.Button(root, text="Open Help", command=lambda: HelpDialog(root))
    button.pack(pady=20)
    root.mainloop()
