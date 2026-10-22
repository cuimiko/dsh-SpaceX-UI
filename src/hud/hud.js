/* Framework-free HUD. The DSH bridge contract is owned by this prototype. */
(() => {
  const scriptRoot = new URL('.', document.currentScript?.src || document.baseURI);
  const css = `
    @font-face{font-family:DDIN;src:url('${new URL('assets/D-DIN.woff2',scriptRoot)}') format('woff2');font-display:swap}
    :host{--hud-opacity:.78;--hud-shadow:.8;--hud-scale:1;display:block;position:absolute;inset:0;pointer-events:none;color:#fff;font-family:DDIN,'Bahnschrift','Arial Narrow','Microsoft YaHei',sans-serif;font-weight:400;-webkit-font-smoothing:antialiased}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid #fff;outline-offset:5px}button:disabled{cursor:default;opacity:.45}
    .wash{position:absolute;inset:auto 0 0;height:clamp(180px,14vw,285px);background:linear-gradient(to top,rgba(0,0,0,var(--hud-opacity)) 0%,rgba(0,0,0,calc(var(--hud-opacity)*.82)) 18%,rgba(0,0,0,calc(var(--hud-opacity)*.28)) 57%,transparent 100%)}
    .layout{position:absolute;bottom:clamp(2px,.25vw,6px);left:50%;width:94.6%;display:grid;--dial-size:clamp(96px,7.5vw,154px);grid-template-columns:var(--dial-size) var(--dial-size) minmax(0,1fr) var(--dial-size) var(--dial-size);align-items:center;gap:clamp(24px,2.6vw,54px);transform:translateX(-50%) scale(var(--hud-scale));transform-origin:50% 100%;isolation:isolate}
    .dial{aspect-ratio:1;position:relative;min-width:0;justify-self:center;font-variant-numeric:tabular-nums}.track,.secondary,.progress{fill:none}.dial-copy{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.dial-label,.value,.unit{white-space:nowrap}.value{line-height:1}.mission{text-align:center;min-width:0;font-variant-numeric:tabular-nums}.task{font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.clock{display:flex;justify-content:center;white-space:nowrap;line-height:1}.project{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stale{opacity:.6}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    .state{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);font-size:8px;letter-spacing:2px;color:#ffffff75}
    /* Geometry measured from the supplied 1653 x 204 broadcast strip. */
    .dial{width:clamp(96px,7.5vw,154px);max-width:none;isolation:isolate}
    .shade-plane{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden}
    .dial>.ring{position:absolute;inset:0;width:100%;height:100%}.rim{fill:none;stroke:rgba(0,0,0,.4);stroke-width:4.2}.secondary{fill:none;stroke:rgba(255,255,255,.10);stroke-width:1}.track{stroke:rgba(255,255,255,.38);stroke-width:3.2}.progress{stroke:#f5f5f3;stroke-width:3.2;stroke-linecap:butt;transition:none}
    .dial-copy{padding-top:1%;padding-bottom:0;text-shadow:0 1px 3px #0007}.dial-label{font-size:clamp(9px,.74vw,14px);letter-spacing:.7px;margin-bottom:2px;line-height:1.1;color:#ffffffd9}.value{font-size:clamp(26px,2.16vw,43px);letter-spacing:0;line-height:1}.unit{font-size:clamp(9px,.74vw,14px);letter-spacing:.7px;margin-top:1px;color:#ffffffc9}.numerals,.dial svg.numerals{height:1em;display:block;overflow:visible;width:auto;max-width:100%}.value{max-width:80%}.mission{padding:8px 0 0;align-self:center;text-shadow:0 2px 5px #0009}.task{font-size:clamp(10px,.8vw,15px);letter-spacing:.8px;margin:0 0 7px;line-height:1.25}.clock{gap:7px;align-items:center}.prefix{font-size:clamp(19px,1.6vw,30px);font-weight:600;letter-spacing:0;color:#ffffffc9}.time{font-size:clamp(29px,2.45vw,47px);letter-spacing:0}.project{font-size:clamp(10px,.78vw,15px);letter-spacing:.6px;margin-top:3px;line-height:1.3;color:#ffffffd9}
    .progress{transition:stroke-dasharray .45s linear}.dial-label{margin-bottom:5px}.unit{margin-top:5px}.value{font-size:clamp(22px,1.76vw,34px);max-width:74%;pointer-events:auto;cursor:help}.dial-copy{padding-bottom:0}
    @media(max-width:1050px){.layout{width:97%;gap:clamp(20px,calc(12vw - 64px),48px)}.task{letter-spacing:.3px}.dial-label{font-size:9px}.unit{font-size:9px}}
    @media(max-width:760px){.layout{width:calc(100% - 24px);grid-template-columns:repeat(4,1fr);gap:5px;bottom:2px;max-width:480px}.mission{grid-column:1/-1;grid-row:1;margin-bottom:7px}.dial{grid-row:2;width:min(100%,105px)}.time{font-size:35px}.value{font-size:clamp(24px,6.6vw,31px)}.task{font-size:11px}.project{font-size:10px}.dial-label{font-size:8px}.unit{font-size:8px}.wash{height:260px}.state{font-size:7px}}
    @media(max-width:760px){.value{font-size:clamp(20px,5.6vw,27px)}}
    .value,.time{font-family:var(--hud-number-font,DDIN,sans-serif);font-weight:var(--hud-number-weight,400);font-synthesis:none;font-variant-numeric:lining-nums tabular-nums;font-feature-settings:'tnum' 1,'lnum' 1;letter-spacing:.035em;line-height:1.05;text-rendering:optimizeLegibility}
    .value{display:flex;justify-content:center;align-items:baseline;gap:.06em;max-width:80%;font-size:clamp(25px,2.1vw,40px)}.value .digits{white-space:nowrap}.suffix{font-size:.54em;letter-spacing:.02em;font-weight:400;opacity:.88}.time{font-size:clamp(28px,2.35vw,44px);letter-spacing:.025em;white-space:nowrap}.prefix{font-family:DDIN,'Segoe UI',sans-serif;font-weight:600;letter-spacing:.03em}.dial-label{letter-spacing:1px;font-size:clamp(9px,.73vw,14px)}.unit{letter-spacing:1px;opacity:.85}.clock{align-items:center;gap:9px}.dial-copy{padding-bottom:2%}
    @media(max-width:1050px){.value{font-size:25px}.time{font-size:28px}.clock{gap:8px}}
    @media(max-width:760px){.value{font-size:clamp(23px,6.4vw,30px)}.time{font-size:30px}}
    .dial-label{margin-bottom:7px}.unit{margin-top:7px}.task{margin-bottom:10px}.project{margin-top:7px}.dial-copy{padding-bottom:1%}
    @media(max-width:760px){.layout{gap:12px}.dial-label{margin-bottom:5px}.unit{margin-top:5px}}
    :host([data-number-style="telemetry"]) .value{font-size:clamp(22px,1.8vw,34px)}
    @media(max-width:1050px){:host([data-number-style="telemetry"]) .value{font-size:22px}}
    @media(max-width:760px){:host([data-number-style="telemetry"]) .value{font-size:clamp(21px,5.6vw,27px)}}
    .task-progress{position:absolute;height:38px;pointer-events:none;color:#fff}
    .task-line{position:absolute;left:0;top:14px;display:block;pointer-events:none}
    .milestone{position:absolute;left:50%;top:18px;transform:translateX(-50%)}
    .milestone::before{content:'';position:absolute;width:8px;height:8px;left:-4px;top:-4px;border:1px solid #e7e7dfb5;border-radius:50%;background:#383936b0;box-shadow:0 0 0 2px #1111}
    .milestone .task{position:absolute;bottom:12px;left:0;transform:translateX(-50%);margin:0;max-width:min(360px,65vw);line-height:1.25;text-shadow:0 1px 3px #0008}
    .mission{padding-top:calc(18px + clamp(12.5px,1vw,18.75px))}
    @media(prefers-reduced-motion:reduce){.progress{transition:none}}
  `;
  function ring(id) {
    return `<svg class="ring" viewBox="0 0 140 140" aria-hidden="true"><circle class="rim" cx="70" cy="70" r="64" pathLength="100" stroke-dasharray="66.667 33.333" transform="rotate(150 70 70)"/><circle class="track" cx="70" cy="70" r="64" pathLength="100" stroke-dasharray="66.667 33.333" transform="rotate(150 70 70)"/><circle class="progress" id="${id}-arc" cx="70" cy="70" r="64" pathLength="100" stroke-dasharray="1.1 98.9" transform="rotate(150 70 70)"/></svg>`;
  }
  // Numerals traced in proportion to the supplied 01:23:45 close-up:
  // broad flat-sided zero, horizontal flag on one, curved bowls, square terminals.
  const numericPaths={
    '0':'M8 3H16C20.4 3 22 5.1 22 9V25C22 29 20 31 16 31H8C4 31 2 29 2 25V9C2 5 4 3 8 3Z',
    '1':'M7 3H13V31',
    '2':'M2.5 9C2.5 4.8 5.5 3 10 3H14C19 3 22 5.4 22 10C22 13 20.5 15.1 17 18L3 31H22',
    '3':'M3 7C5 4 8 3 12 3H14C19 3 22 5 22 10C22 14 19.5 16.5 15 16.5H10M15 16.5C20 16.5 22 19 22 23.5C22 29 18 31 13 31H10C6 31 3.5 29.4 2.5 27',
    '4':'M15 3L2 22H22M18 3V31',
    '5':'M22 3H4V16.5H14C20 16.5 22 19 22 24C22 29 18 31 13 31H10C6 31 3 29.5 2 27',
    '6':'M21 6C19 3.6 17 3 13 3H11C5 3 2 6 2 12V24C2 29 5 31 10 31H14C19 31 22 28.5 22 24V22C22 17.5 19 15.5 14 15.5H10C6 15.5 2 18 2 22',
    '7':'M2 3H22L9 31',
    '8':'M9 16.5C4 16.5 2 14 2 10C2 5 5 3 10 3H14C19 3 22 5 22 10C22 14 20 16.5 15 16.5H9ZM9 16.5C4 16.5 2 19.5 2 24C2 29 5 31 10 31H14C19 31 22 29 22 24C22 19.5 20 16.5 15 16.5',
    '9':'M3 28C5 30.4 7 31 11 31H13C19 31 22 28 22 22V10C22 5 19 3 14 3H10C5 3 2 5.5 2 10V12C2 16.5 5 18.5 10 18.5H14C18 18.5 22 16 22 12',
    '—':'M3 17H21'
  };
  // Visible extents include the 3.2-unit stroke and the short flag on 1.
  // Center the ink, rather than the fixed-width cells (notably for 140 / 112).
  const numericInk={
    '0':[.4,23.6],'1':[7,14.6],'2':[.9,23.6],'3':[1,23.6],
    '4':[.4,22],'5':[.5,23.6],'6':[.4,23.6],'7':[2,23.5],
    '8':[.4,23.6],'9':[.4,23.6],'—':[3,21],'.':[3,6],':':[3,6]
  };
  function numericSvg(value,widthScale=1){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.classList.add('numerals');svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
    let x=0,inkMin=Infinity,inkMax=-Infinity;
    for(const char of value){
      const dot=char==='.'||char===':',width=char==='.'?8:char===':'?10:28;
      const group=document.createElementNS(ns,'g');group.setAttribute('transform','translate('+x+' 0)');
      if(dot){for(const y of char===':'?[11.5,24.5]:[30.5]){const mark=document.createElementNS(ns,'rect');mark.setAttribute('x','3');mark.setAttribute('y',y-1.5);mark.setAttribute('width','3');mark.setAttribute('height','3');mark.setAttribute('rx','.35');mark.setAttribute('fill','currentColor');group.append(mark);}}
      else{const path=document.createElementNS(ns,'path');path.setAttribute('d',numericPaths[char]||numericPaths['—']);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','3.2');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','butt');group.append(path);}
      const bounds=numericInk[char]||numericInk['—'];inkMin=Math.min(inkMin,x+bounds[0]);inkMax=Math.max(inkMax,x+bounds[1]);
      svg.append(group);x+=width;
    }
    const width=Math.max(1,x-3),origin=Number.isFinite(inkMin)?(inkMin+inkMax-width)/2:-1;
    svg.dataset.inkMin=inkMin;svg.dataset.inkMax=inkMax;
    svg.setAttribute('viewBox',origin+' 0 '+width+' 34');svg.style.width=(width/34*widthScale)+'em';
    return svg;
  }
  function setNumerals(target,value){
    const geometric=target.getRootNode().host?.dataset.numberStyle==='telemetry';
    const cache=value+'|'+geometric;if(target.dataset.rendered===cache)return;
    target.dataset.rendered=cache;target.dataset.value=value;
    const parts=/^(.+?)([KMBT])$/.exec(value),digits=parts?parts[1]:value;
    const number=document.createElement('span');number.className='digits';
    if(geometric){number.setAttribute('aria-label',digits);number.append(numericSvg(digits,target.id==='time'?.94:1));}else number.textContent=digits;
    target.replaceChildren(number);
    if(parts){const suffix=document.createElement('span');suffix.className='suffix';suffix.textContent=parts[2];target.append(suffix);}
  }
  const finite=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  function normalize(raw={}) {
    return {speedSource:['session-average','last-settled'].includes(raw.speedSource)?raw.speedSource:null,taskId:typeof raw.taskId==='string'?raw.taskId:'',taskName:typeof raw.taskName==='string'?raw.taskName:'等待任务',sessionName:typeof raw.sessionName==='string'?raw.sessionName:'新会话',contextPercent:finite(raw.contextPercent)&&raw.contextPercent<=100?raw.contextPercent:null,contextUsedTokens:finite(raw.contextUsedTokens)?raw.contextUsedTokens:null,contextWindow:finite(raw.contextWindow)?raw.contextWindow:null,projectName:typeof raw.projectName==='string'?raw.projectName:'—',startedAt:finite(raw.startedAt)?raw.startedAt:null,elapsedMs:finite(raw.elapsedMs)?raw.elapsedMs:null,status:['running','idle','completed','cancelled'].includes(raw.status)?raw.status:'idle',tokenUsage:finite(raw.tokenUsage)?raw.tokenUsage:null,tokensPerSecond:finite(raw.tokensPerSecond)?raw.tokensPerSecond:null,cacheHitPercent:finite(raw.cacheHitPercent)&&raw.cacheHitPercent<=100?raw.cacheHitPercent:null,usageRatio:finite(raw.usageRatio)?Math.min(1,raw.usageRatio):null};
  }
  function formatTime(ms){const s=Math.floor(Math.max(0,ms)/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':');}
  class MissionHud extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this.data=normalize();this.ranges={usage:100000000,speed:1000};this.frozenElapsed=0;this.receivedAt=0;this.live=false;}
    connectedCallback(){
      this.dataset.numberStyle ||= 'telemetry';
      this.shadowRoot.innerHTML=`<style>${css}</style><div class="wash"></div><svg class="shade-plane" aria-hidden="true" preserveAspectRatio="none"><defs><linearGradient id="shade-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="black" style="stop-opacity:calc(var(--hud-shadow)*.48)"/><stop offset="1" stop-color="black" style="stop-opacity:calc(var(--hud-shadow)*.76)"/></linearGradient></defs><path id="shade-left" fill="url(#shade-gradient)"/><path id="shade-right" fill="url(#shade-gradient)"/></svg><div class="task-progress" id="task-progress" role="img"><canvas class="task-line" id="task-line" aria-hidden="true"></canvas><div class="milestone"><h2 class="task" id="task"></h2></div></div><div class="layout"><div class="dial" aria-label="Token 用量">${ring('usage')}<div class="dial-copy"><span class="dial-label">USAGE</span><span class="value" id="usage">—</span><span class="unit">TOKENS</span></div></div><div class="dial" aria-label="Token 速度">${ring('speed')}<div class="dial-copy"><span class="dial-label">SPEED</span><span class="value" id="speed">—</span><span class="unit">TOKENS/S</span></div></div><div class="mission"><div class="clock"><span class="prefix">T+</span><span class="time" id="time">00:00:00</span></div><div class="project" id="project"></div></div><div class="dial" aria-label="缓存命中率">${ring('cache')}<div class="dial-copy"><span class="dial-label">CACHE HIT</span><span class="value" id="cache">—</span><span class="unit">%</span></div></div><div class="dial" aria-label="上下文占用">${ring('context')}<div class="dial-copy"><span class="dial-label">CONTEXT</span><span class="value" id="context">—</span><span class="unit">%</span></div></div></div><div class="state" id="state" role="status"></div>`;
      this.clockTimer=setInterval(()=>this.renderClock(),250);this.render();
      this.geometryResize=new ResizeObserver(()=>this.scheduleShades());
      this.geometryResize.observe(this);this.geometryResize.observe(this.shadowRoot.querySelector('.layout'));
      this.geometryStyle=new MutationObserver(()=>this.scheduleShades());this.geometryStyle.observe(this,{attributes:true,attributeFilter:['style']});
      this.scheduleShades();
    }
    disconnectedCallback(){clearInterval(this.clockTimer);this.geometryResize?.disconnect();this.geometryStyle?.disconnect();cancelAnimationFrame(this.shadeFrame);}
    $(id){return this.shadowRoot.getElementById(id)}
    get elapsed(){const d=this.data;return d.status==='running'?(d.elapsedMs!==null?d.elapsedMs+Math.max(0,performance.now()-this.receivedAt):(d.startedAt!==null?Math.max(0,Date.now()-d.startedAt):0)):this.frozenElapsed;}
    update(raw,{live=this.live}={}){const next=normalize(raw);const previousElapsed=this.elapsed;const changed=next.taskId!==this.data.taskId;this.frozenElapsed=next.elapsedMs??(next.status!=='running'?(changed?0:previousElapsed):0);this.data=next;this.live=live;this.receivedAt=performance.now();this.lastUpdate=Date.now();this.render();}
    scheduleShades(){cancelAnimationFrame(this.shadeFrame);this.shadeFrame=requestAnimationFrame(()=>this.renderShades());}
    renderShades(){
      const host=this.getBoundingClientRect(),dials=this.shadowRoot.querySelectorAll('.dial');
      if(!host.width||!host.height||dials.length!==4)return;
      const circle=element=>{const track=element.querySelector('.track'),matrix=track.getScreenCTM();const center=new DOMPoint(track.cx.baseVal.value,track.cy.baseVal.value).matrixTransform(matrix);const radius=(track.r.baseVal.value+parseFloat(getComputedStyle(track).strokeWidth)/2)*Math.hypot(matrix.a,matrix.b);return {cx:center.x-host.left,cy:center.y-host.top,r:radius};};
      const polygons=window.DshHudGeometry.trapezoidShades({width:host.width,height:host.height,left:circle(dials[1]),right:circle(dials[2])});
      this.shadowRoot.querySelector('.shade-plane').setAttribute('viewBox','0 0 '+host.width+' '+host.height);
      for(const side of ['left','right'])this.$('shade-'+side).setAttribute('d',polygons.paths[side]);
      const line=this.$('task-progress'),mobile=host.width<=760;
      // Place the line a third of the way down the panels; its tips follow the 45-degree slopes.
      const leftTop=polygons.left[0][1],rightTop=polygons.right[0][1];
      const desiredY=Math.min(leftTop,rightTop)+(host.height-Math.min(leftTop,rightTop))/3;
      const pixelRatio=window.devicePixelRatio||1,y=(Math.round(desiredY*pixelRatio)+.5)/pixelRatio;
      const gap=6,start=polygons.left[1][0]+y-leftTop+gap,end=polygons.right[0][0]-(y-rightTop)-gap;
      line.style.left=(Math.round(start*pixelRatio)/pixelRatio)+'px';line.style.width=(Math.round(Math.max(120,end-start)*pixelRatio)/pixelRatio)+'px';line.style.top=(y-18)+'px';
      if(mobile){line.style.left='8%';line.style.width='84%';line.style.top=(this.shadowRoot.querySelector('.layout').getBoundingClientRect().top-host.top-51)+'px';}
      const raster=window.DshHudGeometry.taskLinePixels({width:line.getBoundingClientRect().width,pixelRatio});
      const canvas=this.$('task-line');canvas.width=raster.width;canvas.height=raster.height;
      canvas.style.width=(raster.width/pixelRatio)+'px';canvas.style.height=(raster.height/pixelRatio)+'px';canvas.style.top=(18-raster.center/pixelRatio)+'px';
      canvas.getContext('2d').putImageData(new ImageData(raster.pixels,raster.width,raster.height),0,0);
    }
    setNumberStyle(style){this.dataset.numberStyle=style;this.render();}
    setRanges(ranges){for(const key of ['usage','speed'])if(Number.isFinite(ranges[key])&&ranges[key]>0)this.ranges[key]=ranges[key];this.render();}
    render(){
      if(!this.$('usage'))return;
      const d=this.data,m=window.DshHudMetrics;
      setNumerals(this.$('usage'),m.compact(d.tokenUsage));
      setNumerals(this.$('speed'),m.rate(d.tokensPerSecond));
      setNumerals(this.$('cache'),d.cacheHitPercent===null?'—':d.cacheHitPercent.toFixed(1));
      this.$('usage').title=d.tokenUsage===null?'Token 用量未知':d.tokenUsage.toLocaleString('en-US')+' TOKENS';
      this.$('speed').title=d.tokensPerSecond===null?'Token 速度未知':d.tokensPerSecond.toLocaleString('en-US')+' TOKENS/S · '+(d.speedSource==='session-average'?'DSH 会话平均生成速度':'最近已结算回复速度');
      this.$('usage').parentElement.parentElement.setAttribute('aria-label',this.$('usage').title);
      this.$('task').textContent=d.taskName;this.$('task').title=d.taskName;
      this.$('project').textContent=d.sessionName;this.$('project').title=d.sessionName+' · '+d.projectName;
      for(const [id,fraction]of Object.entries(m.arcs(d,this.ranges)))this.$(id+'-arc').setAttribute('stroke-dasharray',String(fraction*66.667)+' 100');
      setNumerals(this.$('context'),d.contextPercent===null?'—':String(d.contextPercent));
      this.$('context').title=d.contextPercent===null?'上下文占用未知':d.contextUsedTokens!==null&&d.contextWindow!==null?d.contextUsedTokens.toLocaleString('en-US')+' / '+d.contextWindow.toLocaleString('en-US')+' TOKENS':d.contextPercent+'%';
      this.$('context').parentElement.parentElement.setAttribute('aria-label','上下文占用：'+(d.contextPercent===null?'未知':d.contextPercent+'%'));
      this.$('task-progress').setAttribute('aria-label','当前任务：'+d.taskName);
      this.renderClock();
    }
    renderClock(){if(!this.$('time'))return;setNumerals(this.$('time'),formatTime(this.elapsed));const stale=this.live&&Date.now()-this.lastUpdate>10000;this.shadowRoot.querySelector('.layout').classList.toggle('stale',stale);this.$('state').textContent=stale?'遥测连接待更新':this.data.status==='completed'?'任务已结束':this.data.status==='cancelled'?'任务已停止':'';}

  }
  customElements.define('dsh-mission-hud',MissionHud);
  window.DshHudUtils={normalize,formatTime};
})();
