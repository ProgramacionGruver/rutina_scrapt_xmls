import { obtenerProductos } from "../controllers/productosController.js"

export const sondeoBD = async () => {

    try {

        await obtenerProductos()
        setImmediate(async () => await sondeoBD())

    } catch (error) {
        console.log(error)
    }
}

