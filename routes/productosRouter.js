import express from 'express'
import { obtenerProductos } from '../controllers/productosController.js'

const router = express.Router()


//rutas admin
router.get('/obtenerProductos', obtenerProductos)

export default router