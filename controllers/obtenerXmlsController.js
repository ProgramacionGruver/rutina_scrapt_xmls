import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import { mes, anio } from '../helpers/constantes.js'
import { enviarCorreoErrores } from '../helpers/correosErrores.js'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { parseString } from 'xml2js'
import { promisify } from 'util'

const readdirAsync = promisify(fs.readdir)
const unlinkAsync = promisify(fs.unlink)
const readFileAsync = promisify(fs.readFile)

// Directorio donde están los archivos .zip descargados
const directorioDescargas = 'C:\\Users\\amagdaleno\\Downloads'
    
// Directorio destino donde se moverán TODOS los archivos descomprimidos
const directorioDestino = 'C:\\Users\\amagdaleno\\Desktop\\archivos'

// Directorio donde se veran los archivos VALIDOS (INTELISIS)
const directorioValidos = 'C:\\Users\\amagdaleno\\Desktop\\validos'

// Directorio donde se veran los archivos INVALIDOS (INTELISIS)
const directorioInvalidos = 'C:\\Users\\amagdaleno\\Desktop\\invalidos'


export const obtenerXMLS = async () => {

    //------NAVEGADOR PRUEBAS
    //const navegador = await puppeteer.launch({ headless: false })

    //------NAVEGADOR PRODUCTIVO
    const navegador = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']})
    
    try {
        //========BOOT WEB==============================================
        //--Crear la web--//
        let seccionError = 'Error al crear la web'
      
        const cabezera = randomUserAgent.getRandom()
        const pagina = await navegador.newPage()
        await pagina.setUserAgent(cabezera)
        await pagina.setViewport({ width: 1220, height: 1080 })
        
        //--Abrir pagina--//
        seccionError = 'Eror al abrir la pagina.'
        await pagina.goto('https://ezaudita.com/', { timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 5000))
        await pagina.click('a.ast-custom-button-link')

        //--Login--//
        seccionError = 'Eror en el login.'
        await new Promise(resolve => setTimeout(resolve, 5000))
        const loginInput = await pagina.waitForSelector('input[id="login-email-input"]')
        await loginInput.type('anahi.guzman@gruver.mx')

        //--Password--//
        const passwordInput = await pagina.waitForSelector('input[id="login-password-input"]')
        await passwordInput.type('Aguzman8*')

        //--btn IniciarSesion--//
        await pagina.click('button[id="login-submit-button"]')
        await new Promise(resolve => setTimeout(resolve, 10000))

        //--Seleccionar empresa--//
        seccionError = 'Eror al seleccionar empresa.'
        await pagina.click('tr[data-row-key="182590"]')
        await new Promise(resolve => setTimeout(resolve, 15000))
 
        //--Seleccionar Recibidos--//
        seccionError = 'Eror al seleccionar recibidos.'
        await pagina.goto(`https://app.ezaudita.com/cfdi-received?cid=8fae19e4-0d64-4a52-bf6a-68e08f4e9a2e&type=ingress&period=${anio}-${mes}`)
        await new Promise(resolve => setTimeout(resolve, 14000))
        
        //--Generar XMLS--//
        seccionError = 'Error generar XMLS.'
        await pagina.hover('#export-button');
        await pagina.waitForSelector('.ant-dropdown-menu-item', { visible: true, timeout: 5000 })

        // Verifica si el elemento es interactuable usando page.waitForFunction
        await pagina.waitForFunction(() => {
            const xmlButton = document.querySelector(".ant-dropdown-menu-item")
            return xmlButton && xmlButton.getBoundingClientRect().height > 0 && xmlButton.getBoundingClientRect().width > 0
        })

        // Encuentra el botón XML
        const [xmlButton] = await pagina.$x("//li[contains(@class, 'ant-dropdown-menu-item') and contains(., 'XML')]")

        if (xmlButton) {
            // Usa para hacer clic en el botón si los métodos no funcionan
            await pagina.evaluate(button => button.click(), xmlButton)
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

        //========Manejo de archivos=============================================== 
        //--Limpiar carpeta destino--//
        seccionError = 'Eror al limpiar carpeta destino'
        await limpiarCarpetaDestino()

        // Descromprimir y eliminar .zip
        seccionError = 'Eror al descomprimir y eliminar .zip'
        await descomprimirYEliminarZip()

        // Leer y eliminar duplicados desde validos e invalidos de INTELISIS
        seccionError = 'Eror al leer carpetas de INTELISIS'
        await leerYEliminarDuplicados()
        
        //--Eliminar xmls de nomina--//
        await eliminarXmlsDeNomina()
        
        console.log("Proceso de XMLS completado con exito.")
        await navegador.close()       
    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
    }
}

const limpiarCarpetaDestino = async () => {
    const archivosDestino = await readdirAsync(directorioDestino)
    await Promise.all(archivosDestino.map(async archivo => {
        await unlinkAsync(path.join(directorioDestino, archivo))
    }))
}

const descomprimirYEliminarZip = async () => {
    const archivos = await readdirAsync(directorioDescargas)
    await Promise.all(archivos.map(async archivo => {
        if (path.extname(archivo) === '.zip') {
            const rutaZip = path.join(directorioDescargas, archivo)
            const zip = new AdmZip(rutaZip)
            zip.extractAllTo(directorioDestino, true)
            await unlinkAsync(rutaZip);
        }
    }))
}

const leerYEliminarDuplicados = async () => {
    const archivosValidos = await readdirAsync(directorioValidos)
    const archivosInvalidos = await readdirAsync(directorioInvalidos)
    const archivoDestino = await readdirAsync(directorioDestino)

    const archivosExistentes = [...archivosValidos, ...archivosInvalidos]
    const archivosDuplicados = archivoDestino.filter(archivo => archivosExistentes.includes(archivo))

    await Promise.all(archivosDuplicados.map(async archivo => {
        await unlinkAsync(path.join(directorioDestino, archivo))
    }))
}

const eliminarXmlsDeNomina = async () => {
    try {
        const archivos = await readdirAsync(directorioDestino)
        for (let archivo of archivos) {
            if (path.extname(archivo) === '.xml') {
                const rutaArchivo = path.join(directorioDestino, archivo)
                const data = await readFileAsync(rutaArchivo, 'utf8')

                await new Promise((resolve, reject) => {
                    parseString(data, async (err, result) => {
                        if (err) {
                            console.error(`Error al parsear el archivo XML: ${err}`)
                            reject(err)
                            return
                        }

                        const tipoDeComprobante = result['cfdi:Comprobante'].$.TipoDeComprobante
                        if (tipoDeComprobante === 'N') {
                            await unlinkAsync(rutaArchivo)
                            console.log(`Archivo eliminado: ${archivo}`)
                        }
                        resolve()
                    })
                })
            }
        }
    } catch (err) {
        console.error(`Error durante el proceso: ${err}`)
    }
}