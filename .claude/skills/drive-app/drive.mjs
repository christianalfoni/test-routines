#!/usr/bin/env node
// Generic browser driver for the test-routines app.
// Usage: node drive.mjs <cmd> [args...]
// Commands:
//   navigate <url>              - go to URL
//   click <selector>            - click an element
//   read <selector>             - print element's innerText
//   assert <selector> <text>    - assert element text equals <text> (exits 1 on fail)
//   reload                      - reload the page
//   clear-storage               - clear localStorage and reload
//   run <cmd> [cmd ...]         - run multiple commands in sequence (sep by --)
//
// Example (test localStorage persistence):
//   node drive.mjs navigate http://localhost:5173 -- click .counter -- assert .counter "Count is 1" -- reload -- assert .counter "Count is 1"

// Playwright is installed globally; use the global path so the project doesn't need it as a dep.
const playwrightPath = '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(playwrightPath);

const args = process.argv.slice(2);

// Split args on '--' into command groups
const groups = [];
let cur = [];
for (const a of args) {
  if (a === '--') { if (cur.length) groups.push(cur); cur = []; }
  else cur.push(a);
}
if (cur.length) groups.push(cur);

if (!groups.length) {
  console.error('Usage: node drive.mjs <cmd> [args] [-- <cmd> [args] ...]');
  process.exit(1);
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

async function run(cmd, ...cmdArgs) {
  switch (cmd) {
    case 'navigate':
      await page.goto(cmdArgs[0], { waitUntil: 'networkidle' });
      console.log(`navigated to ${cmdArgs[0]}`);
      break;
    case 'click':
      await page.click(cmdArgs[0]);
      console.log(`clicked ${cmdArgs[0]}`);
      break;
    case 'read': {
      const text = await page.locator(cmdArgs[0]).innerText();
      console.log(text);
      break;
    }
    case 'assert': {
      const [sel, expected] = cmdArgs;
      const actual = (await page.locator(sel).innerText()).trim();
      if (actual !== expected) {
        console.error(`FAIL: ${sel} = "${actual}", expected "${expected}"`);
        await browser.close();
        process.exit(1);
      }
      console.log(`OK: ${sel} = "${actual}"`);
      break;
    }
    case 'reload':
      await page.reload({ waitUntil: 'networkidle' });
      console.log('reloaded');
      break;
    case 'clear-storage':
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
      console.log('cleared localStorage and reloaded');
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      await browser.close();
      process.exit(1);
  }
}

for (const group of groups) {
  await run(group[0], ...group.slice(1));
}

await browser.close();
