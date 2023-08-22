import axios from 'axios'

const api = axios.create({ baseURL: 'https://api.tp.yuju.io' })

export { api }
