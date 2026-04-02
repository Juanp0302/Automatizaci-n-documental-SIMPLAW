$src = "C:\Users\Usuario\.gemini\antigravity\brain\4df4c15a-c91f-4a70-840e-b6c920226430"
$dst = "C:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\docs\assets"

New-Item -ItemType Directory -Force -Path $dst | Out-Null

Copy-Item "$src\01_login_1774479549299.png" "$dst\01_login.png" -Force
Copy-Item "$src\02_dashboard_1774479737572.png" "$dst\02_dashboard.png" -Force
Copy-Item "$src\03_plantillas_1774479754974.png" "$dst\03_plantillas.png" -Force
Copy-Item "$src\04_nuevo_documento_1774479767306.png" "$dst\04_nuevo_documento.png" -Force
Copy-Item "$src\05_documentos_1774479783784.png" "$dst\05_documentos.png" -Force
Copy-Item "$src\06_estadisticas_1774479796708.png" "$dst\06_estadisticas.png" -Force

Write-Host "Capturas copiadas exitosamente."
