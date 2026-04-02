const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'assets');
const BASE_URL = 'http://localhost:3000';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    console.log('Lanzando navegador...');
    const browser = await puppeteer.launch({ 
        headless: 'new',
        defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('Navegando al Login...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ASSETS_DIR, '01_login.png') });
        console.log('Captura 1: Login');

        // Hacer login (asumimos admin@example.com / admin123 
        // o si no funciona probamos otro, pero llenemos los campos)
        console.log('Iniciando sesión...');
        await page.type('input[type="email"]', 'admin@example.com');
        await page.type('input[type="password"]', 'admin123'); // Adjust to your actual test user
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await delay(1000); // Wait for animations
        await page.screenshot({ path: path.join(ASSETS_DIR, '02_dashboard.png') });
        console.log('Captura 2: Dashboard');

        console.log('Navegando a Plantillas...');
        await page.goto(`${BASE_URL}/templates`, { waitUntil: 'networkidle0' });
        await delay(1000);
        await page.screenshot({ path: path.join(ASSETS_DIR, '03_plantillas.png') });
        console.log('Captura 3: Plantillas');

        console.log('Navegando a Nuevo Documento...');
        await page.goto(`${BASE_URL}/documents/new`, { waitUntil: 'networkidle0' });
        await delay(1000);
        await page.screenshot({ path: path.join(ASSETS_DIR, '04_nuevo_documento.png') });
        console.log('Captura 4: Nuevo Documento');
        
        console.log('Navegando a Documentos...');
        await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle0' });
        await delay(1000);
        await page.screenshot({ path: path.join(ASSETS_DIR, '05_documentos.png') });
        console.log('Captura 5: Documentos generados');

        console.log('Navegando a Estadísticas...');
        await page.goto(`${BASE_URL}/statistics`, { waitUntil: 'networkidle0' });
        await delay(1500); // Load stats
        await page.screenshot({ path: path.join(ASSETS_DIR, '06_estadisticas.png') });
        console.log('Captura 6: Estadísticas');

    } catch (e) {
        console.error('Error durante la navegación:', e);
    } finally {
        await browser.close();
        console.log('Navegador cerrado.');
    }
}

capture();
