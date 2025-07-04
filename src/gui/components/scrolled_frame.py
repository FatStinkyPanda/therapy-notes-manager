import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb

class ScrolledFrame(tb.Frame):
    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)

        # Create a canvas object and a vertical scrollbar for scrolling it.
        self.canvas = tk.Canvas(self, borderwidth=0)
        self.scrollbar = tb.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)

        # This is what we'll be scrolling.
        self.scrollable_frame = tb.Frame(self.canvas)
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(
                scrollregion=self.canvas.bbox("all")
            )
        )

        self.canvas.bind('<Configure>', self.on_canvas_configure)
        self.canvas.bind("<MouseWheel>", self._on_mousewheel)

    def on_canvas_configure(self, event):
        self.canvas.itemconfig(self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw"), width=event.width)

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")
