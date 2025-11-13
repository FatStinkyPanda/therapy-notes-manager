Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Build the command
strCommand = "cmd /c cd /d """ & strScriptDir & """ && node start-logging-api.js"

' Run hidden (0 = hidden, False = don't wait)
objShell.Run strCommand, 0, False
