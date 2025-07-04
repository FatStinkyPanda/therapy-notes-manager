import sys
import os
import logging
from .gui.main_window import MainWindow
from .core.session_manager import SessionManager
from .utils.paths import PATHS

def setup_logging():
    """Sets up logging to a file."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    log_file = os.path.join(project_root, "therapy_notes_manager.log")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

from .core.client_manager import ClientManager
from .core.workbook_manager import WorkbookManager
from .core.group_manager import GroupManager
from .core.template_manager import TemplateManager

def main():
    """Main function to run the Therapy Notes Manager application."""
    setup_logging()
    logging.info("Application started.")
    
    app = MainWindow()
    
    app.mainloop()
    logging.info("Application closed.")

if __name__ == "__main__":
    main()
