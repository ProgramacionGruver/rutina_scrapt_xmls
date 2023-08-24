import puppeteer from 'puppeteer'
import randomUserAgent from 'random-useragent'

export const esperaEtiqueta = async (pagina, etiqueta) => {

    const elemento = await pagina.waitForSelector(etiqueta)

    if (elemento) {
        return elemento
    }
    throw new Error(`No se encontró el elemento ${etiqueta} después de ${tiempoMaximo} segundos.`);
}


export const buscarAspiranteOCC = async () => {

    // para trabajar en local
    const navegador = await puppeteer.launch({ headless: false })

    try {

        const cabezera = randomUserAgent.getRandom()
        
        const pagina = await navegador.newPage()
        await pagina.setUserAgent(cabezera)
        await pagina.setViewport({ width: 1220, height: 1080 })

        await pagina.goto('https://erp.biocheck.net/web/login', { timeout: 0 })

        //========CREAR LOGIN=================================================
        const loginInput = await pagina.waitForSelector('input[name="login"]');
        await loginInput.type('sgruver@gruver.mx')

        const passwordInput = await pagina.waitForSelector('input[name="password"]');
        await passwordInput.type('Monitor')
        
        
        // Seleccionar el campo de entrada del usuario y escribir el valor
        await pagina.click('.btn-block')


        //========INGRESAR INFORMACION EN BUSQUEDA DE TALENTO====================   
        await new Promise(resolve => setTimeout(resolve, 10000))
        await pagina.goto('https://erp.biocheck.net/web#menu_id=232&action=287&cids=116')
        await new Promise(resolve => setTimeout(resolve, 4000))
/*
       await pagina.evaluate(() => {
        const selectElement = document.querySelector('#o_field_input_12');
        selectElement.value = '"checks"';
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    })*/

    await pagina.evaluate(() => {
        const selectElement = document.querySelector('#o_field_input_18');
        selectElement.value = '"html"'; 
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    })

    const fechaInico = await pagina.waitForSelector('#o_field_input_13');
    await fechaInico.type('22/08/2023')

    const fechaFin = await pagina.waitForSelector('#o_field_input_19');
    await fechaFin.type('22/08/2023')

    await pagina.click('button[name="get_report"]')
    await new Promise(resolve => setTimeout(resolve, 8000))

    await pagina.click('.close')

    const iframe = await pagina.waitForSelector('.o_report_iframe');
    const frameHandle = await iframe.contentFrame();
    await frameHandle.waitForSelector('.table-condensed');
    
    // Obtener todas las filas de la tabla
    const tbody = await frameHandle.waitForSelector('tbody');

    // Obtener todas las filas del tbody
    const rows = await tbody.$$('tr');


    // Iterar a través de las filas
    const tableData = await Promise.all(rows.map(async row => {
        const cells = await row.$$('td');
        const cellContents = await Promise.all(cells.map(async cell => {
            const content = await cell.evaluate(node => node.textContent);
            return content.trim();
        }));
        return cellContents;
    }));

    console.log(tableData)


        await navegador.close()


    } catch (error) {
        await navegador.close();
        throw new Error(error.message)
    }
}