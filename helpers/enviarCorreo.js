import { transporter } from '../config/mail.js'

export const enviarCorreo = async ( objRetardo, objFalta ) => {

    const mailOptions = {
        from: 'sgruver@gruver.mx',
        to: ['RRHH@gruver.mx'] ,
        bcc:['javier.cano@gruver.mx', 'jpedroza@gruver.mx'],
        subject: 'Retardos y omisiones',
        html: 'Notificacion de retardos y omisiones de checks de sucursales.',
        attachments: [
            {
                filename: objRetardo.nombreArchivo,
                content: objRetardo.buffer,
                contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            {
                filename: objFalta.nombreArchivo,
                content: objFalta.buffer,
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
