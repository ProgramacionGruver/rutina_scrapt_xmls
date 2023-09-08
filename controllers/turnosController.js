import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import dayjs from 'dayjs'
import { parse, isBefore } from 'date-fns'
import fs from 'fs'

import { api } from '../boot/axios.js'

import { enviarCorreoErrores } from '../helpers/correosErrores.js'
import { generarExcel } from '../helpers/generarExcel.js'

export const obtenerTurnoEmpleado = async (req, res) => {
    const navegador = await puppeteer.launch({ headless: false })
    //const navegador = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser' })
    let seccionError = 'Creacion de web'
    try {
        const cabezera = randomUserAgent.getRandom()
        const pagina = await navegador.newPage()

        await pagina.setUserAgent(cabezera)
        await pagina.setViewport({ width: 1220, height: 1080 })

        await pagina.goto('https://erp.biocheck.net/web/login', { timeout: 0 })

        //========CREAR LOGIN=================================================
        seccionError = 'Login error.'
        /**Login*/
        const loginInput = await pagina.waitForSelector('input[name="login"]')
        await loginInput.type('sgruver@gruver.mx')
        /**Password*/
        const passwordInput = await pagina.waitForSelector('input[name="password"]')
        await passwordInput.type('Monitor')
        /**btn IniciarSesion*/
        await pagina.click('.btn-block')

        //========PAGINA PRINCIPAL BIOCHECK====================   
        seccionError = 'Principal biocheck error.'
        await new Promise(resolve => setTimeout(resolve, 10000))
        /**Seleccionar reportes */
        await pagina.goto('https://erp.biocheck.net/web#menu_id=232&action=287&cids=116')
        await new Promise(resolve => setTimeout(resolve, 10000))
        seccionError = 'LLenado biocheck reporte error.'
        /**seleccionar HTML select */
        await pagina.evaluate(() => {
            const selectElement = document.querySelector('#o_field_input_18')
            selectElement.value = '"html"'
            selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        })
        const fechaActual = dayjs().format("DD/MM/YYYY")
        /**seleccionar fecha inicio select */
        const fechaInico = await pagina.waitForSelector('#o_field_input_13')
        await fechaInico.type(fechaActual)
        /**seleccionar fecha inicio fin */
        const fechaFin = await pagina.waitForSelector('#o_field_input_19')
        await fechaFin.type(fechaActual)
        /**obtener reporte*/
        await pagina.click('button[name="get_report"]')
        await new Promise(resolve => setTimeout(resolve, 15000))
        /**cerrar advertencia*/
        await pagina.click('.close')

        //========OBTENER TABLA Y OBTENER DATA====================   
        seccionError = 'obtener data table error.'
        const iframe = await pagina.waitForSelector('.o_report_iframe')
        const frameHandle = await iframe.contentFrame()
        await frameHandle.waitForSelector('.table-condensed')

        // Obtener todas las filas de la tabla
        const tbody = await frameHandle.waitForSelector('tbody')

        // Obtener todas las filas del tbody
        const rows = await tbody.$$('tr')

        // Iterar a través de las filas
        seccionError = 'Destructuring error.'
        const tableData = await Promise.all(rows.map(async (row, index) => {
            const celdas = await row.$$('td')
            const dataCelda = await Promise.all(celdas.map(async cell => {
                const content = await cell.evaluate(node => node.textContent)
                return content.trim()
            }))

            if ( dataCelda[4] ) {

                let detalleEntrada = {}
                
                const diaSemana = new Date()

                if (diaSemana.getDay() === 6) {
    
                    const detalleUsuario = {
                        numero_empleado: dataCelda[0],
                        turnoSabados: dataCelda[4].replace('TURNO ', '') 
                    }
    
                    await api.put('/usuarios', detalleUsuario )
                    const { data } = await api.post('/noEmpleado', { noEmpleado: dataCelda[0] } )

                    const primeraHora = parse(data.turnoSabados.split(" - ")[0], 'HH:mm', new Date())
                    const segundaHora = parse(dataCelda[7], 'HH:mm', new Date())

                    detalleEntrada = {
                        numero_empleado: data.numero_empleado,
                        nombre: data.nombre,
                        departamento: data.departamento,
                        centroTrabajo: data.siglasCentroTrabajo,
                        fecha: fechaActual,
                        turnoLunesViernes:data.turnoSabados,
                        turnoEntrada:data.turnoSabados.split(" - ")[0],
                        turnoSalida:data.turnoSabados.split(" - ")[1],
                        entrada: dataCelda[7],
                        retardo: isBefore(primeraHora, segundaHora)
                    }
                } else {

                    const detalleUsuario = {
                        numero_empleado: dataCelda[0],
                        turnoLunesViernes: dataCelda[4].replace('TURNO ', '') 
                    }
    
                    await api.put('/usuarios', detalleUsuario )
                    const { data } = await api.post('/noEmpleado', { noEmpleado: dataCelda[0] } )
                    
                    const primeraHora = parse(data.turnoLunesViernes.split(" - ")[0], 'HH:mm', new Date())
                    const segundaHora = parse(dataCelda[7], 'HH:mm', new Date())

                    detalleEntrada = {
                        numero_empleado: data.numero_empleado,
                        nombre: data.nombre,
                        departamento: data.departamento,
                        centroTrabajo: data.siglasCentroTrabajo,
                        fecha: fechaActual,
                        turnoLunesViernes:data.turnoLunesViernes,
                        turnoEntrada:data.turnoLunesViernes.split(" - ")[0],
                        turnoSalida:data.turnoLunesViernes.split(" - ")[1],
                        entrada: dataCelda[7],
                        retardo: isBefore(primeraHora, segundaHora)
                    }
                }

                console.log(detalleEntrada)

                return detalleEntrada
            }
        }))

        tableData.pop()
        await navegador.close()

        
        const logFilePath = 'log.txt';
        const logText = JSON.stringify(tableData, null, 2); 
            
        // Escribir en el archivo de registro
        fs.appendFileSync(logFilePath, logText + '\n', 'utf-8');

        const usuariosRetardos = tableData.filter(usuario => usuario && usuario.retardo);
        generarExcel(usuariosRetardos)

    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
        throw new Error()
    }
}