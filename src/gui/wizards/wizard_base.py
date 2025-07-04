import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb
from gui.components.wizard_navigation import WizardNavigation

class WizardBase(tb.Toplevel):
    def __init__(self, parent, title, steps):
        super().__init__(parent)

        self.title(title)
        self.geometry("800x600")

        self.steps = steps
        self.current_step = 0

        self.notebook = ttk.Notebook(self)
        self.notebook.pack(expand=True, fill="both", padx=10, pady=10)

        self.frames = []
        for step in self.steps:
            frame = tb.Frame(self.notebook)
            self.notebook.add(frame, text=step)
            self.frames.append(frame)

        self.navigation = WizardNavigation(self, self)
        self.navigation.pack(pady=10)
        self.navigation.update_buttons()

    def next_step(self):
        if self.current_step < len(self.steps) - 1:
            self.current_step += 1
            self.notebook.select(self.current_step)
            self.navigation.update_buttons()

    def back_step(self):
        if self.current_step > 0:
            self.current_step -= 1
            self.notebook.select(self.current_step)
            self.navigation.update_buttons()

    def finish(self):
        self.destroy()
