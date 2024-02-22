const fechaActual = new Date()

const mesNumero = fechaActual.getMonth()

const mesesEspanol = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export const anio = fechaActual.getFullYear()

export const mes = mesesEspanol[mesNumero]
