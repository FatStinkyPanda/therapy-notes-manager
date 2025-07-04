# Metadata: [Module/Class Name]
> File: /src/[path/to/file.py]
> Created: [YYYY-MM-DD HH:MM:SS]
> Last Modified: [YYYY-MM-DD HH:MM:SS]
> Last Modified By: [Task ID or Developer]

## Module Overview
**Purpose**: [Clear description of what this module does]
**Type**: [Module|Class|GUI Component|Data Handler|Utility|Service]
**Criticality**: [Core|Important|Standard|Utility]

## Dependencies

### Imports
```python
import tkinter as tk
from typing import Optional, List, Dict
# ... other imports
```

### External Dependencies
- `ttkbootstrap`: UI styling and theming
- `bcrypt`: Password hashing and encryption
- [Other third-party packages]

### Internal Dependencies
- `core.config_manager`: Application configuration
- `gui.dialogs.base_dialog`: Base dialog class
- [Other internal modules]

## Exports

### Classes
```python
class TherapyNotesManager:
    """Main application controller class"""
```

### Functions
```python
def generate_therapy_note(client: Client, template: Template) -> str:
    """Generate a therapy note for a client"""
```

## Integration Points

### GUI Integration
- **Parent Window**: Main application window
- **Child Components**: Client list, workbook tree
- **Events Emitted**: note_generated, session_saved
- **Events Handled**: client_selected, template_changed

### Data Flow
- **Reads**: Client data, workbook content, templates
- **Writes**: Generated notes, session state
- **Cache**: Recently used templates

### Security Considerations
- **Encryption**: Project files encrypted with BCrypt
- **PHI Handling**: All patient data encrypted at rest
- **Access Control**: Password verification required
- **Audit Trail**: All data access logged

## Error Handling
- **File Not Found**: Graceful fallback with user notification
- **Invalid Data**: Validation with detailed error messages
- **Network Issues**: Offline mode support
- **Encryption Errors**: Secure failure with data protection

## Performance Considerations
- **Memory Usage**: Lazy loading for large workbooks
- **Response Time**: <100ms for UI interactions
- **Batch Processing**: Chunked processing for large groups
- **Caching**: LRU cache for frequently accessed data

## Testing Requirements
- **Unit Tests**: All public methods tested
- **Integration Tests**: GUI interaction flows
- **Security Tests**: Encryption/decryption verification
- **Performance Tests**: Load testing with 1000+ clients
- **Coverage Target**: 90%

## Configuration
- **Settings Used**: 
  - `default_template_path`
  - `encryption_rounds`
  - `auto_save_interval`
- **Environment Variables**: None required
- **Config Files**: `/data/config/settings.json`

## Related Files
- `/src/[related/module.py]` - Related functionality
- `/tests/test_[module].py` - Test file
- `/docs/[module]_guide.md` - User documentation

## Change History
- [TNM-XXX] - Initial implementation
- [TNM-XXX] - Added encryption support
- [TNM-XXX] - Performance optimization

## Security Notes
- All methods handling PHI must use encryption
- Password fields must never be logged
- Session tokens expire after inactivity

## Notes
[Any additional important information about this module]

---
*This metadata is maintained by PANDA v3.0*
*Developed by Daniel Anthony Bissey (FatStinkyPanda)*