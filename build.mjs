import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
let html=readFileSync(dir+'template.html','utf8');
for(const [slot,file] of [['MODEL','model.js'],['CHUCK','chuck-profile.js'],['SCENE','scene.js'],['APP','app.js']])html=html.replace(`<!-- ${slot} -->`,`<script>\n${readFileSync(dir+file,'utf8')}\n</script>`);
writeFileSync(dir+'Photomask-Cleaner.html',html);
console.log('Built standalone Photomask-Cleaner.html');
