import tkinter as tk
from tkinter import ttk
import webbrowser

class AboutDialog(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("About Therapy Notes Manager")
        self.geometry("400x400")
        self.transient(parent)
        self.grab_set()

        self.create_widgets()

    def create_widgets(self):
        frame = ttk.Frame(self, padding=20)
        frame.pack(expand=True, fill="both")

        title_label = ttk.Label(frame, text="Therapy Notes Manager", font=("Helvetica", 16, "bold"))
        title_label.pack(pady=10)

        version_label = ttk.Label(frame, text="Version 0.1.0-alpha")
        version_label.pack()

        author_label = ttk.Label(frame, text="Created by Daniel Bissey")
        author_label.pack()

        link_label = ttk.Label(frame, text="github.com/FatStinkyPanda/therapy-notes-manager", foreground="white", cursor="hand2")
        link_label.pack(pady=10)
        link_label.bind("<Button-1>", lambda e: webbrowser.open_new("https://github.com/FatStinkyPanda/therapy-notes-manager"))

        contact_text = "Need a software solution for your company fast and affordably? Email me at support@fatstinkypanda.com. I offer great rates for small businesses and would love to find you solutions and help you grow your business. I also enjoy supporting non-profits and important causes."
        contact_label = ttk.Label(frame, text=contact_text, wraplength=360, justify="center")
        contact_label.pack(pady=10)

        linkedin_label = ttk.Label(frame, text="linkedin.com/in/daniel-bissey", foreground="white", cursor="hand2")
        linkedin_label.pack(pady=10)
        linkedin_label.bind("<Button-1>", lambda e: webbrowser.open_new("https://linkedin.com/in/daniel-bissey"))

        close_button = ttk.Button(frame, text="Close", command=self.destroy)
        close_button.pack(pady=10)


if __name__ == "__main__":
    root = tk.Tk()
    button = ttk.Button(root, text="Open About", command=lambda: AboutDialog(root))
    button.pack(pady=20)
    root.mainloop()
