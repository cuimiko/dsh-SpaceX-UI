/* Pure DSH 0.2.1-rc.2 projection mapping. No network, prompts or credentials. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DshControlRoomAdapter=api;})(typeof window==='object'?window:globalThis,()=>{
  const count=x=>Number.isSafeInteger(x)&&x>=0;
  const millis=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
  // The token meter is optional; its absence must not disable task state or cancellation.
  const projectionOf=(binding,key)=>binding?.session?.projections?.faceOf?.(key)??null;
  const tokenProjection=binding=>projectionOf(binding,'tokenUsage');
  function contextUsage(projection){
    const used=projection?.projectedTokens??projection?.pressureTokens,capacity=projection?.contextWindow;
    if(!count(used)||!count(capacity)||capacity===0)return {contextPercent:null,contextUsedTokens:null,contextWindow:null};
    return {contextPercent:Math.min(100,Math.round(used/capacity*100)),contextUsedTokens:used,contextWindow:capacity};
  }
  function usage(projection){
    if(!projection||!['uncachedInputTokens','outputTokens','cacheReadTokens','cacheWriteTokens'].every(k=>count(projection[k])))return {tokenUsage:null,cacheHitPercent:null};
    const prompt=projection.uncachedInputTokens+projection.cacheReadTokens+projection.cacheWriteTokens,total=prompt+projection.outputTokens;
    if(!count(prompt)||!count(total))return {tokenUsage:null,cacheHitPercent:null};
    return {tokenUsage:total,cacheHitPercent:prompt>0?projection.cacheReadTokens/prompt*100:null};
  }

  const nonnegative=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
  const tokenDelta=chunk=>chunk&&((['text-delta','reasoning-delta'].includes(chunk.type)&&typeof chunk.text==='string'&&chunk.text!=='')||(chunk.type==='tool-call-delta'&&(chunk.name!==undefined||(typeof chunk.argumentsDelta==='string'&&chunk.argumentsDelta!==''))));
  // Match the host's first-token timing for durable raw and compact stream records.
  function firstStreamToken(stream){
    if(!Array.isArray(stream))return null;
    for(const record of stream){
      if(!record)continue;
      if(record.type==='chunk'){if(tokenDelta(record.chunk)&&millis(record.time))return record.time;continue;}
      if(!['text-chunks','reasoning-chunks','tool-call-chunks'].includes(record.type)||!millis(record.time0))continue;
      if(record.type==='tool-call-chunks'&&record.name!==undefined)return record.time0;
      const fragments=record.type==='tool-call-chunks'?record.args:record.texts;
      if(!Array.isArray(fragments))continue;
      let time=record.time0;
      for(let i=0;i<fragments.length;i++){
        if(i>0){const dt=record.dt?.[i-1];if(!nonnegative(dt)){time=null;break;}time+=dt;}
        if(typeof fragments[i]==='string'&&fragments[i]!==''&&millis(time))return time;
      }
    }
    return null;
  }
  function settledSpeed(entries){
    let open=null,speed=null;
    for(const item of entries){
      const event=item?.event??item,data=event?.data??{};
      if(event?.type==='step/start'||event?.type==='llm/retry-started')open={turn:data.turn,step:data.step,first:null};
      const same=open&&open.turn===data.turn&&open.step===data.step;
      if(same&&event?.type==='assistant/live-chunk'&&open.first===null&&tokenDelta(data.chunk)&&millis(event.time))open.first=event.time;
      if(same&&event.type==='assistant/attempt'&&open.first===null)open.first=firstStreamToken(data.stream);
      if(event?.type!=='assistant/message')continue;
      const first=(same?open.first:null)??firstStreamToken(data.stream),tokens=data.usage?.outputTokens;
      if(nonnegative(tokens)&&first!==null&&millis(event.time)&&event.time>first){const value=tokens/((event.time-first)/1000);if(nonnegative(value))speed=value;}
      if(same)open=null;
    }
    return speed;
  }
  function speedReading(statsProjection,entries=[]){
    if(nonnegative(statsProjection?.decodeTokens)&&nonnegative(statsProjection?.decodeMs)&&statsProjection.decodeMs>0){
      const value=statsProjection.decodeTokens/(statsProjection.decodeMs/1000);
      if(nonnegative(value))return {tokensPerSecond:value,speedSource:'session-average'};
    }
    const value=settledSpeed(entries);
    return {tokensPerSecond:value,speedSource:value===null?null:'last-settled'};
  }
  function latestTurn(entries){
    const events=entries.map(x=>x?.event??x).filter(x=>x&&typeof x.type==='string');
    let index=-1;for(let i=events.length-1;i>=0;i--)if(events[i].type==='turn/start'){index=i;break;}
    if(index<0)return null;
    const start=events[index],turn=start.data?.turn;
    if(!count(turn)||!count(start.seq)||!millis(start.time))return null;
    const local=events.slice(index).filter(x=>x===start||x.data?.turn===turn);
    const end=local.find(x=>x.type==='turn/end');
    let step,tool;
    for(const event of local){
      const data=event.data??{};
      if(event.type==='step/start'||event.type==='llm/retry-started'){step=data.step;tool=null;}
      if(event.type==='tool/call')tool=typeof data.name==='string'?data.name:typeof data.tool?.name==='string'?data.tool.name:null;
      if(event.type==='tool/result')tool=null;
    }
    return {start,end,turn,step,tool};
  }
  function snapshot({sessionId,summary,session,entries=[],projection,contextProjection,statsProjection,workspaces=[],connected=true}){
    const turn=latestTurn(entries),workspace=workspaces.find(x=>Array.isArray(x.sessionIds)&&x.sessionIds.includes(sessionId));
    const running=connected&&session?.running===true&&session.openState==='open'&&turn&&!turn.end;
    const endKind=turn?.end?.data?.reason?.kind;
    const status=running?'running':turn?.end?(['cancelled','canceled','cancel','interrupted'].includes(endKind)?'cancelled':'completed'):'idle';
    const stepName=!connected?'等待 DSH 连接':!turn?'等待任务':turn.end?'当前轮次已结束':turn.tool?'执行工具 · '+turn.tool:count(turn.step)?'生成回复 · 第 '+(turn.step+1)+' 步':'处理当前任务';
    const start=turn?.start.time??null,end=turn?.end?.time;
    return {
      taskId:turn?JSON.stringify([sessionId,turn.start.seq]):'',taskName:stepName,
      projectName:workspace?.title||'未归属项目',sessionName:summary?.displayTitle||summary?.title||'新会话',
      startedAt:start,elapsedMs:millis(end)&&start!==null?Math.max(0,end-start):null,status,
      ...usage(projection),...contextUsage(contextProjection),...(connected?speedReading(statsProjection,entries):{tokensPerSecond:null,speedSource:null})
    };
  }
  async function stopCurrent({expected,read,resolve,connected,signal,timeoutMs=10000}){
    if(signal?.aborted)throw new Error('停止请求已取消。');
    if(!connected())throw new Error('DSH 连接已断开，请重新连接后确认。');
    const active=read();
    if(active.snapshot.taskId!==expected.taskId||active.snapshot.status!=='running'||!active.binding)throw new Error('当前执行已经改变，请重新确认。');
    const bound=resolve(active.sessionId);
    if(bound!==active.binding)throw new Error('会话已重新绑定，请重新确认。');
    let timer;
    try{
      const result=await Promise.race([Promise.resolve().then(()=>bound.session.cancel()),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('停止请求超时，请先核对 DSH 的实际运行状态。')),timeoutMs);})]);
      if(!result?.ok)throw new Error(result?.error?.message||'DSH 拒绝停止请求。');
      return {accepted:true};
    }finally{clearTimeout(timer);}
  }
  return {firstStreamToken,settledSpeed,speedReading,projectionOf,tokenProjection,contextUsage,usage,latestTurn,snapshot,stopCurrent};
});
