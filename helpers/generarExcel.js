import ExcelJs from 'exceljs'
import { enviarCorreo } from './enviarCorreo.js'

export const generarExcel =  async ( array ) => {
    
    const woorkbook = new ExcelJs.Workbook()
    const nombreArchivo = 'Retardos.xlsx'
    const pagina = woorkbook.addWorksheet('Retardos')

    const columnas = [
        { header: 'Numero de empleado', key: 'numero_empleado' },
        { header: 'Nombre', key: 'nombre' },
        { header: 'Departamento', key: 'departamento' },
        { header: 'Centro de trabajo', key: 'centroTrabajo' },
        { header: 'Fecha de registro', key: 'fecha' },
        { header: 'Turno de Lunes a Viernes', key: 'turnoLunesViernes' },
        { header: 'check de entrada', key: 'entrada' },
    ]
    pagina.columns = columnas
    pagina.addRows( array )

    woorkbook.xlsx.writeFile(nombreArchivo).then( e => console.log('Archivo de excel creado correctamente', nombreArchivo) )
    .catch( () => console.log('Error, al crear el archivo de excel') )

    const buffer = await woorkbook.xlsx.writeBuffer()
    enviarCorreo( buffer, nombreArchivo )
}