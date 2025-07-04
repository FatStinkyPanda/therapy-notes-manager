from gui.wizards.wizard_base import WizardBase

class ImportWizard(WizardBase):
    def __init__(self, parent):
        steps = ["Select File", "Parsing Options", "Preview"]
        super().__init__(parent, "Workbook Import Wizard", steps)
