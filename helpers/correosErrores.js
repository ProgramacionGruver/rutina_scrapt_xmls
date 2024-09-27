import { transporter } from '../config/mail.js'

export const enviarCorreoErrores = async ( tipoError ) => {

    const mailOptions = {
        from: 's.gruver@gruver.mx',
        to: ['monitor_rutinas@gruver.mx'],
        subject: 'Error en bot XMLS',
        html: tipoError,
    }
    await transporter.sendMail(mailOptions, ( error, info ) => {
        if ( error ) {
            return console.log( error )
        }
        console.log(`Mensaje enviado ${ info.response }`)
    })

}

export const enviarCorreo = async ( tipoError ) => {

    const mailOptions = {
        from: 's.gruver@gruver.mx',
        to: ['amagdaleno@gruver.mx','jcano@gruver.mx', 'srivas@gruver.mx'],
        subject: 'Rutina bot XMLS',
        html: tipoError,
    }
    await transporter.sendMail(mailOptions, ( error, info ) => {
        if ( error ) {
            return console.log( error )
        }
        console.log(`Mensaje enviado ${ info.response }`)
    })

}
