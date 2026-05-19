import subprocess

pwsh_cmd = (
    "Add-Type -AssemblyName System.Windows.Forms; "
    "$f = New-Object System.Windows.Forms.FolderBrowserDialog; "
    "$f.Description = 'Seleccione la carpeta del proyecto'; "
    "$f.ShowNewFolderButton = $true; "
    "$f.RootFolder = 'MyComputer'; "
    "if ($f.ShowDialog() -eq 'OK') { "
    "  Write-Host 'Selected: ' $f.SelectedPath "
    "} else { "
    "  Write-Host 'CANCELLED' "
    "} "
)

try:
    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Sta", "-Command", pwsh_cmd],
        check=True
    )
except Exception as e:
    print(f"Error: {e}")
