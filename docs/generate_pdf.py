import os
import asyncio
from playwright.async_api import async_playwright
import markdown

async def main():
    md_path = 'MANUAL_DE_USUARIO.md'
    html_path = 'MANUAL_DE_USUARIO.html'
    pdf_path = 'MANUAL_DE_USUARIO.pdf'

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    html_content = markdown.markdown(md_text, extensions=['extra', 'tables'])
    
    # Wrap in html body
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Manual de Usuario</title>
        <style>
@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600&display=swap');
body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }}
h1 {{ color: #932E20; text-align: center; font-size: 2.5em; border-bottom: 2px solid #F2E9D8; padding-bottom: 10px; }}
h2 {{ color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }}
h3 {{ color: #34495e; }}
img {{ max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px 0; border: 1px solid #ddd; display: block; margin-left: auto; margin-right: auto; }}
.note {{ background-color: #f8f9fa; border-left: 4px solid #932E20; padding: 15px; margin: 20px 0; border-radius: 4px; }}
.page-break {{ page-break-before: always; }}
pre {{ background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }}
code {{ font-family: Consolas, monospace; background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    abs_html_path = os.path.abspath(html_path)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        print("Cargando HTML para convertir...")
        await page.goto(f"file:///{abs_html_path}", wait_until="networkidle")
        print("Generando PDF...")
        await page.pdf(path=pdf_path, format="A4", margin={"top": "20mm", "bottom": "20mm", "left": "20mm", "right": "20mm"}, print_background=True)
        await browser.close()
        os.remove(html_path)
        print("PDF generado exitosamente.")

if __name__ == '__main__':
    asyncio.run(main())
