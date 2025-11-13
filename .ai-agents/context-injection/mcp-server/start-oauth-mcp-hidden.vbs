Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Build the path to the compiled OAuth MCP server
serverPath = objFSO.BuildPath(scriptDir, "dist\mcp-sse-oauth-authcode-full.js")

' Check if the server file exists
If Not objFSO.FileExists(serverPath) Then
    MsgBox "OAuth MCP server not found at: " & serverPath & vbCrLf & vbCrLf & "Please build the server first with 'npm run build'", vbCritical, "OpenMemory OAuth MCP Server"
    WScript.Quit 1
End If

' Start the OAuth MCP server hidden
objShell.Run "node """ & serverPath & """", 0, False

' Give it a moment to start
WScript.Sleep 1000
