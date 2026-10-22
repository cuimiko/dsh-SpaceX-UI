/* Visually dock native pickers without moving React-owned nodes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DshControlRoomComposer=api;})(typeof window==='object'?window:globalThis,function(){
  function create(schedule){
    let bound=null;const cleanup=[];
    function mark(el,name){const previous=el.getAttribute(name);el.setAttribute(name,'');cleanup.push(()=>previous===null?el.removeAttribute(name):el.setAttribute(name,previous));}
    function ownStyle(el,name){const value=el.style.getPropertyValue(name),priority=el.style.getPropertyPriority(name);cleanup.push(()=>value?el.style.setProperty(name,value,priority):el.style.removeProperty(name));}
    function put(el,name,value){if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);}
    function clear(){for(const off of cleanup.splice(0).reverse())off();bound=null;}
    function update(conversation){
      const workspace=conversation?.querySelector('[data-slot="conversation.hero.workspace"]'),options=workspace?.parentElement,stack=options?.parentElement;
      const card=stack?.querySelector('[data-composer-card]'),toolbar=card?.lastElementChild,tools=toolbar?.firstElementChild;
      if(!options||!card||!tools||toolbar.children.length<2){clear();return;}
      if(!bound||bound.options!==options||bound.toolbar!==toolbar||bound.tools!==tools||bound.stack!==stack){
        clear();bound={options,stack,toolbar,tools,card};
        for(const [el,name]of [[stack,'data-dsh-cr-toolbar-stack'],[options,'data-dsh-cr-pickers'],[toolbar,'data-dsh-cr-toolbar'],[tools,'data-dsh-cr-tools']])mark(el,name);
        for(const name of ['--dsh-cr-picker-left','--dsh-cr-picker-top','--dsh-cr-picker-clip','--dsh-cr-picker-visibility'])ownStyle(options,name);
        ownStyle(toolbar,'--dsh-cr-picker-gap');
        const observer=new ResizeObserver(schedule);for(const el of [stack,options,card,toolbar,tools])observer.observe(el);cleanup.push(()=>observer.disconnect());
        toolbar.addEventListener('scroll',schedule,{passive:true});cleanup.push(()=>toolbar.removeEventListener('scroll',schedule));
        const reveal=event=>{const a=toolbar.getBoundingClientRect(),b=event.target.getBoundingClientRect();if(b.left<a.left)toolbar.scrollLeft-=a.left-b.left+8;else if(b.right>a.right)toolbar.scrollLeft+=b.right-a.right+8;schedule();};
        options.addEventListener('focusin',reveal);cleanup.push(()=>options.removeEventListener('focusin',reveal));
      }
      const width=options.getBoundingClientRect().width;
      put(toolbar,'--dsh-cr-picker-gap',(Math.ceil(width)+12)+'px');
      const s=stack.getBoundingClientRect(),t=toolbar.getBoundingClientRect(),a=tools.getBoundingClientRect(),o=options.getBoundingClientRect();
      const left=a.right+6,top=t.top+2+Math.max(0,(toolbar.clientHeight-8-o.height)/2);
      put(options,'--dsh-cr-picker-left',(left-s.left)+'px');put(options,'--dsh-cr-picker-top',(top-s.top)+'px');
      put(options,'--dsh-cr-picker-clip',toolbar.scrollWidth>toolbar.clientWidth+1?'inset(0 '+Math.max(0,left+o.width-t.right)+'px 0 '+Math.max(0,t.left-left)+'px)':'none');
      put(options,'--dsh-cr-picker-visibility',getComputedStyle(tools).display==='none'?'hidden':'visible');
    }
    return {update,dispose:clear};
  }
  return {create};
});
