import asyncio
from playwright.async_api import async_playwright
import os

# Ensure the screenshots directory exists
OUTPUT_DIR = "manual_assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def capture_screenshots():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigating to Login...")
        await page.goto("http://localhost:3000/login")
        await page.screenshot(path=f"{OUTPUT_DIR}/01_login.png")

        # Login flow (assuming standard admin/admin or test user)
        # Check if we are already logged in or need to log in
        # If /login redirects to /, we are good. If not, we fill the form.
        if "/login" in page.url:
            print("Logging in...")
            await page.fill('input[type="email"]', "admin@example.com") # Adjust if needed
            await page.fill('input[type="password"]', "admin")      # Adjust if needed
            await page.click('button[type="submit"]')
            await page.wait_for_url("http://localhost:3000/", timeout=5000)
        
        print("Capturing Dashboard...")
        await page.wait_for_timeout(1000) # Wait for animations
        await page.screenshot(path=f"{OUTPUT_DIR}/02_dashboard.png")

        print("Capturing Templates...")
        await page.goto("http://localhost:3000/templates")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{OUTPUT_DIR}/03_templates.png")

        print("Capturing New Document...")
        await page.goto("http://localhost:3000/new-document")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{OUTPUT_DIR}/04_new_document.png")

        # Try to capture a template config page if a template exists
        # This part is best effort
        try:
             # Go back to templates to find an ID? Or just guess ID 1
             await page.goto("http://localhost:3000/templates/1/config")
             await page.wait_for_timeout(1000)
             if "Configurar" in await page.title() or await page.query_selector('.config-header'):
                print("Capturing Template Config...")
                await page.screenshot(path=f"{OUTPUT_DIR}/05_template_config.png")
        except Exception as e:
            print(f"Skipping Template Config screenshot: {e}")

        await browser.close()
        print("Screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_screenshots())
