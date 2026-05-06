import os
import time
import uuid
import tempfile
from fastapi import APIRouter

router = APIRouter()


@router.get("/select-folder")
def select_folder():
    """
    Abre un diálogo nativo de selección de carpeta usando PowerShell + WinForms.
    Se lanza como un .bat independiente via os.startfile() (ShellExecute) para
    ejecutarse en la sesión interactiva del usuario.
    El resultado se comunica de vuelta mediante un archivo temporal.
    """
    temp_dir = tempfile.gettempdir()
    run_id = uuid.uuid4().hex[:8]
    result_file = os.path.join(temp_dir, f"simplaw_folder_{run_id}.txt")
    bat_path = os.path.join(temp_dir, f"simplaw_pick_{run_id}.bat")

    result_file_escaped = result_file.replace("\\", "\\\\")

    # .bat que ejecuta PowerShell con FolderBrowserDialog (ícono moderno de Windows)
    bat_content = (
        '@echo off\n'
        f'powershell -ExecutionPolicy Bypass -Command "'
        f'Add-Type -AssemblyName System.Windows.Forms; '
        f'$dlg = New-Object System.Windows.Forms.FolderBrowserDialog; '
        f"$dlg.Description = 'Selecciona la carpeta de documentos'; "
        f'$dlg.ShowNewFolderButton = $true; '
        f'$null = $dlg.ShowDialog(); '
        f"'{result_file_escaped}' | ForEach-Object {{ "
        f'[System.IO.File]::WriteAllText($_, $dlg.SelectedPath) '
        f'}}"\n'
    )

    try:
        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)

        os.startfile(bat_path)

        # Esperar a que el usuario elija (máx 2 minutos)
        for _ in range(120):
            time.sleep(1)
            if os.path.exists(result_file):
                with open(result_file, "r", encoding="utf-8") as f:
                    folder_path = f.read().strip()
                _safe_delete(result_file)
                _safe_delete(bat_path)
                return {"path": folder_path}

        _safe_delete(bat_path)
        return {"path": "", "error": "timeout"}

    except Exception as e:
        _safe_delete(bat_path)
        _safe_delete(result_file)
        return {"path": "", "error": str(e)}


def _safe_delete(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
