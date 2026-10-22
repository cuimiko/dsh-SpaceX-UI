/* Loaded by DSH's browser module loader; React and services come from the host. */
const inject=['slots','sessions','workspaces','connection','layout','sidebarRight'];
function apply(ctx){
  installHud();
  const React=require('react');
  function Layer(){
    const ref=React.useRef(null);
    React.useEffect(()=>mountScene(ctx,ref.current),[]);
    return React.createElement('div',{ref,className:'dsh-cr-layer',hidden:true,'aria-label':'任务遥测 HUD'});
  }
  ctx.effect(()=>{
    const previous=document.documentElement.getAttribute('data-dsh-control-room');
    const style=document.createElement('style');style.dataset.pluginCss='dsh-control-room';style.textContent=THEME_CSS;
    document.head.append(style);document.documentElement.setAttribute('data-dsh-control-room','0.1.9');
    return ()=>{style.remove();if(previous===null)document.documentElement.removeAttribute('data-dsh-control-room');else document.documentElement.setAttribute('data-dsh-control-room',previous);};
  },'control-room: scoped theme');
  ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'dsh-control-room',order:50},Layer));
}
function mountScene(ctx,root){
  if(!root)return ()=>{};
  const adapter=window.DshControlRoomAdapter;
  const layoutDom=window.DshControlRoomLayout,markers=layoutDom.createMarkers();
  const make=(tag,cls,parent=root)=>{const el=document.createElement(tag);if(cls)el.className=cls;parent.append(el);return el;};
  const left=make('img','dsh-cr-person left');left.src=LEFT_PORTRAIT;left.alt='';left.setAttribute('aria-hidden','true');left.draggable=false;
  const right=make('img','dsh-cr-person right');right.src=RIGHT_PORTRAIT;right.alt='';right.setAttribute('aria-hidden','true');right.draggable=false;
  const desk=make('div','dsh-cr-desk');desk.setAttribute('aria-hidden','true');make('div','dsh-cr-laptop left',desk);make('div','dsh-cr-laptop right',desk);
  const status=make('div','dsh-cr-status');status.setAttribute('role','status');
  const panelButton=make('button','dsh-cr-panel-toggle');panelButton.type='button';panelButton.disabled=true;
  panelButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="4" width="17" height="16" rx="1.5"/><path d="M14.5 4v16"/></svg>';
  panelButton.addEventListener('click',()=>{if(panelButton.disabled)return;try{ctx.sidebarRight.toggleExpanded();schedule();}catch(error){status.textContent='分栏暂不可用，请等待当前会话加载完成';}});
  const hud=make('dsh-control-room-hud');hud.setNumberStyle('telemetry');hud.setRanges({usage:100000000,speed:1000});
  let disposed=false,binding=null,sessionId=null,projectionSource=null,contextSource=null,statsSource=null,unbind=[],center=null,observed=null,raf=0,publishTimer=0;
  const connection=ctx.get('connection');
  const connected=()=>connection.state.getSnapshot()==='connected';
  const current=()=>Object.values(ctx.sessions.list.getSnapshot().byId).find(x=>(x.retainedBy?.mainView??0)>0);
  function read(){
    const summary=current(),id=summary?.id,nowBinding=id?ctx.sessions.binding(id):undefined;
    const session=nowBinding?.session.getSnapshot();
    const windowState=nowBinding?.eventSource.getSnapshot();
    const projection=adapter.tokenProjection(nowBinding)?.getSnapshot();
    const contextProjection=adapter.projectionOf(nowBinding,'contextPressure')?.getSnapshot();
    const statsProjection=adapter.projectionOf(nowBinding,'sessionStats')?.getSnapshot();
    const snapshot=adapter.snapshot({sessionId:id,summary,session,entries:windowState?.entries??[],projection,contextProjection,statsProjection,workspaces:ctx.workspaces.list.getSnapshot().items,connected:connected()});
    return {summary,sessionId:id,binding:nowBinding,snapshot};
  }
  function bind(next,id){
    const nextProjection=adapter.tokenProjection(next),nextContext=adapter.projectionOf(next,'contextPressure'),nextStats=adapter.projectionOf(next,'sessionStats');
    if(binding===next&&sessionId===id&&projectionSource===nextProjection&&contextSource===nextContext&&statsSource===nextStats)return;
    for(const release of unbind)release();unbind=[];binding=next;sessionId=id;projectionSource=nextProjection;contextSource=nextContext;statsSource=nextStats;
    if(next)for(const source of [next.session,next.eventSource,nextProjection,nextContext,nextStats])if(source)unbind.push(source.subscribe(queuePublish));
  }
  function queuePublish(){if(!publishTimer&&!disposed)publishTimer=setTimeout(()=>{publishTimer=0;publish();},200);}
  function publish(){
    if(disposed)return;
    const active=read();bind(active.binding,active.sessionId);
    const online=connected(),ready=active.binding?.session.getSnapshot().openState==='open';
    const label=!online?'DSH 连接中 · 停止操作暂不可用':active.summary&&!ready?'正在读取当前会话':active.summary?'DSH LIVE':'等待选择会话';
    if(status.textContent!==label)status.textContent=label;
    hud.update(active.snapshot,{live:true});
  }
  function measure(){
    raf=0;if(disposed)return;
    const parts=layoutDom.resolve(root),next=parts.center,main=parts.conversation;
    const panel=ctx.layout.panelInfo.getSnapshot().activePanelId;
    if(next!==observed){if(observed)resize.unobserve(observed);observed=next;if(observed)resize.observe(observed);}
    center=next;
    const fullscreen=parts.frame?.hasAttribute('data-rightbar-fullscreen');
    const visible=Boolean(center&&main&&panel===null&&!fullscreen);
    markers.sync({...parts,center:visible?center:null,conversation:visible?main:null});
    composerDock.update(visible?main:null);
    const expanded=ctx.sidebarRight.isExpanded(),nativeExpand=main?.querySelector('[data-sidebar-right-expand]');
    panelButton.disabled=!visible||(!expanded&&!nativeExpand);
    panelButton.setAttribute('aria-label',expanded?'收起右侧分栏':'展开右侧分栏');panelButton.title=expanded?'收起右侧分栏':'展开右侧分栏';
    panelButton.setAttribute('aria-expanded',String(expanded));
    const shortcut=nativeExpand?.getAttribute('aria-keyshortcuts');if(shortcut)panelButton.setAttribute('aria-keyshortcuts',shortcut);else panelButton.removeAttribute('aria-keyshortcuts');
    if(!visible){root.hidden=true;return;}
    // Slots may insert display:contents wrappers; their empty rect is not the containing block.
    const box=center.getBoundingClientRect(),overlay=parts.overlay.getBoundingClientRect();
    root.style.left=(box.left-overlay.left)+'px';root.style.top=(box.top-overlay.top)+'px';root.style.width=box.width+'px';root.style.height=box.height+'px';
    root.hidden=box.width<1||box.height<1;
  }
  const schedule=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(measure);};
  const composerDock=window.DshControlRoomComposer.create(schedule);
  const resize=new ResizeObserver(schedule);
  // Ignore token/text mutations; measure only real layout changes, not every streamed chunk.
  const structural='[data-slot="main"],[data-slot="main.conversation"],[data-slot="conversation.header"],[data-slot="sidebar"],[data-slot="conversation.hero.workspace"],[data-slot="conversation.composer.bar"],[data-shell-overlay],[data-sidebar-right-expand],[data-sidebar-right-session]';
  const mutation=new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'||record.target.matches?.(structural)||[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches(structural)||node.querySelector(structural)))))schedule();});
  mutation.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-rightbar-fullscreen','data-sidebar-right-open']});
  const roots=[ctx.sessions.list,ctx.workspaces.list,connection.state,ctx.layout.panelInfo];
  const releases=roots.map(source=>source.subscribe(()=>{queuePublish();schedule();}));
  window.addEventListener('resize',schedule);const timer=setInterval(()=>{publish();schedule();},2000);
  publish();schedule();
  return ()=>{disposed=true;clearInterval(timer);clearTimeout(publishTimer);cancelAnimationFrame(raf);resize.disconnect();mutation.disconnect();composerDock.dispose();markers.dispose();window.removeEventListener('resize',schedule);for(const release of [...unbind,...releases])release();root.replaceChildren();};
}
exports.inject=inject;exports.apply=apply;
