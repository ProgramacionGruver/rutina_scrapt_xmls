import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import { mes, anio } from '../helpers/constantes.js'
import { enviarCorreoErrores, enviarCorreo } from '../helpers/correosErrores.js'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { parseString } from 'xml2js'
import { promisify } from 'util'

const readdirAsync = promisify(fs.readdir)
const unlinkAsync = promisify(fs.unlink)
const readFileAsync = promisify(fs.readFile)

// Directorio donde están los archivos .zip descargados
const directorioDescargas = 'C:\\Users\\Sistemas\\Downloads'

// Directorio destino donde se moverán TODOS los archivos descomprimidos
const directorioIntelisis = 'E:\\AppsDAGOM\\eConta\\Doctos\\No Validados\\Egresos\\Gastos'

// Directorio destino dode se descomprime inicialmente
const directorioDestino = 'C:\\Users\\Sistemas\\Desktop\\destino'

// Directorio donde se guardaran los movimientos diarios
const directorioDiario = 'C:\\Users\\Sistemas\\Desktop\\diario'

// Directorio donde se veran los archivos Historicos
const directorioHistorico = 'C:\\Users\\Sistemas\\Desktop\\xmlsHistorico'

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
        const client = await pagina.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: directorioDescargas, 
        })
    
        //--Abrir pagina--//
        seccionError = 'Eror al abrir la pagina.'
        await pagina.goto('https://app.ezaudita.com/login?utm_source=ez_ini_app_web&utm_medium=ez_ini_app_web&_gl=1*191ey7e*_gcl_au*MTQ4NTgwNTA4Ni4xNjk1NjgzMjA2*_ga*MTAxMTU1MDQyMC4xNjk1NDg4MzEz*_ga_HF49133KM2*MTcwMzIwNTMxMC40MC4xLjE3MDMyMDU4NzAuMC4wLjA.*_ga_MZX27J61HQ*MTcwMzIwNTMxMC4zOS4xLjE3MDMyMDU4NzAuMC4wLjA.&_ga=2.155773887.54681959.1703196259-1011550420.1695488313', { timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 5000))

        //--Login--//
        seccionError = 'Eror en el login.'
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
        // Llamada a la función para la sección de Recibidos
        await seleccionarRecibidos(seccionError, client, pagina, `https://app.ezaudita.com/cfdi-received?cid=8fae19e4-0d64-4a52-bf6a-68e08f4e9a2e&type=ingress&period=${anio}-${mes}`)

        // Llamada a la función para la sección de Egreso
        await seleccionarRecibidos(seccionError, client, pagina, 'https://app.ezaudita.com/cfdi-received?cid=8fae19e4-0d64-4a52-bf6a-68e08f4e9a2e&type=egress')

        // Llamada a la función para la sección de Pago
        await seleccionarRecibidos(seccionError, client, pagina, 'https://app.ezaudita.com/cfdi-received?cid=8fae19e4-0d64-4a52-bf6a-68e08f4e9a2e&type=payment')

        //========Manejo de archivos=============================================== 
        //--Limpiar carpeta destino--//
        seccionError = 'Eror al limpiar carpeta destino'
        await limpiarCarpetaDestino()

         // Descromprimir destino
         seccionError = 'Eror al descomprimir destino'
         await descomprimirZip()

        // Leer y eliminar duplicados
        seccionError = 'Eror al leer y eliminar duplicados' 
        await leerYEliminarDuplicados()

        // Descromprimir y eliminar .zip historico
        seccionError = 'Eror al descomprimir historico'
        await descomprimirHistorico()
        
        //--Eliminar xmls de nomina--//
        seccionError = 'Eror al eliminar xml de nomina'
        await eliminarXmlsDeNomina()

        //--Mover xmls a carpeta de intelisis--//
        seccionError = 'Eror al mover archivos al directorio de intelisis'
        await moverArchivosADirectorioIntelisis()

        //--Mover xmls a carpeta de diario--//
        seccionError = 'Eror al mover archivos al directorio de diario'
        await moverArchivosADirectorioDiario()

        // Contar archivos en directorioHistorico
        const archivosEnHistorico = await readdirAsync(directorioHistorico)
        // Contar archivos en directorioDestino
        const archivosEnDestino = await readdirAsync(directorioDestino)

        await enviarCorreo(`Proceso de XMLS completado con exito. Archivos mes: ${archivosEnHistorico.length} y Archivos diario: ${archivosEnDestino.length}`)
        
        await navegador.close()       
    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
    }
}

const seleccionarRecibidos = async (seccionError, client, pagina, url) => {
   seccionError = 'Error al seleccionar recibidos.'
    await pagina.goto(url)
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
    await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000))

      //--Seleccionar a exportaciones XMLS--//
      seccionError = 'Eror al seleccionar exportar XMLS.'
      await pagina.click('#mi_exports')
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Configurar la ruta de descarga
      await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: directorioDescargas, 
      })
      
      //--Descargar XMLS--//
      seccionError = 'Eror al descargar XMLS.'
      await pagina.click('.ant-table-tbody > tr:nth-child(2) .ant-btn-link')
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000))
}

const limpiarCarpetaDestino = async () => {
    const archivosDestino = await readdirAsync(directorioDestino)
    await Promise.all(archivosDestino.map(async archivo => {
        await unlinkAsync(path.join(directorioDestino, archivo))
    }))
}

const descomprimirZip = async () => {
    const archivos = await readdirAsync(directorioDescargas)
    await Promise.all(archivos.map(async archivo => {
        if (path.extname(archivo) === '.zip') {
            const rutaZip = path.join(directorioDescargas, archivo)
            const zip = new AdmZip(rutaZip)
            zip.extractAllTo(directorioDestino, true)
        }
    }))
}

const leerYEliminarDuplicados = async () => {
    const archivosHistorico = await readdirAsync(directorioHistorico)
    const archivoDestino = await readdirAsync(directorioDestino)

    const archivosExistentes = [...archivosHistorico]
    const archivosDuplicados = archivoDestino.filter(archivo => archivosExistentes.includes(archivo))

    await Promise.all(archivosDuplicados.map(async archivo => {
        await unlinkAsync(path.join(directorioDestino, archivo))
    }))
}

const descomprimirHistorico = async () => {
    const archivos = await readdirAsync(directorioDescargas)
    await Promise.all(archivos.map(async archivo => {
        if (path.extname(archivo) === '.zip') {
            const rutaZip = path.join(directorioDescargas, archivo)
            const zip = new AdmZip(rutaZip)
            zip.extractAllTo(directorioHistorico, true)
            await unlinkAsync(rutaZip)
        }
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

const moverArchivosADirectorioIntelisis = async () => {
    try {
        const archivos = await readdirAsync(directorioDestino);
        for (let archivo of archivos) {
            const rutaArchivoOriginal = path.join(directorioDestino, archivo);
            const rutaArchivoDestino = path.join(directorioIntelisis, archivo);
            await fs.promises.copyFile(rutaArchivoOriginal, rutaArchivoDestino);
        }
    } catch (err) {
        console.error(`Error durante el proceso de mover archivos: ${err}`)
    }
}

const moverArchivosADirectorioDiario = async () => {
    try {
        const archivos = await readdirAsync(directorioDestino);
        for (let archivo of archivos) {
            const rutaArchivoOriginal = path.join(directorioDestino, archivo);
            const rutaArchivoDiario = path.join(directorioDiario, archivo);
            await fs.promises.copyFile(rutaArchivoOriginal, rutaArchivoDiario);
        }
    } catch (err) {
        console.error(`Error durante el proceso de mover archivos: ${err}`)
    }
}