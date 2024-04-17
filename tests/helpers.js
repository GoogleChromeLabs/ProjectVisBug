import puppeteer from 'puppeteer'

export const setupPptrTab = async t => {
  t.context.browser  = await puppeteer.launch({
    // headless: false,
    args: ['--no-sandbox']
  })
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
  await t.context.page.evaluateHandle(`document.body.setAttribute('testing', true)`)
  await t.context.page.waitForSelector('vis-bug')
}

export const teardownPptrTab = async ({context:{ page, browser }}) => {
  await page.close()
}

export const changeMode = async ({page, tool}) =>
  await page.evaluateHandle(`
    var mouseUpEvent = document.createEvent("MouseEvents");
    mouseUpEvent.initEvent("mouseup", true, true);
    document.querySelector('vis-bug').$shadow.querySelector('li[data-tool=${tool}]').dispatchEvent(mouseUpEvent);
  `)

export const getActiveTool = async page =>
  await page.$eval('vis-bug', el =>
    el.activeTool)

export const pptrMetaKey = async page => {
  let isMac = await page.evaluate(_ => window.navigator.platform.includes('Mac'))
  return isMac ? "Meta" : "Control"
}