import test from 'ava'
import puppeteer from 'puppeteer'

const chrome = {}

test.before(async () => {
  chrome.browser  = await puppeteer.launch()
  chrome.page     = await chrome.browser.newPage()
  
  await chrome.page.goto('http://localhost:3000')
})

test('Activated', async t => {
  t.not(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'margin')

  const marginBtn = await chrome.page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="margin"]').click()`)
  
  t.is(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'margin')
  t.pass()
})

test.after.always(async () => {
  await chrome.page.close()
  await chrome.browser.close()
})