const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),pkg=JSON.parse(read('package.json'));
assert.equal(pkg.dsh.bundle.patch,'./cordis.patch.yml');assert.equal(pkg.dsh.client.platform,'web');assert.equal(pkg.peerDependencies['@deepseek-ai/dsh'],'0.2.1-rc.2');
const client=read('lib/client.js');new vm.Script(client);assert(!client.includes('__ROOM__'));assert(!client.includes('__FONT__'));assert(!client.includes("new URL('assets/D-DIN.woff2'"));
for(const file of ['src/client.js','src/theme.css','src/layout.cjs','src/composer.cjs','lib/client.js'])assert(!/BynINW|Dc7zOa|pI_x6G|wSkVaW/.test(read(file)),'Build-generated class name in '+file);
let loaded;const scope={window:{__ModuleLoader__:{load:x=>loaded=x}},globalThis:{}};vm.runInNewContext(client,scope);assert.equal(loaded.id,pkg.name);
const entry=loaded.factory(name=>{assert.equal(name,'react');return {};});assert.equal(typeof entry.apply,'function');assert(entry.inject.includes('sessions'));assert(entry.inject.includes('connection'));assert(entry.inject.includes('slots'));
assert(entry.inject.includes('sidebarRight'));assert(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-sidebar-right'));
const info=JSON.parse(read('build-info.json'));for(const[p,hash]of Object.entries(info.files))assert.equal(crypto.createHash('sha256').update(read(p)).digest('hex'),hash,p);
for(const p of ['README.md','LICENSE','NOTICE.md','docs/INSTALL.md','docs/INTEGRATION.md','docs/VALIDATION.md','docs/OFL-1.1.txt'])assert(fs.statSync(path.join(root,p)).size>0,p);
assert.equal((client.match(/data:image\/png;base64,/g)||[]).length,3);
console.log('Verified: bundle metadata, native loader entry, exported services, embedded assets, hashes and documentation.');

for(const lang of ['zh','en']){const locale=JSON.parse(read('locale/'+lang+'.json'));assert.equal(typeof locale.meta?.title,'string');assert.equal(typeof locale.meta?.description,'string');assert(!('$name' in locale));}
