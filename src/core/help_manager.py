class HelpManager:
    def __init__(self):
        pass

    def get_help_topic(self, topic):
        # In a real application, this would load from a file or database
        help_text = {
            "getting_started": """
Welcome to the Therapy Notes Manager!

This application is designed to streamline the process of writing therapy notes by using templates and replacement variables.

Benefits:
- Save time: Generate complete notes in seconds.
- Ensure consistency: Use standardized templates for all your notes.
- Reduce errors: Avoid manual data entry errors by using replacement variables.
- Secure: All your project files are encrypted with a password.

How to use the program:

1.  Clients Tab:
    - Add, edit, and delete clients.
    - Organize clients into groups.

2.  Workbooks Tab:
    - Create workbooks, which are collections of chapters.
    - Each chapter can contain content that can be inserted into your notes.

3.  Templates Tab:
    - Create and manage note templates.
    - Use replacement variables (e.g., ${client_name}) to automatically insert client and session information.
    - You can also create your own custom fields.

4.  Notes Generator Tab:
    - Select one or more clients.
    - Select a workbook and chapters.
    - Select a note template.
    - Click "Generate Notes" to create the notes.
    - If your template contains prompted variables, you will be asked to enter them.
    - The generated notes will be displayed in a new window, where you can copy them to your clipboard.

Replacement Variables:
You can use the following standard variables in your templates:
- ${client_name}: The client's name.
- ${client_id}: The client's ID.
- ${client_dob}: The client's date of birth.
- ${date}: The current date.
- ${session_date}: The date of the session.
- ${session_time}: The time of the session.
- ${session_duration}: The duration of the session.
- ${counselor_name}: Your name, as set in the Settings.
- ${workbook_title}: The title of the selected workbook.
- ${workbook_content}: The full content of the selected workbook chapters.
- ${chapter_title}: The title(s) of the selected chapter(s).
- ${chapter_summary}: The content of the selected chapter(s).
- ${section_content}: The content of the selected chapter(s).
- ${Group_Topic}: The topic of the group session (prompted).
- ${Session_Number}: The session number (prompted).
- ${Next_Session_Date}: The date of the next session (prompted).
- ${Next_Session_Time}: The time of the next session (prompted).
- ${Goals_Addressed}: The goals addressed in the session (prompted).

Loading Projects:
You can save your work as a project file (.tnm). To load a project, go to File > Open Project. 
IMPORTANT: Your project is encrypted with a password. If you forget your password, there is no way to recover it and your project will be inaccessible.
""",
            "keyboard_shortcuts": "Ctrl+N: New Note\nCtrl+O: Open Project",
        }
        return help_text.get(topic, "Help topic not found.")
