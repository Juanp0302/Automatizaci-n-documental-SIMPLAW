import subprocess
import os
import time
import tempfile
import uuid

def debug_folder_picker():
    temp_dir = tempfile.gettempdir()
    run_id = uuid.uuid4().hex[:8]
    result_file = os.path.join(temp_dir, f"debug_folder_{run_id}.txt")
    result_file_pwsh = result_file.replace("\\", "\\\\")

    # Use System.Windows.Forms.FolderBrowserDialog
    pwsh_cmd = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "$f = New-Object System.Windows.Forms.FolderBrowserDialog; "
        "$f.Description = 'Debug: Seleccione una carpeta'; "
        "$f.ShowNewFolderButton = $true; "
        "if ($f.ShowDialog() -eq 'OK') { "
        f"  $f.SelectedPath | Out-File -FilePath '{result_file_pwsh}' -Encoding utf8 "
        "} else { "
        f"  'CANCELLED' | Out-File -FilePath '{result_file_pwsh}' -Encoding utf8 "
        "} "
    )

    print("--- DEBUG FOLDER PICKER ---")
    print(f"Temporary file: {result_file}")
    print("Launching PowerShell...")
    
    try:
        # Launch WITHOUT CREATE_NO_WINDOW to see errors
        process = subprocess.Popen(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-ThreadApartmentState", "STA", "-Command", pwsh_cmd]
        )
        
        print("Waiting for you to select a folder in the dialog...")
        for i in range(60):
            if os.path.exists(result_file):
                with open(result_file, "r", encoding="utf-8-sig") as f:
                    content = f.read().strip()
                print(f"SUCCESS! Captured path: {content}")
                os.remove(result_file)
                return
            time.sleep(1)
            if i % 10 == 0:
                print(f"Still waiting... ({i}s)")
        
        print("TIMEOUT: No selection captured after 60 seconds.")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    debug_folder_picker()
