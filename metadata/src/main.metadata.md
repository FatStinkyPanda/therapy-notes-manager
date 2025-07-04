# Metadata: Main Application Entry Point
> File: /src/main.py
> Created: 2025-01-03 10:00:00
> Last Modified: 2025-01-03 10:00:00
> Last Modified By: [TNM-001]

## Module Overview
**Purpose**: Application entry point that initializes the Therapy Notes Manager, sets up logging, and launches the main GUI window
**Type**: Module
**Criticality**: Core

## Dependencies

### Imports
```python
import sys
import logging
import tkinter as tk
from pathlib import Path
from typing import Optional
```

### External Dependencies
- `tkinter`: Python's standard GUI library (built-in)
- Python 3.11+: Required for latest typing features

### Internal Dependencies
- `gui.main_window`: Main application window class (to be implemented)

## Exports

### Functions
```python
def setup_logging() -> None:
    """Configure application logging"""

def check_python_version() -> None:
    """Ensure Python version meets requirements"""

def main() -> int:
    """Main application entry point"""
```

## Integration Points

### System Integration
- **Entry Point**: Called by Python interpreter or PyInstaller executable
- **Exit Codes**: 0 for success, 1 for error
- **Logging**: Writes to therapy_notes_manager.log and stdout

### GUI Integration
- **Creates**: Root Tk window
- **Initializes**: TherapyNotesApp main window
- **Window Config**: 1024x768 minimum, centered on screen

## Error Handling
- **Python Version**: Exits with error if Python < 3.11
- **Fatal Errors**: Logged with traceback, returns exit code 1
- **GUI Errors**: Caught and logged, graceful shutdown

## Performance Considerations
- **Startup Time**: Target <3 seconds to GUI display
- **Memory**: Minimal footprint at startup
- **Logging**: Async logging to prevent UI blocking

## Testing Requirements
- **Unit Tests**: Test version checking, logging setup
- **Integration Tests**: Application startup/shutdown
- **Coverage Target**: 90%

## Configuration
- **Window Title**: "Therapy Notes Manager - Developed by FatStinkyPanda"
- **Log File**: therapy_notes_manager.log
- **Log Level**: INFO by default

## Related Files
- `/src/gui/main_window.py` - Main application window
- `/tests/test_main.py` - Test file
- `/therapy_notes_manager.log` - Application log

## Change History
- [TNM-001] - Initial implementation with placeholder

## Security Notes
- No sensitive data handled in main.py
- Logging configured to exclude PHI

## Notes
- Entry point for both development (python main.py) and production (executable)
- Window centering calculation works for multi-monitor setups
- Placeholder label shows until main_window module is implemented

---
*This metadata is maintained by PANDA v3.0*
*Developed by Daniel Anthony Bissey (FatStinkyPanda)*