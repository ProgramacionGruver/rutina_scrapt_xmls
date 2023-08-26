import express from 'express'
import cors from 'cors'
import cron from 'node-cron'

import db from './config/db.js'

import { obtenerTurnoEmpleado } from './controllers/turnosController.js'

import { menejoRutinaObtenerTurnoEmpleado } from './helpers/manejoRutina.js'
import { obtenerResultadosMensuales } from './controllers/turnosMensualesController.js'

const app = express()
const port = 4013

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))
// conexion a la bd
db.authenticate()
db.sync()

//permisos de cors
app.use(cors())

cron.schedule('30 10 * * 1-6', () => {
    menejoRutinaObtenerTurnoEmpleado()
})


cron.schedule('0 0 1 * *', () => {
    obtenerResultadosMensuales()
})

// Routing
//app.use('/ecommers', producto)

app.listen(port, () => console.log(`El servidor está funcionando en el puerto ${port}`))


