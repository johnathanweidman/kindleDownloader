const { chromium } = require('playwright');
const {user, pass} = require('./settings.json');
// import chromium from 'playwright';


(async()=>{

    const browser = await chromium.launch({headless: false})
    const context = await browser.newContext()
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    let currentPage = 1;
    let url = `https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc${currentPage}`
    let processedCount = 0

    page.on('console', (msg) => {
        console.log(msg);
      });

      page.on('pageerror', exception => {
        console.log(`Uncaught exception: "${exception}"`);
      });

      const sleep = ms => new Promise(r => setTimeout(r, ms));

      await page.goto(`https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc`);
      await page.fill('input[id=ap_email]', user);
      await page.fill('input[id=ap_password]', pass);
      await page.getByRole('button', { name: 'Sign in' }).click();
      const lastPage = await page.locator('.page-item').last().textContent()
    //   await page.goto(`https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc`);
      
    const grabBooksFromPage = async () => {
         url =  `https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc/?pageNumber=${currentPage}`
        await page.goto(url);

        await page.getByText('More actions').first().focus();

        const allCards = await page.locator('.ListItem-module_row__3orql').all();
    
        for(const card of allCards){
            console.log(currentPage, processedCount);
                const action = card.locator('text=More actions')
                const title = card.locator('[id^=content-title-]');
                const id = await title.getAttribute('id');
                const identifier = id.split('title-')[1];
                processedCount++
                const downloadButton = page.locator(`#DOWNLOAD_AND_TRANSFER_ACTION_${identifier}`).getByText('Download & transfer via USB')

                await action.focus().catch(console.log);
                await action.click().catch(console.log);


                if(!downloadButton){
                    console.log('not button')
                    continue
                
                }

                await downloadButton.focus().catch(console.log);
                await downloadButton.click().catch(console.log);

                
                // action.getByText('Download & transfer via USB');
                await page.locator(`#download_and_transfer_list_${identifier}_0`).focus().catch(console.log);
                await page.locator(`#download_and_transfer_list_${identifier}_0`).click().catch(console.log);
                

                const downloadPromise = page.waitForEvent('download').catch(async(e)=>{
                    console.log('download error', e);
                    console.log(page.url())
                    await page.goto(url);
                });
                const confirm = page.locator(`#DOWNLOAD_AND_TRANSFER_ACTION_${identifier}_CONFIRM`).getByText('Download')
                await confirm.focus().catch(console.log);
                await confirm.click().catch(console.log);
                const download = await downloadPromise;
                // Wait for the download process to complete and save the downloaded file somewhere.
                if(download?.saveAs){
                    await download.saveAs(`${__dirname}/downloads/${download.suggestedFilename()}`).catch(console.log());;
                    await page.locator('#notification-close').click().catch(console.log);
                }

            
            // const downloadPromise = page.waitForEvent('download');
            // await page.locator('#DOWNLOAD_AND_TRANSFER_ACTION_B0D12PL21G_CONFIRM').getByText('Download').click();
            // const download = await downloadPromise;
            // await page.locator('#notification-close').click();
        }
    }

    while(currentPage <= lastPage){
        await grabBooksFromPage(currentPage);
        currentPage++
    }
})()