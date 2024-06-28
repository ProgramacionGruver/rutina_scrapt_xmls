import { createTransport } from 'nodemailer'

export const transporter = createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: false,
    port: 587, 
    tls: {
    ciphers:'SSLv3'
    },
    auth: { user: 's.gruver@gruver.mx', pass: 'Soporte1' }
})