/** Local visual QA. Optional dev-only dependency: playwright.
 * Start `npm run dev`, then `node tools/preview_assets_v4.mjs`.
 * Uses a fresh headless browser, never the user's browser/profile.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const out='assets/v4/preview';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try {
  for(const [label,width,height] of [['desktop',1440,960],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(`${label}: ${e.message}`));
    await page.goto('http://127.0.0.1:5273');
    await page.locator('.welcomeParty canvas').first().waitFor();
    await page.screenshot({path:`${out}/${label}-welcome.png`,fullPage:true});
    await page.locator('.itemPick[data-n="4"]').click();
    await page.locator('.tribePortrait canvas').first().waitFor();
    await page.screenshot({path:`${out}/${label}-draft.png`,fullPage:true});
    await page.getByRole('button',{name:'Chọn ngẫu nhiên'}).click();
    await page.locator('#overlay.hidden').waitFor({state:'attached'});
    await page.screenshot({path:`${out}/${label}-board.png`,fullPage:true});
    const metrics=await page.evaluate(()=>{
      const r=document.getElementById('board').getBoundingClientRect();
      return {width:innerWidth,bodyWidth:document.documentElement.scrollWidth,board:{x:r.x,y:r.y,w:r.width,h:r.height},portraits:document.querySelectorAll('.piecePortrait canvas').length};
    });
    if(metrics.bodyWidth>width)throw new Error(`${label}: horizontal overflow ${metrics.bodyWidth}`);
    if(metrics.board.w>width||metrics.board.w<100)throw new Error(`${label}: bad board sizing`);
    if(Math.abs(metrics.board.w-metrics.board.h)>1)throw new Error(`${label}: distorted board`);
    // Smoke the real pointer mapping: force 6, select a pen piece, move to r0.
    await page.locator('#btnDev').click();
    await page.locator('#devBar button[data-n="6"]').click();
    await page.locator('.pieceRow[data-pc="0"]').click();
    const r=await page.locator('#board').boundingBox();
    await page.mouse.click(r.x+r.width*(3.5/19),r.y+r.height*(2.5/19));
    const trace=await page.locator('body').getAttribute('data-dbg');
    const state=JSON.parse(trace);
    if(state.pcs[0].z!=='track')throw new Error(`${label}: canvas input failed after resize`);
    await page.screenshot({path:`${out}/${label}-move.png`,fullPage:true});
    console.log(label,JSON.stringify({metrics,state}));
    await page.close();
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('VISUAL_SMOKE_OK: desktop/mobile, no overflow, no page errors, pointer mapping passed.');
} finally {await browser.close();}
