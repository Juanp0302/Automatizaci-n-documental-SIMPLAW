import subprocess
import os

result_file = os.path.abspath("test_folder_result.txt")
pwsh_cmd = (
    "Add-Type -AssemblyName System.Windows.Forms; "
    "$f = New-Object System.Windows.Forms.FolderBrowserDialog; "
    "$f.Description = 'Seleccione la carpeta del proyecto'; "
    "$f.ShowNewFolderButton = $true; "
    "$f.RootFolder = 'MyComputer'; "
    "if ($f.ShowDialog() -eq 'OK') { "
    f"  $f.SelectedPath | Out-File -FilePath '{result_file}' -Encoding utf8 "
    "} else { "
    f"  'CANCELLED' | Out-File -FilePath '{result_file}' -Encoding utf8 "
    "} "
)

try:
    print(f"Executing: {pwsh_cmd}")
    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Sta", "-Command", pwsh_cmd],
        check=True
    )
    if os.path.exists(result_file):
        with open(result_file, "r", encoding="utf-8-sig") as f:
            print(f"Result: {f.read().strip()}")
except Exception as e:
    print(f"Error: {e}")
