/* Pure display policy; values and arc ranges always use unabridged numbers. */
(function(root){
  const valid=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
  function compact(value){
    if(!valid(value))return '—';
    const scales=[1,1e3,1e6,1e9,1e12],suffixes=['','K','M','B','T'];
    let index=0;
    while(index<scales.length-1&&value>=scales[index+1])index++;
    if(index===0){const rounded=Math.round(value);return rounded>=1000?compact(rounded):String(rounded);}
    let scaled=value/scales[index];
    let rounded=Number(scaled.toFixed(scaled<100?1:0));
    if(rounded>=1000&&index<scales.length-1){index++;scaled=value/scales[index];rounded=Number(scaled.toFixed(scaled<100?1:0));}
    return String(rounded)+suffixes[index];
  }
  function rate(value){return !valid(value)?'—':value>=999.5?compact(Math.round(value)):value>=100?String(Math.round(value)):value.toFixed(1);}
  function fraction(value,max){return valid(value)&&typeof max==='number'&&Number.isFinite(max)&&max>0?Math.max(0,Math.min(1,value/max)):0;}
  function arcs(snapshot,ranges){
    return {usage:snapshot.tokenUsage===null?0:valid(snapshot.usageRatio)?Math.min(1,snapshot.usageRatio):fraction(snapshot.tokenUsage,ranges.usage),speed:fraction(snapshot.tokensPerSecond,ranges.speed),cache:fraction(snapshot.cacheHitPercent,100),context:fraction(snapshot.contextPercent,100)};
  }
  const api={compact,rate,fraction,arcs};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.DshHudMetrics=api;
})(typeof window==='object'?window:globalThis);
