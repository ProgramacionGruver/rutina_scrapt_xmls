import axios from 'axios'

const api = axios.create({ baseURL: 'https://backend.gruver.com.mx/sistemas/api' })

export { api }
