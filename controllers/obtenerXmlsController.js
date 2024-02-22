import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import { mes, anio } from '../helpers/constantes.js'
import { enviarCorreoErrores } from '../helpers/correosErrores.js'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

export const obtenerXMLS = async (req, res) => {
    
    //------NAVEGADOR PRUEBAS
    const navegador = await puppeteer.launch({ headless: false })
  
    //------NAVEGADOR PRODUCTIVO
    //const navegador = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser' })
    
    // Directorio donde están los archivos .zip descargados
     const directorioDescargas = 'C:\\Users\\amagdaleno\\Downloads'
    
     // Directorio destino donde se moverán los archivos descomprimidos
     const directorioDestino = 'C:\\Users\\amagdaleno\\Desktop\\archivos'

    try {
        //========Crear la web==============================================
        let seccionError = 'Error al crear la web'
        const cabezera = randomUserAgent.getRandom()
        const pagina = await navegador.newPage()
        await pagina.setUserAgent(cabezera)
        await pagina.setViewport({ width: 1220, height: 1080 })

        //========Abrir la pagina==============================================
        seccionError = 'Eror al abrir la pagina.'
        await pagina.goto('https://ezaudita.com/', { timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 5000))
        await pagina.click('a.ast-custom-button-link')

        //========CREAR LOGIN=================================================
        //--Login--//
        seccionError = 'Eror en el login.'
        await new Promise(resolve => setTimeout(resolve, 5000))
        const loginInput = await pagina.waitForSelector('input[id="login-email-input"]')
        await loginInput.type('Jorge.lopez@gruver.mx')
        //--Password--//
        const passwordInput = await pagina.waitForSelector('input[id="login-password-input"]')
        await passwordInput.type('Soporte9@')
        //--btn IniciarSesion--//
        await pagina.click('button[id="login-submit-button"]')
        await new Promise(resolve => setTimeout(resolve, 10000))

        //========PAGINA PRINCIPAL=============================================  
        //--Seleccionar empresa--//
        seccionError = 'Eror al seleccionar empresa.'
        await pagina.click('tr[data-row-key="165431"]')
        await new Promise(resolve => setTimeout(resolve, 15000))

        //--Seleccionar Recibidos--//
        seccionError = 'Eror al seleccionar recibidos.'
        await pagina.goto(`https://app.ezaudita.com/cfdi-received?cid=8fae19e4-0d64-4a52-bf6a-68e08f4e9a2e&type=ingress&period=${anio}-${mes}`)
        await new Promise(resolve => setTimeout(resolve, 14000))
        
        //--Generar XMLS--//
        seccionError = 'Error generar XMLS.'
        await pagina.hover('#export-button');
        await pagina.waitForSelector('.ant-dropdown-menu-item', { visible: true });
        const [xmlButton] = await pagina.$x("//li[contains(@class, 'ant-dropdown-menu-item') and contains(., 'XML')]");
        if (xmlButton) {
            await xmlButton.click();
        }
        await new Promise(resolve => setTimeout(resolve, 10000))

        //--Seleccionar a exportaciones XMLS--//
        seccionError = 'Eror al seleccionar exportar XMLS.'
        await pagina.click('#mi_exports')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        //--Descargar XMLS--//
        seccionError = 'Eror al seleccionar exportar XMLS.'
        await pagina.click('.ant-table-tbody > tr:nth-child(2) .ant-btn-link')
        await new Promise(resolve => setTimeout(resolve, 25000))
    
        //========Manejo de archivos=============================================  
        //--Descomprimir zip--//
        seccionError = 'Eror al descomprimir zip'
        fs.readdir(directorioDescargas, (err, archivos) => {
            if (err) {
                seccionError = 'Error al leer el directorio de descargas:'
                return
            }
        
        archivos.forEach(archivo => {
                if (path.extname(archivo) === '.zip') {
                    // Construir la ruta completa del archivo .zip
                    const rutaZip = path.join(directorioDescargas, archivo)
        
                    // Crear una instancia de AdmZip
                    const zip = new AdmZip(rutaZip)
        
                    // Extraer el contenido del .zip al directorio destino
                    zip.extractAllTo(directorioDestino, true)
        
                    console.log(`El archivo ${archivo} ha sido descomprimido y movido a ${directorioDestino}`)
        
                    // Eliminar el archivo .zip después de descomprimir
                    fs.unlink(rutaZip, (err) => {
                        if (err) {
                            seccionError = `Error al eliminar el archivo ${rutaZip}:`
                            return
                        }
        
                        console.log(`El archivo ${rutaZip} ha sido eliminado.`)
                    })
                }
            })
        })
        await navegador.close()       
    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
    }
}