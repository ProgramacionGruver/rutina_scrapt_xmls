import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import dayjs from 'dayjs'

import { enviarCorreoErrores } from '../helpers/correosErrores.js'
import Checks from '../models/Checks.js'

export const obtenerResultadosMensuales = async (req, res) => {
//    const navegador = await puppeteer.launch({ headless: false })
    const navegador = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser' })
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
        await new Promise(resolve => setTimeout(resolve, 15000))
        /**Seleccionar reportes */
        await pagina.goto('https://erp.biocheck.net/web#menu_id=232&action=287&cids=116')
        await new Promise(resolve => setTimeout(resolve, 4000))
        seccionError = 'LLenado biocheck reporte error.'
        /**seleccionar checks select */
        await pagina.evaluate(() => {
            const selectElement = document.querySelector('#o_field_input_12');
            selectElement.value = '"checks"';
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        })
        /**seleccionar HTML select */
        await pagina.evaluate(() => {
            const selectElement = document.querySelector('#o_field_input_18')
            selectElement.value = '"html"'
            selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        })
        
        /**seleccionar fecha inicio select */
        const fechaInico = await pagina.waitForSelector('#o_field_input_13')
        const fechaInicioFormat = dayjs().subtract(1, 'month').startOf('month').format("DD/MM/YYYY")
        await fechaInico.type(fechaInicioFormat)
        /**seleccionar fecha inicio fin */
        const fechaFin = await pagina.waitForSelector('#o_field_input_19')
        const fechaFinalFormat = dayjs().subtract(1, 'month').endOf('month').format("DD/MM/YYYY")
        await fechaFin.type(fechaFinalFormat)
        /**obtener reporte*/
        await pagina.click('button[name="get_report"]')
        await new Promise(resolve => setTimeout(resolve, 25000))
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
            const data = await Promise.all(celdas.map(async cell => {
                const content = await cell.evaluate(node => node.textContent)
                return content.trim()
            }))

            return {
                numero_empleado: data[0],
                fechaRegistro: data[2],
                horaRegistro: data[3]
            }
        }))
        await navegador.close()
        tableData.pop()

        await Checks.bulkCreate(tableData)
        console.log(tableData)

    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
    }
}