import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'
import dayjs from 'dayjs'
import { parse, isBefore } from 'date-fns'

import { api } from '../boot/axios.js'

import { enviarCorreo } from '../helpers/enviarCorreo.js'
import { generarExcelOmisiones, generarExcelRetardo } from '../helpers/generarExcel.js'
import { formarFechaBioCheck } from '../helpers/formatearFecha.js'

export const obtenerTurnoEmpleado = async (req, res) => {
    //const navegador = await puppeteer.launch({ headless: false })
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
        const fechaInputInicio = dayjs().subtract(6, 'day').format("DD/MM/YYYY")
        const fechaInputFin = dayjs().subtract(1, 'day').format("DD/MM/YYYY")

        /**seleccionar fecha inicio select */
        const fechaInico = await pagina.waitForSelector('#o_field_input_13')
        await fechaInico.type(fechaInputInicio)
        /**seleccionar fecha inicio fin */
        const fechaFin = await pagina.waitForSelector('#o_field_input_19')
        await fechaFin.type(fechaInputFin)
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
        rows.pop()

        // Iterar a través de las filas
        seccionError = 'Destructuring error.'
        const tableData = []
        const noLotes = 350

        const { data } = await api.get('/usuarios')


        for (let i = 0;i < rows.length;i += noLotes) {
            const lotesRows = rows.slice(i, i + noLotes)

            const batchData = await Promise.all(lotesRows.map(async (row, index) => {
                const celdas = await row.$$('td')
                const dataCelda = await Promise.all(celdas.map(async (cell) => {
                    const content = await cell.evaluate((node) => node.textContent)
                    return content.trim()
                }))

                const infoUsuarioSistema = data.find( usuarioSistema => usuarioSistema.numero_empleado == dataCelda[0] )

                return {
                    numero_empleado: dataCelda[0],
                    turno: dataCelda[4].replace('TURNO ', ''),
                    horaRegistro: dataCelda[7],
                    fechaRegistro: dataCelda[3],
                    nombre: infoUsuarioSistema.nombre,
                    departamento: infoUsuarioSistema.departamento,
                    centroTrabajo: infoUsuarioSistema.siglasCentroTrabajo,
                    turnoLunesViernes: infoUsuarioSistema.turnoLunesViernes,
                    turnoSabado: infoUsuarioSistema.turnoSabados,
                    departamento: infoUsuarioSistema.departamento,
                }
            }))
            tableData.push(...batchData)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }


    const groupedData = []

    // Usar map en lugar de forEach
    tableData.forEach(item => {
    const noEmpleado = item.numero_empleado
    const fecha = item.fechaRegistro
    const diaSemana = new Date(formarFechaBioCheck(item.fechaRegistro)).getDay()
    
    const primeraHora = parse(item.turno.split(" - ")[0], 'HH:mm', new Date())
    const segundaHora = parse(item.horaRegistro, 'HH:mm', new Date())

      // Buscar el registro correspondiente en el arreglo
      let empleadoExiste = groupedData.find(record => record.noEmpleado === noEmpleado);

      // Si no existe, crear un nuevo registro
      if (!empleadoExiste) {
        empleadoExiste = {
            noEmpleado: noEmpleado,
            nombre: item.nombre,
            departamento: item.departamento,
            sucursal: item.centroTrabajo,
            turnoLunesViernes: item.turnoLunesViernes,
            turnoSabado: item.turnoSabado,
            0: {}, // Lunes
            1: {}, // Martes
            2: {}, // Miércoles
            3: {}, // Jueves
            4: {}, // Viernes
            5: {}, // Sábado
        }
        groupedData.push(empleadoExiste);
      }
  
      // Asignar la checada al día correspondiente
          empleadoExiste[diaSemana] = {
            fecha: fecha,
            turno: item.turno,
            check: item.horaRegistro,
            retardo: isBefore(primeraHora, segundaHora)
        }
    })

        await navegador.close()

      /*  const usuariosOmisiones = data.filter( usuarioSistemas => 
            {   
                const usuarioCheck = tableData.find( usuarioBio => usuarioBio.numero_empleado == usuarioSistemas.numero_empleado )

                if(!usuarioCheck && usuarioSistemas.estatus){
                    
                    return {
                        numero_empleado: e.numero_empleado,
                    nombre: e.nombre,
                    departamento: e.departamento,
                    centroTrabajo: e.siglasCentroTrabajo,
                    fecha: fechaActual,
                    }
                }

            } )*/

        const bufferRetardo = await generarExcelRetardo(groupedData, `Reporte semanal del ${fechaInputInicio.replace(/\//g, '-')} al ${fechaInputFin.replace(/\//g, '-')}` )
       // const bufferOmisiones = await generarExcelOmisiones(usuariosOmisiones)

        enviarCorreo(bufferRetardo)

    } catch (error) {
        await navegador.close()
        enviarCorreoErrores(`[${seccionError}] / [${error}]`)
        throw new Error()
    }
}