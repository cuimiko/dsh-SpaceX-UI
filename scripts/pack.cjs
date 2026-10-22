/* Reproducible npm-compatible tarball using the system tar utility; no registry access. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const base=path.resolve(__dirname,'..');
const version=JSON.parse(fs.readFileSync(path.join(base,'package.json'),'utf8')).version;
const out=path.resolve(base,'..','dsh-control-room-'+version+'.tgz');
const stage=fs.mkdtempSync(path.join(process.env.DSH_CONTROL_ROOM_PACK_DIR||require('node:os').tmpdir(),'dsh-control-room-pack-'));
const pkg=path.join(stage,'package');fs.mkdirSync(pkg);
for(const p of ['package.json','cordis.patch.yml','lib','locale','README.md','LICENSE','NOTICE.md','CHANGELOG.md','docs','build-info.json'])fs.cpSync(path.join(base,p),path.join(pkg,p),{recursive:true});
const result=cp.spawnSync('tar',['-czf',out,'-C',stage,'package'],{stdio:'inherit'});
if(result.status!==0)throw new Error('打包失败，暂存目录：'+stage);
// No recursive cleanup; temporary staging is retained for inspection.
console.log(out);
