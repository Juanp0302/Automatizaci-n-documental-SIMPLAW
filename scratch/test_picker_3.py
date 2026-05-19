import subprocess
import os

result_file = os.path.abspath("test_folder_result3.txt")
pwsh_cmd = (
    "$app = New-Object -ComObject Shell.Application; "
    "$folder = $app.BrowseForFolder(0, 'Seleccione la carpeta del proyecto', 0, 0); "
    "if ($folder) { "
    f"  $folder.Self.Path | Out-File -FilePath '{result_file}' -Encoding utf8 "
    "} else { "
    f"  'CANCELLED' | Out-File -FilePath '{result_file}' -Encoding utf8 "
    "} "
)

try:
    print(f"Executing: {pwsh_cmd}")
    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", pwsh_cmd],
        check=True
    )
    if os.path.exists(result_file):
        with open(result_file, "r", encoding="utf-8-sig") as f:
            print(f"Result: {f.read().strip()}")
except Exception as e:
    print(f"Error: {e}")
