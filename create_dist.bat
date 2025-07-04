@echo off
echo Building executable...
python setup.py build

echo Creating distribution directory...
if not exist dist mkdir dist
xcopy /s /e /y build\\exe.win-amd64-3.13 dist\\TherapyNotesManager

echo Creating desktop shortcut...
set SCRIPT_PATH=%~dp0TherapyNotesManager.vbs
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT_PATH%
echo sLinkFile = "%USERPROFILE%\\Desktop\\Therapy Notes Manager.lnk" >> %SCRIPT_PATH%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT_PATH%
echo oLink.TargetPath = "%~dp0dist\\TherapyNotesManager\\run.exe" >> %SCRIPT_PATH%
echo oLink.Save >> %SCRIPT_PATH%
cscript //nologo %SCRIPT_PATH%
del %SCRIPT_PATH%

echo Done.
