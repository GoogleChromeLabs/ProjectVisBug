import puppeteer from 'puppeteer'

const setupPptrTab = async t => {
  t.context.browser  = await puppeteer.launch()
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
}

export const teardownPptrTab = async ({context:{ page, browser }}) => {
  await page.close()
}

export const changeMode = async ({page, tool}) =>
  await page.evaluateHandle(`document.querySelector('vis-bug').$shadow.querySelector('li[data-tool=${tool}]').click()`)

export const getActiveTool = async page =>
  await page.$eval('vis-bug', el =>
    el.activeTool)
