import asyncio
import os
from playwright.async_api import async_playwright

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'assets')
BASE_URL = 'http://localhost:3000'

async def capture():
    os.makedirs(ASSETS_DIR, exist_ok=True)

    async with async_playwright() as p:
        print('Lanzando navegador Chromium...')
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        try:
            print('Navegando al Login...')
            await page.goto(f'{BASE_URL}/login', wait_until='networkidle')
            await page.screenshot(path=os.path.join(ASSETS_DIR, '01_login.png'))
            print('Captura 1: Login')

            print('Iniciando sesión...')
            await page.fill('input[type="email"]', 'screenshot@example.com')
            await page.fill('input[type="password"]', 'screentest')
            await page.click('button[type="submit"]')
            
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000) # Wait for animations
            await page.screenshot(path=os.path.join(ASSETS_DIR, '02_dashboard.png'))
            print('Captura 2: Dashboard')

            print('Navegando a Plantillas...')
            await page.goto(f'{BASE_URL}/templates', wait_until='networkidle')
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(ASSETS_DIR, '03_plantillas.png'))
            print('Captura 3: Plantillas')

            print('Navegando a Nuevo Documento...')
            await page.goto(f'{BASE_URL}/documents/new', wait_until='networkidle')
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(ASSETS_DIR, '04_nuevo_documento.png'))
            print('Captura 4: Nuevo Documento')
            
            print('Navegando a Documentos...')
            await page.goto(f'{BASE_URL}/documents', wait_until='networkidle')
            await page.wait_for_timeout(1500)
            await page.screenshot(path=os.path.join(ASSETS_DIR, '05_documentos.png'))
            print('Captura 5: Documentos generados')

            print('Navegando a Estadísticas...')
            await page.goto(f'{BASE_URL}/statistics', wait_until='networkidle')
            await page.wait_for_timeout(1500)
            await page.screenshot(path=os.path.join(ASSETS_DIR, '06_estadisticas.png'))
            print('Captura 6: Estadísticas')

        except Exception as e:
            print(f'Error durante la navegación: {e}')
        finally:
            await browser.close()
            print('Navegador cerrado.')

if __name__ == '__main__':
    asyncio.run(capture())
