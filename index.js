import express from 'express'
import cors from 'cors'

import { buscarAspiranteOCC } from './helpers/bootScrappingEtiqueta.js'

const app = express()
const port = 4014

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))
// conexion a la bd

//permisos de cors
app.use(cors())

buscarAspiranteOCC()

// Routing
//app.use('/ecommers', producto)

app.listen(port, () => console.log(`El servidor está funcionando en el puerto ${port}`))


