import subprocess
import os
import tempfile
import uuid
import time

temp_file_path = os.path.join(tempfile.gettempdir(), f"debug_folder_{uuid.uuid4()}.txt")
print(f"Temp file: {temp_file_path}")

pwsh_cmd = (
    f"$app = New-Object -ComObject Shell.Application; "
    f"$folder = $app.BrowseForFolder(0, 'Seleccione la carpeta del proyecto', 0, 0); "
    f"if ($folder) {{ "
    f"  $folder.Self.Path | Out-File -FilePath '{temp_file_path}' -Encoding utf8 "
    f"}} else {{ "
    f"  'CANCELLED' | Out-File -FilePath '{temp_file_path}' -Encoding utf8 "
    f"}} "
)

print("Running PowerShell...")
proc = subprocess.Popen(
    ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-ThreadApartmentState", "STA", "-Command", pwsh_cmd],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print("Waiting for file...")
for _ in range(30):
    if os.path.exists(temp_file_path):
        with open(temp_file_path, "r", encoding="utf-8") as f:
            print(f"Result: {f.read().strip()}")
        break
    time.sleep(1)
else:
    print("Timeout or no file created.")
    stdout, stderr = proc.communicate()
    print(f"STDOUT: {stdout}")
    print(f"STDERR: {stderr}")

if os.path.exists(temp_file_path):
    os.remove(temp_file_path)
