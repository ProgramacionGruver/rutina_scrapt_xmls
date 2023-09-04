import { transporter } from '../config/mail.js'

export const enviarCorreo = async ( buffer, nombreArchivo ) => {

    const mailOptions = {
        from: 'sgruver@gruver.mx',
        to: ['RRHH@gruver.mx'] ,
        bcc:['javier.cano@gruver.mx', 'jpedroza@gruver.mx'],
        subject: 'Retardos',
        html: 'Notificacion de retardos de sucursales',
        attachments: [
            {
                filename: nombreArchivo,
                content: buffer,
                contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        ],
    }
    await transporter.sendMail(mailOptions, ( error, info ) => {
        if ( error ) {
            return console.log( error )
        }
        console.log(`Mensaje enviado ${ info.response }`)
    })

}
