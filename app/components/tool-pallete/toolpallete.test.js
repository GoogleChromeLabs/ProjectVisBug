import test from 'ava'
import puppeteer from 'puppeteer'

const chrome = {}

test.before(async () => {
  chrome.browser  = await puppeteer.launch()
  chrome.page     = await chrome.browser.newPage()

  await chrome.page.goto('http://localhost:3000')
})

test('Activated', async t => {
  t.is(await chrome.page.$eval('tool-pallete', el => el.activeTool), 'guides')
})

test.after.always(async () => {
  await chrome.page.close()
  await chrome.browser.close()
})