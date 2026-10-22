/* Read-only compatibility check. Never reads accounts, conversations or profile secrets. */
const fs=require('node:fs'),path=require('node:path');
const appRoot=path.resolve(process.argv[2]||'D:/dsh');
const archive=[appRoot,path.join(appRoot,'resources/app.asar'),path.join(appRoot,'Contents/Resources/app.asar')].find(p=>p.endsWith('.asar')&&fs.existsSync(p));
let fd;
try{
  let read;
  if(archive){
  fd=fs.openSync(archive,'r');const prefix=Buffer.alloc(16);fs.readSync(fd,prefix,0,16,0);
  const headerBytes=prefix.readUInt32LE(12),dataOffset=8+prefix.readUInt32LE(4);
  if(headerBytes>64*1024*1024)throw Error('归档头过大或格式不支持。');
  const buf=Buffer.alloc(headerBytes);fs.readSync(fd,buf,0,buf.length,16);const header=JSON.parse(buf);
  read=function(file){let node=header;for(const key of file.split('/')){node=node.files?.[key];if(!node)throw Error('安装包缺少 '+file);}if(node.unpacked)throw Error('本检查不接受 unpacked 参考模块，请人工核对 '+file);const b=Buffer.alloc(node.size);fs.readSync(fd,b,0,b.length,dataOffset+Number(node.offset));return b.toString('utf8');};
  }else{
    const scope=[appRoot,path.dirname(appRoot),path.join(appRoot,'@deepseek-ai'),path.join(appRoot,'node_modules/@deepseek-ai'),path.join(appRoot,'lib/node_modules/@deepseek-ai')].find(p=>fs.existsSync(path.join(p,'dsh/package.json')));
    if(!scope)throw Error('未找到 app.asar 或 npm 安装的 @deepseek-ai/dsh。请传入应用目录、.app、app.asar 或 npm node_modules 目录。');
    read=file=>{const relative=file.replace(/^dsh\/node_modules\/@deepseek-ai\//,'');const candidates=[path.join(scope,relative),path.join(scope,'dsh/node_modules/@deepseek-ai',relative)];const target=candidates.find(p=>fs.existsSync(p));if(!target)throw Error('npm 安装缺少 '+relative);return fs.readFileSync(target,'utf8');};
  }
  const pkg=JSON.parse(read('dsh/node_modules/@deepseek-ai/dsh/package.json'));
  if(pkg.version!=='0.2.1-rc.2')throw Error('仅适配 0.2.1-rc.2，检测到 '+pkg.version);
  const layout=read('dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js');
  const conversation=read('dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js');
  const controller=read('dsh/node_modules/@deepseek-ai/dsh-api-session-controller/lib/client.js');
  const connection=read('dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.browser.js');
  const rightbar=read('dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar-right/lib/client.js');
  for(const [label,text,tokens] of [['layout',layout,['data-shell-overlay','shell.overlay','panelInfo','retainedBy.mainView']],['conversation',conversation,['main.conversation','conversation.header','data-phase']],['session',controller,['eventSource','binding(id)','async cancel()']],['connection',connection,['getSnapshot: () => state']]])for(const token of tokens)if(!text.includes(token))throw Error(label+' 布局或服务签名不匹配：'+token);
  for(const token of ['isExpanded()','toggleExpanded()','data-sidebar-right-expand'])if(!rightbar.includes(token))throw Error('右侧分栏服务签名不匹配：'+token);
  console.log('兼容性只读核查通过：DSH '+pkg.version+'，布局与服务签名匹配。');
  console.log('这不替代安装、真实任务与升级卸载的应用内验收。');
}catch(error){console.error('暂不建议安装：'+error.message);process.exitCode=1;}finally{if(fd!==undefined)fs.closeSync(fd);}
