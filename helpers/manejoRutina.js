import { obtenerTurnoEmpleado } from "../controllers/turnosController.js"
import { enviarCorreoErrores } from "./correosErrores.js"

export const menejoRutinaObtenerTurnoEmpleado = async ( intentosRestantes = 3 ) =>{

    console.log(intentosRestantes)
    if (intentosRestantes === 0) {
        enviarCorreoErrores('No se pudo obtener los turnos después de 3 intentos.')
        return;
    }

    try {
      await obtenerTurnoEmpleado()
    } catch (error) {
        menejoRutinaObtenerTurnoEmpleado(intentosRestantes - 1)
    }
}