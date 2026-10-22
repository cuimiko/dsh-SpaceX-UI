/* Native slot anchors are DOM contracts; CSS Module names are build artifacts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DshControlRoomLayout=api;})(typeof window==='object'?window:globalThis,function(){
  function columnSlot(frame,name){
    for(const column of frame.children){
      const slot=column.querySelector(':scope > [data-slot="'+name+'"]');
      if(slot)return slot;
    }
    return null;
  }
  function resolve(layer){
    const overlay=layer.closest('[data-shell-overlay]'),frame=overlay?.parentElement;
    if(!frame)return {overlay:null,frame:null,sidebar:null,center:null,conversation:null};
    const mainSlot=columnSlot(frame,'main'),sidebarSlot=columnSlot(frame,'sidebar');
    const conversationSlot=mainSlot?.querySelector('[data-slot="main.conversation"]');
    const conversation=conversationSlot?.querySelector(':scope > [data-phase]')??null;
    return {overlay,frame,sidebar:sidebarSlot?.parentElement??null,center:mainSlot?.parentElement??null,conversation};
  }
  function createMarkers(){
    const owned=new Map();
    const names={frame:'data-dsh-cr-frame',sidebar:'data-dsh-cr-sidebar',center:'data-dsh-cr-center',conversation:'data-dsh-cr-conversation'};
    function restore(el,name,previous){if(previous===null)el.removeAttribute(name);else el.setAttribute(name,previous);}
    function sync(parts){
      for(const [name,record] of owned){
        const key=Object.keys(names).find(key=>names[key]===name);
        if(parts[key]!==record.el){restore(record.el,name,record.previous);owned.delete(name);}
      }
      for(const [key,name] of Object.entries(names)){
        const el=parts[key];if(!el||owned.has(name))continue;
        owned.set(name,{el,previous:el.getAttribute(name)});el.setAttribute(name,'');
      }
    }
    return {sync,dispose(){sync({});}};
  }
  return {resolve,createMarkers};
});
