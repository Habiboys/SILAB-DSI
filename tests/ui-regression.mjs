import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const { outputFiles } = await build({
  stdin: { contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { DataGrid, ServerDataTable } from './resources/js/Components/DataTable.jsx';
    import Button from './resources/js/Components/Button.jsx';
    import Modal from './resources/js/Components/Modal.jsx';
    const root = createRoot(document.getElementById('root'));
    const rows = [{id:1,name:'Zulu',status:'aktif'},{id:2,name:'Alpha',status:'nonaktif'}];
    const columns = [{key:'name',header:'Nama'}];
    const filterColumns = [{key:'name',header:'Nama'},{key:'status',header:'Status',filter:{type:'select',options:[{value:'aktif',label:'Aktif'},{value:'nonaktif',label:'Nonaktif'}]}}];
    window.renderCase = (kind) => root.render(
      kind === 'grid' ? <DataGrid rows={rows} columns={columns}/> :
      kind === 'filter' ? <DataGrid rows={rows} columns={filterColumns}/> :
      kind === 'loading' ? <ServerDataTable paginator={{data:rows}} columns={columns} loading/> :
      kind === 'null' ? <DataGrid rows={null} columns={columns}/> :
      kind === 'disabled' ? <Button href='/blocked' disabled>Blocked</Button> :
      kind === 'submit' ? <form onSubmit={e=>{e.preventDefault();window.submitted=true}}><Button type='submit'>Save</Button></form> :
      <Modal show={kind === 'modal'} onClose={()=>window.renderCase('closed')}><div style={{height:2000,flexShrink:0}}>Long form</div><Button>Bottom</Button></Modal>
    );
  `, resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, jsx: 'automatic', format: 'iife',
});
const browser = await chromium.launch(process.env.UI_BROWSER_CHANNEL ? { channel: process.env.UI_BROWSER_CHANNEL } : {});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({content: outputFiles[0].text});
  const render = async kind => { await page.evaluate(kind => window.renderCase(kind), kind); await page.waitForTimeout(100); };
  await render('grid');
  await page.getByRole('button', {name:'Nama'}).click();
  assert.deepEqual(await page.locator('tbody tr').allTextContents(), ['Alpha','Zulu']);
  await page.getByRole('button', {name:'Nama'}).click();
  assert.deepEqual(await page.locator('tbody tr').allTextContents(), ['Zulu','Alpha']);
  await page.getByPlaceholder('Cari data...').fill('Alpha');
  assert.deepEqual(await page.locator('tbody tr').allTextContents(), ['Alpha']);
  await render('filter');
  await page.getByPlaceholder('Cari data...').fill('');
  assert.equal(await page.getByLabel('Status').count(), 1);
  await page.getByLabel('Status').selectOption('aktif');
  assert.deepEqual(await page.locator('tbody tr').allTextContents(), ['Zuluaktif']);
  assert.equal(await page.locator('thead button').count(), 2);
  assert.equal(await page.getByRole('button', {name:'Status'}).count(), 1);
  await render('loading');
  assert.equal(await page.locator('tbody tr').count(), 2);
  await render('null');
  assert.match(await page.locator('tbody').innerText(), /Belum ada data/);
  await render('disabled');
  assert.equal(await page.getByRole('button', {name:'Blocked'}).isDisabled(), true);
  await render('submit');
  await page.getByRole('button', {name:'Save'}).click();
  assert.equal(await page.evaluate(()=>window.submitted), true);
  await render('modal');
  assert.equal(await page.locator('dialog').evaluate(el=>el.open), true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  assert.equal(await page.locator('dialog').evaluate(el=>el.open), false);
  await render('modal');
  assert.equal(await page.locator('dialog').evaluate(el=>el.open), true);
  assert.deepEqual(errors, []);
  console.log('PASS: sorting, search, top filter, loading rows, null rows, disabled link, submit, Escape and modal reopen.');
} finally {
  await browser.close();
}
