import ExcelJs from 'exceljs'
import { enviarCorreo } from './enviarCorreo.js'

export const generarExcel =  async ( array ) => {
    
    const woorkbook = new ExcelJs.Workbook()
    const nombreArchivo = 'Retardos.xlsx'
    const pagina = woorkbook.addWorksheet('Retardos')

    const columnas = [
        { header: 'No. de empleado', key: 'numero_empleado' },
        { header: 'Nombre del empleado    ', key: 'nombre' },
        { header: 'Departamento     ', key: 'departamento' },
        { header: 'Centro de trabajo', key: 'centroTrabajo' },
        { header: 'Fecha de registro', key: 'fecha' },
        { header: 'Turno del dia', key: 'turnoLunesViernes' },
        { header: 'check de entrada', key: 'entrada' },
    ]
    pagina.columns = columnas
    pagina.addRows( array )

    const indiceCentroTrabajo = columnas.findIndex(col => col.key === 'centroTrabajo')

    pagina.autoFilter = {
        from: {
          row: 1, 
          column: 1, 
        },
        to: {
          row: pagina.rowCount, 
          column: indiceCentroTrabajo + 1,  
        },
      }

    pagina.columns.forEach(column => {
        const headerLength = column.header.length + 1;
        column.width = headerLength
    })

    pagina.getCell('A1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('B1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('C1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('D1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('E1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('F1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('G1').fill  = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }

    woorkbook.xlsx.writeFile(nombreArchivo).then( e => console.log('Archivo de excel creado correctamente', nombreArchivo) )
    .catch( () => console.log('Error, al crear el archivo de excel') )

    const buffer = await woorkbook.xlsx.writeBuffer()
    enviarCorreo( buffer, nombreArchivo )
   //enviarCorreocc( buffer, nombreArchivo )

}