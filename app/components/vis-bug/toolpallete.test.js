import test from 'ava'
import puppeteer from 'puppeteer'

import { getActiveTool } from '../../../tests/helpers'

test.beforeEach(async t => {
  t.context.browser  = await puppeteer.launch()
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
})

test('Activated', async t => {
  const { page } = t.context
  t.is(await getActiveTool(page), 'guides')
})

test.afterEach(async ({context:{ page, browser }}) => {
  await page.close()
  await browser.close()
})