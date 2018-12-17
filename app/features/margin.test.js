import test from 'ava'
import puppeteer from 'puppeteer'

const chrome = {}

const marginMode = async () =>
  await chrome.page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="margin"]').click()`)

test.before(async () => {
  chrome.browser  = await puppeteer.launch()
  chrome.page     = await chrome.browser.newPage()

  await chrome.page.goto('http://localhost:3000')
  await marginMode()
})

test('Can Be Activated', async t => {
  t.is(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'margin')
  t.pass()
})

test('Can Be Deactivated', async t => {
  t.is(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'margin')
  await chrome.page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="padding"]').click()`)
  t.is(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'padding')
  
  t.pass()
})

test('Adds margin to side', async t => {
  await chrome.page.evaluateHandle(`document.querySelector('[intro] h2').click()`)
  t.is(await chrome.page.$eval('[intro] h2', el => el.style.marginTop), '')
  
  await chrome.page.keyboard.down('ArrowUp')
  t.is(await chrome.page.$eval('[intro] h2', el => el.style.marginTop), '1px')

  t.pass()
})

test.after.always(async () => {
  await chrome.page.close()
  await chrome.browser.close()
})