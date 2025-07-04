import tkinter as tk
from tkinter import ttk

class CheckboxTreeview(ttk.Treeview):
    def __init__(self, master=None, **kw):
        super().__init__(master, **kw)
        self.tag_configure("checked", image=self._get_image("checked"))
        self.tag_configure("unchecked", image=self._get_image("unchecked"))
        self.bind("<Button-1>", self.on_click, True)

    def _get_image(self, name):
        # Create a blank image
        img = tk.PhotoImage(width=16, height=16)
        if name == "checked":
            # Draw a checkmark
            img.put(("{#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000} "
                     "{#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #ffffff #ffffff} "
                     "{#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #ffffff #ffffff #ffffff #ffffff} "
                     "{#000000 #000000 #000000 #000000 #000000 #000000 #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#000000 #000000 #000000 #000000 #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#000000 #000000 #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff} "
                     "{#ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff #ffffff}"))
        return img

    def on_click(self, event):
        region = self.identify_region(event.x, event.y)
        if region == "tree":
            item = self.identify_row(event.y)
            if item:
                tags = self.item(item, "tags")
                if "checked" in tags:
                    self.item(item, tags=("unchecked",))
                else:
                    self.item(item, tags=("checked",))

    def insert(self, parent, index, iid=None, **kw):
        if "tags" not in kw:
            kw["tags"] = ("unchecked",)
        
        opts = []
        for k, v in kw.items():
            opts.append(f"-{k}")
            opts.append(v)

        if iid is None:
            iid = self.tk.call(self._w, "insert", parent, index, *opts)
        else:
            self.tk.call(self._w, "insert", parent, index, "-id", iid, *opts)
        return iid

    def get_checked(self):
        checked = []
        for item in self.get_children():
            if "checked" in self.item(item, "tags"):
                checked.append(item)
            for child in self.get_children(item):
                if "checked" in self.item(child, "tags"):
                    checked.append(child)
        return checked
