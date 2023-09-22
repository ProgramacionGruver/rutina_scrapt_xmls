export const formarFechaBioCheck = ( cadena ) => {

const partes = cadena.split('/')
const dia = partes[0]
const mes = partes[1]
const año = partes[2]

// Crear una nueva cadena en el formato deseado (YYYY-MM-DD)
return `${año}-${mes}-${dia}`;
}