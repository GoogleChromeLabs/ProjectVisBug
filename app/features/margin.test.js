import test from 'ava'
import puppeteer from 'puppeteer'

const marginMode = async p =>
  await p.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="margin"]').click()`)

const getActiveTool = async p =>
  await p.$eval('tool-pallete', el => el.activeTool)

test.beforeEach(async t => {
  t.context.browser  = await puppeteer.launch()
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
  await marginMode(t.context.page)
})

test('Can Be Activated', async t => {
  t.is(await getActiveTool(t.context.page), 'margin')
  t.pass()
})

test('Can Be Deactivated', async t => {
  t.is(await getActiveTool(t.context.page), 'margin')
  await t.context.page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="padding"]').click()`)
  t.is(await getActiveTool(t.context.page), 'padding')

  t.pass()
})

test('Adds margin to side', async t => {
  await t.context.page.evaluateHandle(`document.querySelector('[intro] h2').click()`)
  t.is(await t.context.page.$eval('[intro] h2', el => el.style.marginTop), '')

  await t.context.page.keyboard.press('ArrowUp')

  t.is(await t.context.page.$eval('[intro] h2', el => el.style.marginTop), '1px')

  t.pass()
})

test('Remove margin from side', async t => {
  await t.context.page.evaluateHandle(`document.querySelector('[intro] h2').click()`)
  t.is(await t.context.page.$eval('[intro] h2', el => el.style.marginTop), '')

  await t.context.page.keyboard.press('ArrowUp', { delay: 10 })
  await t.context.page.keyboard.press('ArrowUp', { delay: 10 })

  t.is(await t.context.page.$eval('[intro] h2', el => el.style.marginTop), '2px')

  await t.context.page.keyboard.down('AltLeft')
  await t.context.page.keyboard.press('ArrowUp')
  await t.context.page.keyboard.up('AltLeft')

  t.is(await t.context.page.$eval('[intro] h2', el => el.style.marginTop), '1px')

  t.pass()
})

test.afterEach(async t => {
  await t.context.page.close()
  await t.context.browser.close()
})
