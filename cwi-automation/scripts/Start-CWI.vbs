' Start-CWI.vbs — Launches cwi-tray.ps1 with no visible console window.
' Double-click this file (or add it to Windows Startup) to run CWI Control Center.
Dim shell, dir
Set shell = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
shell.Run "powershell -STA -WindowStyle Hidden -NonInteractive -ExecutionPolicy Bypass -File """ & dir & "\cwi-tray.ps1""", 0, False
Set shell = Nothing
