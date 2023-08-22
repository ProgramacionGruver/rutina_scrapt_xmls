import Sequelize from 'sequelize'
import dotenv from 'dotenv'

dotenv.config( { path: '.env' } )

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,{
    host: process.env.DB_HOST,
    port: 1433,
    dialect: 'mssql',
    ssl: true, 
    //maximo de conexiones
    pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
    requestTimeout: 30000 // 30 segundos
    },
    operatorAliases: false
})

export default db