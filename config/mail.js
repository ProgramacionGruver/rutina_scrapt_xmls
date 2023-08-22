import { createTransport } from 'nodemailer'

export const transporter = createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: false,
    port: 587, 
    tls: {
    ciphers:'SSLv3'
    },
    auth: { user: 'sgruver@gruver.mx', pass: 'Gomsa01' }
})