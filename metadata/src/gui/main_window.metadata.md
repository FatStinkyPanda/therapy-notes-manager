# Metadata for: src/gui/main_window.py

## File Purpose
This file defines the main application window for the Therapy Notes Manager. It serves as the primary container for all other GUI components, including the tabbed interface, menu bar, and status bar.

## Dependencies
- **Internal**:
  - `src.gui.components.menu_bar.MenuBar`
  - `src.gui.components.status_bar.StatusBar`
- **External**:
  - `tkinter`
  - `ttkbootstrap`

## Integration Points
- **Initializes**: `MenuBar`, `StatusBar`
- **Contains**: `ttk.Notebook` which will hold all functional tabs.
- **Launched by**: `src.main.py`

## State Management
- Manages the main window's size and position.
- Holds references to the core GUI components.

## Error Handling
- Implements a graceful exit on window close.

## Performance Considerations
- The window is initialized with a default size and a minimum size to ensure usability.

## Testing Requirements
- **Unit Tests**:
  - Verify that the main window initializes without errors.
  - Check that the title is set correctly.
  - Confirm that the menu bar and status bar are created and packed.
  - Ensure the notebook is created.
- **Integration Tests**:
  - Test that the application launches and the main window is displayed.
  - Verify that menu commands can be triggered.
