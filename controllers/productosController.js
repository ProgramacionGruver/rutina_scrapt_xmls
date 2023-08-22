import db from "../config/db.js"
import sequelize from "sequelize"

import { api } from "../boot/axiosYuju.js"
import { obtenerProductosQuery } from "../boot/consultasSQL.js"

import { PRODUCTO } from "../constant/objetoRespuesta.js"

import { enviarCorreoErrores } from '../helpers/correosErrores.js'
import { configuracion } from "../helpers/apiConfiguracion.js"

export const obtenerProductos = async (req, res) => {
    try {
        //obtener productos existentes en yuju y comparar
        const productosYuju = await db.query(obtenerProductosQuery, { type: sequelize.QueryTypes.SELECT })
        const arregloNuevo = productosYuju.slice(0, 10);


        for (const autoParte of arregloNuevo) {
            const formatearObjetoYuju = {
                ...PRODUCTO,
                sku_simple: autoParte.codigo_parte.trim(),
                sku: autoParte.codigo_parte.trim(),
                name: autoParte.descripcion,
                description: autoParte.descripcion,
                stock: autoParte.stck1,
                brand: "100511,Vehículos y Repuestos",
                id_category: 526,
                shipping: 0,
                dimensions_unit: "cm",
                shipping_width: 0,
                shipping_depth: 0,
                shipping_height: 0,
                weight_unit: "kg",
                weight: 0,
                price: autoParte.costo_promedio
            }


            try {
                const { data } = await api.post('/products', formatearObjetoYuju, configuracion)

                if (data.errors.length !== 0) {
                    console.log('hay que actualizar')
                }

            } catch (error) {
                enviarCorreoErrores('Error en la peticion con la api de yuju.(' + error.message + ')')
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Captura de error no controlados
    } catch (error) {
        enviarCorreoErrores('Error en el controlador General' + error.message + ')')
    }
}
