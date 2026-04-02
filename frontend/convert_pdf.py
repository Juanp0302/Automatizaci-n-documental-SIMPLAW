import markdown
import asyncio
import os
from playwright.async_api import async_playwright

async def generate():
    md_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'MANUAL_DE_USUARIO.md'))
    html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'temp.html'))
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'MANUAL_DE_USUARIO.pdf'))

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    # Render markdown to HTML
    html = markdown.markdown(md_text, extensions=['extra'])
    
    # Replace relative image paths so local html can find them
    html = html.replace('src="./assets/', 'src="assets/')
    
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }}
        h1 {{ color: #932E20; text-align: center; font-size: 2.5em; border-bottom: 2px solid #F2E9D8; padding-bottom: 10px; }}
        h2 {{ color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }}
        h3 {{ color: #34495e; }}
        img {{ max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px 0; border: 1px solid #ddd; }}
        .note {{ background-color: #f8f9fa; border-left: 4px solid #932E20; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .page-break {{ page-break-before: always; }}
        </style>
    </head>
    <body style="margin: 40px;">
        {html}
    </body>
    </html>
    """
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Ensure we use an absolute file URI
        file_uri = f'file:///{html_path.replace("\\", "/")}'
        print(f'Navegando a {file_uri}')
        await page.goto(file_uri, wait_until='networkidle')
        await page.pdf(path=pdf_path, format='A4', print_background=True, margin={'top': '20mm', 'bottom': '20mm', 'left': '20mm', 'right': '20mm'})
        await browser.close()
        
    print("PDF Generado exitosamente en:", pdf_path)
    
    # Cleanup temp html
    if os.path.exists(html_path):
        os.remove(html_path)

if __name__ == '__main__':
    asyncio.run(generate())
