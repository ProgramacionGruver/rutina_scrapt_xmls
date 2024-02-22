import { obtenerXMLS } from "../controllers/obtenerXmlsController.js"
import { enviarCorreoErrores } from "./correosErrores.js"

export const manejoRutinaXML = async ( intentosRestantes = 3 ) =>{

    if (intentosRestantes === 0) {
        enviarCorreoErrores('No se pudo obtener XMLS después de 3 intentos.')
        return
    }

    try {
        await obtenerXMLS()
    } catch (error) {
        manejoRutinaXML(intentosRestantes - 1)
    }
}