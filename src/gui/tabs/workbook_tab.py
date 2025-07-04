import tkinter as tk
from tkinter import ttk, messagebox
import ttkbootstrap as tb
from ..components.scrolled_frame import ScrolledFrame
from ...core.workbook_manager import WorkbookManager
from ..dialogs.workbook_editor_dialog import WorkbookEditorDialog
from ..dialogs.chapter_editor_dialog import ChapterEditorDialog
from ...models.chapter import Chapter
import uuid

class WorkbookTab(tb.Frame):
    def __init__(self, parent, master, workbook_manager: WorkbookManager):
        super().__init__(parent)
        self.master = master
        self.workbook_manager = workbook_manager

        scrolled_frame = ScrolledFrame(self)
        scrolled_frame.pack(expand=True, fill="both")
        content_frame = scrolled_frame.scrollable_frame

        # Paned window for tree and content
        main_pane = ttk.PanedWindow(content_frame, orient=tk.HORIZONTAL)
        main_pane.pack(fill="both", expand=True, padx=5, pady=5)

        # Workbook and chapter tree view
        tree_frame = ttk.Frame(main_pane)
        main_pane.add(tree_frame, weight=1)
        self.tree = tb.Treeview(tree_frame, selectmode="extended", columns=("type",), show="tree headings")
        self.tree.pack(expand=True, fill="both")
        self.tree.column("#0", width=250, minwidth=250, stretch=tk.YES)
        self.tree.column("type", width=100, minwidth=100, stretch=tk.NO)
        self.tree.heading("#0", text="Title", anchor=tk.W)
        self.tree.heading("type", text="Type", anchor=tk.W)
        self.populate_workbooks()
        self.tree.bind("<<TreeviewSelect>>", self.on_chapter_select)
        self.tree.bind("<Button-3>", self.show_context_menu)

        # Chapter content viewer
        content_pane_inner = ttk.PanedWindow(main_pane, orient=tk.VERTICAL)
        main_pane.add(content_pane_inner, weight=2)

        # Chapter summary
        summary_frame = ttk.LabelFrame(content_pane_inner, text="Summary")
        content_pane_inner.add(summary_frame, weight=1)
        self.summary_text = tk.Text(summary_frame, height=5, state="disabled")
        self.summary_text.pack(fill="both", expand=True, padx=5, pady=5)

        # Chapter content
        content_frame_inner = ttk.LabelFrame(content_pane_inner, text="Content")
        content_pane_inner.add(content_frame_inner, weight=3)
        self.content_text = tk.Text(content_frame_inner, height=15, state="disabled")
        self.content_text.pack(fill="both", expand=True, padx=5, pady=5)

        # Button frame
        button_frame = tb.Frame(content_frame)
        button_frame.pack(pady=5, fill="x", padx=5)

        # Workbook buttons
        wb_button_frame = tb.LabelFrame(button_frame, text="Workbook")
        wb_button_frame.pack(side="left", padx=5)
        self.add_workbook_button = tb.Button(wb_button_frame, text="Add", command=self.add_workbook)
        self.add_workbook_button.pack(side="left", padx=5)
        self.tooltip(self.add_workbook_button, "Add a new workbook.")
        self.edit_workbook_button = tb.Button(wb_button_frame, text="Edit", command=self.edit_workbook)
        self.edit_workbook_button.pack(side="left", padx=5)
        self.tooltip(self.edit_workbook_button, "Edit the selected workbook.")
        self.delete_workbook_button = tb.Button(wb_button_frame, text="Delete", command=self.delete_workbook)
        self.delete_workbook_button.pack(side="left", padx=5)
        self.tooltip(self.delete_workbook_button, "Delete the selected workbook.")

        # Chapter buttons
        ch_button_frame = tb.LabelFrame(button_frame, text="Chapter")
        ch_button_frame.pack(side="left", padx=5)
        self.add_chapter_button = tb.Button(ch_button_frame, text="Add", command=self.add_chapter)
        self.add_chapter_button.pack(side="left", padx=5)
        self.tooltip(self.add_chapter_button, "Add a new chapter to the selected workbook.")
        self.edit_chapter_button = tb.Button(ch_button_frame, text="Edit", command=self.edit_chapter)
        self.edit_chapter_button.pack(side="left", padx=5)
        self.tooltip(self.edit_chapter_button, "Edit the selected chapter.")
        self.delete_chapter_button = tb.Button(ch_button_frame, text="Delete", command=self.delete_chapter)
        self.delete_chapter_button.pack(side="left", padx=5)
        self.tooltip(self.delete_chapter_button, "Delete the selected chapter.")


    def populate_workbooks(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for workbook in self.workbook_manager.get_workbooks():
            wb_node = self.tree.insert("", "end", text=workbook.title, values=("Workbook",), iid=workbook.id, open=True)
            for chapter in workbook.chapters:
                self.tree.insert(wb_node, "end", text=chapter.title, values=("Chapter",), iid=chapter.id)

    def add_workbook(self):
        dialog = WorkbookEditorDialog(self, self.workbook_manager)
        if dialog.show():
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def edit_workbook(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return
        
        item_id = selected_item[0]
        if self.tree.parent(item_id): # It's a chapter
            messagebox.showerror("Error", "Please select a workbook to edit.")
            return

        workbook = self.workbook_manager.get_workbook_by_id(item_id)
        if not workbook:
            return

        dialog = WorkbookEditorDialog(self, self.workbook_manager, workbook)
        if dialog.show():
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def delete_workbook(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id): # It's a chapter
            messagebox.showerror("Error", "Please select a workbook to delete.")
            return

        if messagebox.askyesno("Confirm", "Are you sure you want to delete this workbook?"):
            self.workbook_manager.remove_workbook(item_id)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def add_chapter(self):
        import logging
        logging.info("add_chapter called")
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showerror("Error", "Please select a workbook to add a chapter to.")
            return

        item_id = selected_item[0]
        parent_id = self.tree.parent(item_id) or item_id
        
        workbook = self.workbook_manager.get_workbook_by_id(parent_id)
        if not workbook:
            return

        new_chapter = Chapter(id=str(uuid.uuid4()), title="New Chapter", workbook_title=workbook.title)
        dialog = ChapterEditorDialog(self, self.workbook_manager, workbook.id, new_chapter)
        dialog.wait_window() # Blocks until dialog is closed

        # If chapter title is not empty after editing, add it
        updated_chapter = dialog.get_chapter()
        logging.info(f"Updated chapter title: {updated_chapter.title}")
        if updated_chapter.title:
            # Check if the chapter is already in the list
            if not any(c.id == updated_chapter.id for c in workbook.chapters):
                logging.info(f"Adding new chapter: {updated_chapter.title}")
                workbook.chapters.append(updated_chapter)
            self.workbook_manager.update_workbook(workbook)
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def edit_chapter(self):
        import logging
        logging.info("edit_chapter called")
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        parent_id = self.tree.parent(item_id)
        if not parent_id: # It's a workbook
            messagebox.showerror("Error", "Please select a chapter to edit.")
            return

        workbook = self.workbook_manager.get_workbook_by_id(parent_id)
        chapter = next((ch for ch in workbook.chapters if ch.id == item_id), None)
        
        if not chapter:
            return

        dialog = ChapterEditorDialog(self, self.workbook_manager, workbook.id, chapter)
        dialog.wait_window()
        updated_chapter = dialog.get_chapter()
        logging.info(f"Updating chapter: {updated_chapter.title}")
        self.workbook_manager.update_chapter(workbook.id, updated_chapter)
        self.master.refresh_ui()
        self.master.session_manager.save_project(self.master, ask_for_password=False)

    def delete_chapter(self):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        parent_id = self.tree.parent(item_id)
        if not parent_id: # It's a workbook
            messagebox.showerror("Error", "Please select a chapter to delete.")
            return

        if messagebox.askyesno("Confirm", "Are you sure you want to delete this chapter?"):
            workbook = self.workbook_manager.get_workbook_by_id(parent_id)
            workbook.chapters = [ch for ch in workbook.chapters if ch.id != item_id]
            self.master.refresh_ui()
            self.master.session_manager.save_project(self.master, ask_for_password=False)

    def tooltip(self, widget, text):
        from ttkbootstrap.tooltip import ToolTip
        tool_tip = ToolTip(widget, text)

    def on_chapter_select(self, event):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item_id = selected_item[0]
        if self.tree.parent(item_id) == "": # It's a workbook
            self.summary_text.config(state="normal")
            self.content_text.config(state="normal")
            self.summary_text.delete("1.0", tk.END)
            self.content_text.delete("1.0", tk.END)
            self.summary_text.config(state="disabled")
            self.content_text.config(state="disabled")
            return

        parent_id = self.tree.parent(item_id)
        workbook = self.workbook_manager.get_workbook_by_id(parent_id)
        if not workbook:
            return

        chapter = next((ch for ch in workbook.chapters if ch.id == item_id), None)
        if not chapter:
            return

        self.summary_text.config(state="normal")
        self.content_text.config(state="normal")
        self.summary_text.delete("1.0", tk.END)
        self.summary_text.insert("1.0", chapter.summary)
        self.content_text.delete("1.0", tk.END)
        self.content_text.insert("1.0", chapter.content)
        self.summary_text.config(state="disabled")
        self.content_text.config(state="disabled")

    def show_context_menu(self, event):
        item_id = self.tree.identify_row(event.y)
        if not item_id:
            return

        self.tree.selection_set(item_id)
        item_type = self.tree.item(item_id, "values")[0]

        context_menu = tk.Menu(self, tearoff=0)
        if item_type == "Workbook":
            context_menu.add_command(label="Add Chapter", command=self.add_chapter)
            context_menu.add_separator()
            context_menu.add_command(label="Edit Workbook", command=self.edit_workbook)
            context_menu.add_command(label="Delete Workbook", command=self.delete_workbook)
        elif item_type == "Chapter":
            context_menu.add_command(label="Edit Chapter", command=self.edit_chapter)
            context_menu.add_command(label="Delete Chapter", command=self.delete_chapter)

        context_menu.tk_popup(event.x_root, event.y_root)
