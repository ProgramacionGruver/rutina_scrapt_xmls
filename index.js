import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { manejoRutinaXML } from './helpers/manejoRutina.js'

const app = express()
const port = 4013

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))

app.use(cors())

//cron.schedule('0 8 * * *', () => {
    //manejoRutinaXML()
//})

app.listen(port, () => console.log(`El servidor está funcionando en el puerto ${port}`))

manejoRutinaXML()
