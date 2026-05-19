import os
import time
import uuid
import tempfile
from fastapi import APIRouter, Depends
from app.api import deps

router = APIRouter()


@router.get("/select-folder")
def select_folder(
    current_user = Depends(deps.get_current_extractor_user)
):
    """
    Abre un diálogo nativo de selección de carpeta usando PowerShell + WinForms.
    Se ejecuta como un proceso de fondo sin ventana de consola para mejorar la UX.
    El resultado se comunica de vuelta mediante un archivo temporal.
    """
    temp_dir = tempfile.gettempdir()
    run_id = uuid.uuid4().hex[:8]
    result_file = os.path.join(temp_dir, f"simplaw_folder_{run_id}.txt")

    # Usamos System.Windows.Forms.FolderBrowserDialog para máxima compatibilidad
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
        import subprocess
        # Ejecutar PowerShell usando ruta absoluta para evitar problemas de PATH
        pwsh_path = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
        subprocess.Popen(
            [pwsh_path, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Sta", "-Command", pwsh_cmd]
        )

        # Esperar a que se cree el archivo temporal (timeout de 180s)
        for _ in range(180):
            time.sleep(1)
            if os.path.exists(result_file):
                try:
                    # Usar utf-8-sig para manejar el BOM que agrega PowerShell
                    with open(result_file, "r", encoding="utf-8-sig") as f:
                        folder_path = f.read().strip()
                        
                        _safe_delete(result_file)
                        
                        if folder_path == 'CANCELLED' or not folder_path:
                            return {"path": "", "message": "Selección cancelada"}
                        
                        return {"path": folder_path}
                except Exception:
                    # Si falla la lectura (ej. archivo bloqueado), reintentamos en el sig ciclo
                    continue

        return {"path": "", "error": "timeout", "message": "Tiempo de espera agotado. Asegúrese de que el diálogo no esté oculto tras otras ventanas."}

    except Exception as e:
        _safe_delete(result_file)
        return {"path": "", "error": str(e)}


def _safe_delete(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
