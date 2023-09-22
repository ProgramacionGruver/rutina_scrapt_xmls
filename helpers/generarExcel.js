import ExcelJs from 'exceljs'

export const generarExcelRetardo = async (array, titulo) => {

    try {
        const woorkbook = new ExcelJs.Workbook()
        const nombreArchivo = `${titulo}.xlsx`
        const pagina = woorkbook.addWorksheet('Reporte Semanal')

        const columnas = [
            { header: 'No. de empleado', key: 'noEmpleado' },
            { header: 'Nombre del empleado    ', key: 'nombre' },
            { header: 'Departamento     ', key: 'departamento' },
            { header: 'Centro de trabajo', key: 'sucursal' },
            { header: 'Lunes', key: '0' },
            { header: 'Martes', key: '1' },
            { header: 'Miercoles', key: '2' },
            { header: 'Jueves', key: '3' },
            { header: 'Viernes', key: '4' },
            { header: 'Sabado', key: '5' },
            { header: 'Turno de Lunes a Viernes', key: 'turnoLunesViernes' },
            { header: 'Turno Sabado', key: 'turnoSabado' },
        ]
        pagina.columns = columnas
        
        pagina.addRows(array.map(e => ({
            ...e,
            0: e[0]?.check,
            1: e[1]?.check,
            2: e[2]?.check, // Miércoles
            3: e[3]?.check, // Jueves
            4: e[4]?.check, // Viernes
            5: e[5]?.check, // Sábado
        })))

        const indiceCentroTrabajo = columnas.findIndex(col => col.key === 'sucursal')

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

        pagina.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' } // Color gris claro
        }
        pagina.getCell('B1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' } // Color gris claro
        }
        pagina.getCell('C1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' } // Color gris claro
        }
        pagina.getCell('D1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' } // Color gris claro
        }

        const columnasLetra = ['E', 'F', 'G', 'H', 'I'];

        // Iterar a través de las letras de columna
        columnasLetra.forEach((letraColumna, indexColumna) => {
            // Iterar a través de las filas del array
            array.forEach((row, indexFila) => {
                const dia = row[indexColumna]
                const posicion = indexFila + 3 // Sumar 2 para coincidir con la numeración de fila

                if (Object.keys(dia).length === 0) {
                    pagina.getCell(`${letraColumna}${posicion}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'C10015' } // Color gris claro
                    }
                } else if (dia.retardo) {
                    pagina.getCell(`${letraColumna}${posicion}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'F2C037' } // Color gris claro
                    }
                }
            })
        })

        array.forEach((row, indexFila) => {
            const dia = row[5]
            const posicion = indexFila + 2 // Sumar 2 para coincidir con la numeración de fila

           if (dia?.retardo) {
                pagina.getCell(`J${posicion}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F2C037' } // Color gris claro
                }
            }
        })


        woorkbook.xlsx.writeFile(nombreArchivo).then(e => console.log('Archivo de excel creado correctamente', nombreArchivo))
            .catch(() => console.log('Error, al crear el archivo de excel'))

        const buffer = await woorkbook.xlsx.writeBuffer()
        //enviarCorreo( buffer, nombreArchivo )

        return {
            buffer,
            nombreArchivo
        }


    } catch (error) {
        console.log(error)
    }

}

export const generarExcelOmisiones = async (array) => {

    const woorkbook = new ExcelJs.Workbook()
    const nombreArchivo = 'Omisiones.xlsx'
    const pagina = woorkbook.addWorksheet('omisiones')

    const columnas = [
        { header: 'No. de empleado', key: 'numero_empleado' },
        { header: 'Nombre del empleado    ', key: 'nombre' },
        { header: 'Departamento     ', key: 'departamento' },
        { header: 'Centro de trabajo', key: 'centroTrabajo' },
        { header: 'Fecha de registro', key: 'fecha' },
    ]
    pagina.columns = columnas
    pagina.addRows(array)

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

    pagina.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('B1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('C1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('D1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }
    pagina.getCell('E1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' } // Color gris claro
    }

    woorkbook.xlsx.writeFile(nombreArchivo).then(e => console.log('Archivo de excel creado correctamente', nombreArchivo))
        .catch(() => console.log('Error, al crear el archivo de excel'))

    const buffer = await woorkbook.xlsx.writeBuffer()

    return {
        buffer,
        nombreArchivo
    }
}