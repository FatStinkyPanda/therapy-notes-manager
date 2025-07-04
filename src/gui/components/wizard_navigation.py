import tkinter as tk
from tkinter import ttk
import ttkbootstrap as tb

class WizardNavigation(tb.Frame):
    def __init__(self, parent, wizard):
        super().__init__(parent)
        self.wizard = wizard

        self.back_button = tb.Button(self, text="Back", command=self.wizard.back_step, state="disabled")
        self.back_button.pack(side="left", padx=5)

        self.next_button = tb.Button(self, text="Next", command=self.wizard.next_step)
        self.next_button.pack(side="left", padx=5)

        self.finish_button = tb.Button(self, text="Finish", command=self.wizard.finish, state="disabled")
        self.finish_button.pack(side="left", padx=5)

    def update_buttons(self):
        self.back_button.config(state="normal" if self.wizard.current_step > 0 else "disabled")
        self.next_button.config(state="normal" if self.wizard.current_step < len(self.wizard.steps) - 1 else "disabled")
        self.finish_button.config(state="normal" if self.wizard.current_step == len(self.wizard.steps) - 1 else "disabled")
