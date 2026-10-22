const test=require('node:test'),assert=require('node:assert/strict');
const {resolve,createMarkers}=require('../src/layout.cjs');
// Minimal DOM fixture for topology/ownership tests; full CSS and DOM are tested in-browser.
class Element{
  constructor(attrs={},children=[]){this.attrs=new Map(Object.entries(attrs));this.children=children;for(const child of children)child.parentElement=this;}
  getAttribute(name){return this.attrs.get(name)??null;}
  hasAttribute(name){return this.attrs.has(name);}
  setAttribute(name,value){this.attrs.set(name,value);}
  removeAttribute(name){this.attrs.delete(name);}
  matches(selector){const match=/^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);assert(match,'Fixture selector '+selector);return match[2]===undefined?this.hasAttribute(match[1]):this.getAttribute(match[1])===match[2];}
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  querySelector(selector){const direct=selector.startsWith(':scope > '),target=direct?selector.slice(9):selector;for(const node of this.children){if(node.matches(target))return node;if(!direct){const found=node.querySelector(target);if(found)return found;}}return null;}
}
function fixture(prefix=''){
  const header=new Element(),conversation=new Element({'data-phase':'hero',class:prefix+'root'},[new Element({'data-slot':'conversation.header'},[header])]);
  const mainSlot=new Element({'data-slot':'main'},[new Element({'data-slot':'main.conversation'},[conversation])]);
  const center=new Element({class:prefix+'centerCol'},[mainSlot]),sidebar=new Element({class:prefix+'sidebarCol'},[new Element({'data-slot':'sidebar'})]);
  const layer=new Element(),overlay=new Element({'data-shell-overlay':''},[new Element({'data-slot':'shell.overlay'},[layer])]);
  const frame=new Element({class:prefix+'frame'},[sidebar,center,overlay]);return {frame,sidebar,center,conversation,mainSlot,overlay,layer};
}
test('native nested slots resolve with Windows, Mac/Web, arbitrary or absent class names',()=>{
  for(const prefix of ['BynINW_','pI_x6G_','totally-different_','']){
    const f=fixture(prefix);if(prefix==='')for(const node of [f.frame,f.sidebar,f.center,f.conversation])node.removeAttribute('class');
    assert.deepEqual(resolve(f.layer),{frame:f.frame,sidebar:f.sidebar,center:f.center,conversation:f.conversation,overlay:f.overlay});
  }
});
test('another main panel is not mistaken for a conversation',()=>{
  const f=fixture();f.mainSlot.children=[new Element({'data-phase':'active'})];assert.equal(resolve(f.layer).conversation,null);
});
test('resolution stays in the layer own frame and fails safely outside a shell',()=>{
  const a=fixture('a'),b=fixture('b');new Element({},[a.frame,b.frame]);assert.equal(resolve(a.layer).center,a.center);assert.equal(resolve(b.layer).center,b.center);assert.equal(resolve(new Element()).frame,null);
});
test('markers release old nodes on panel/session changes and restore pre-existing attributes',()=>{
  const a=fixture(),b=fixture();a.frame.setAttribute('data-dsh-cr-frame','prior');const marks=createMarkers();marks.sync(a);
  assert(a.center.hasAttribute('data-dsh-cr-center'));marks.sync({frame:a.frame,sidebar:a.sidebar});
  assert(!a.center.hasAttribute('data-dsh-cr-center'));assert(!a.conversation.hasAttribute('data-dsh-cr-conversation'));
  marks.sync(b);assert.equal(a.frame.getAttribute('data-dsh-cr-frame'),'prior');assert(!a.sidebar.hasAttribute('data-dsh-cr-sidebar'));
  marks.dispose();for(const node of [b.frame,b.sidebar,b.center,b.conversation])assert(![...node.attrs.keys()].some(key=>key.startsWith('data-dsh-cr-')));
});

