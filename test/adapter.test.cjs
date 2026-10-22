const test=require('node:test'),assert=require('node:assert/strict');
const a=require('../src/adapter.cjs');
const start={type:'turn/start',seq:11,time:1000,data:{turn:2}};
const step={type:'step/start',seq:12,time:1100,data:{turn:2,step:0}};
const input={sessionId:'a',summary:{title:'会话 A'},session:{running:true,openState:'open'},entries:[{event:start},{event:step}],workspaces:[{title:'项目 A',sessionIds:['a']}],projection:{uncachedInputTokens:100,outputTokens:10,cacheReadTokens:40,cacheWriteTokens:20}};
test('uses authoritative billed buckets, including cache read/write, without double counting',()=>{assert.deepEqual(a.usage(input.projection),{tokenUsage:170,cacheHitPercent:25});});
test('unknown projection and malformed/unsafe buckets stay unknown',()=>{for(const p of [undefined,{}, {...input.projection,outputTokens:-1},{...input.projection,cacheReadTokens:undefined},{...input.projection,outputTokens:Number.MAX_SAFE_INTEGER}])assert.deepEqual(a.usage(p),{tokenUsage:null,cacheHitPercent:null});});
test('zero cache is distinct from an absent prompt denominator',()=>{assert.equal(a.usage({uncachedInputTokens:2,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}).cacheHitPercent,0);assert.equal(a.usage({uncachedInputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}).cacheHitPercent,null);});
test('project ownership and exact turn identity are independent from session title',()=>{const s=a.snapshot(input);assert.equal(s.projectName,'项目 A');assert.equal(s.taskName,'生成回复 · 第 1 步');assert.equal(s.sessionName,'会话 A');assert.equal(s.taskId,JSON.stringify(['a',11]));assert.equal(s.status,'running');});
test('switching to a fresh or unrelated session cannot retain old labels or stop authority',()=>{const s=a.snapshot({...input,sessionId:'b',summary:undefined,entries:[],projection:undefined});assert.equal(s.taskId,'');assert.equal(s.projectName,'未归属项目');assert.equal(s.taskName,'等待任务');assert.equal(s.status,'idle');assert.equal(s.tokenUsage,null);});
test('an incomplete history window has no executable turn identity',()=>{const s=a.snapshot({...input,entries:[step]});assert.equal(s.status,'idle');assert.equal(s.taskId,'');});
test('completed turn freezes at the host end time; disconnected or unopened sessions cannot run',()=>{const end={type:'turn/end',seq:14,time:6000,data:{turn:2,reason:{kind:'interrupted'}}};const s=a.snapshot({...input,entries:[start,step,end]});assert.equal(s.status,'cancelled');assert.equal(s.elapsedMs,5000);assert.equal(a.snapshot({...input,connected:false}).status,'idle');assert.equal(a.snapshot({...input,session:{running:true,openState:'loading'}}).status,'idle');});
test('speed uses provider output counts and observed decoding interval, never text length',()=>{const delta={type:'assistant/live-chunk',time:2000,data:{turn:2,step:0,chunk:{type:'text-delta',text:'很长的文字'}}};const end={type:'assistant/message',time:4000,data:{turn:2,step:0,usage:{outputTokens:100}}};assert.equal(a.snapshot({...input,entries:[start,step,delta,end]}).tokensPerSecond,50);assert.equal(a.snapshot({...input,entries:[start,step,end]}).tokensPerSecond,null);assert.equal(a.snapshot({...input,entries:[start,step,delta,{...end,time:2000}]}).tokensPerSecond,null);});
test('step/retry boundary invalidates the previous decoding interval',()=>{const delta={type:'assistant/live-chunk',time:2000,data:{turn:2,step:0,chunk:{type:'text-delta',text:'a'}}};const retry={type:'llm/retry-started',time:3000,data:{turn:2,step:0}};const end={type:'assistant/message',time:4000,data:{turn:2,step:0,usage:{outputTokens:100}}};assert.equal(a.snapshot({...input,entries:[start,step,delta,retry,end]}).tokensPerSecond,null);});
test('late historical records cannot select a different turn',()=>{const old={type:'turn/end',seq:5,time:800,data:{turn:1}};assert.equal(a.snapshot({...input,entries:[old,start,step]}).taskId,JSON.stringify(['a',11]));});
test('stop calls the exact retained native session and awaits its accepted result',async()=>{let called=0;const binding={session:{cancel:async()=>{called++;return {ok:true};}}};const value={sessionId:'a',binding,snapshot:a.snapshot(input)};assert.deepEqual(await a.stopCurrent({expected:{taskId:value.snapshot.taskId},read:()=>value,resolve:()=>binding,connected:()=>true}),{accepted:true});assert.equal(called,1);});
test('changed execution, binding, connection and native denial never return accepted',async()=>{let called=0;const binding={session:{cancel:async()=>{called++;return {ok:false,error:{message:'权限不足'}};}}},value={sessionId:'a',binding,snapshot:a.snapshot(input)},base={expected:{taskId:value.snapshot.taskId},read:()=>value,resolve:()=>binding,connected:()=>true};await assert.rejects(a.stopCurrent({...base,expected:{taskId:'old'}}),/执行已经改变/);await assert.rejects(a.stopCurrent({...base,resolve:()=>({})}),/重新绑定/);await assert.rejects(a.stopCurrent({...base,connected:()=>false}),/连接已断开/);assert.equal(called,0);await assert.rejects(a.stopCurrent(base),/权限不足/);assert.equal(called,1);});
test('an unresolved native stop has a bounded wait and cannot report success',async()=>{const binding={session:{cancel:()=>new Promise(()=>{})}},value={sessionId:'a',binding,snapshot:a.snapshot(input)};await assert.rejects(a.stopCurrent({expected:{taskId:value.snapshot.taskId},read:()=>value,resolve:()=>binding,connected:()=>true,timeoutMs:5}),/停止请求超时/);});

test('optional token projection may disappear and reappear without losing task or stop authority',async()=>{
 const source={getSnapshot:()=>input.projection},session={...input.session},binding={session};
 for(const projections of [undefined,{}, {faceOf:()=>undefined},{faceOf:()=>null}]){session.projections=projections;assert.equal(a.tokenProjection(binding),null);const snapshot=a.snapshot({...input,projection:a.tokenProjection(binding)?.getSnapshot()});assert.equal(snapshot.tokenUsage,null);assert.equal(snapshot.status,'running');assert.equal(snapshot.taskId,JSON.stringify(['a',11]));}
 session.projections={faceOf:key=>key==='tokenUsage'?source:undefined};assert.equal(a.tokenProjection(binding),source);assert.equal(a.snapshot({...input,projection:a.tokenProjection(binding).getSnapshot()}).tokenUsage,170);
 session.projections={faceOf:()=>undefined};let called=0;session.cancel=async()=>{called++;return {ok:true};};const snapshot=a.snapshot({...input,projection:undefined});assert.deepEqual(await a.stopCurrent({expected:{taskId:snapshot.taskId},read:()=>({sessionId:'a',binding,snapshot}),resolve:()=>binding,connected:()=>true}),{accepted:true});assert.equal(called,1);assert.equal(a.tokenProjection(undefined),null);
});

test('context occupancy follows native projected pressure, keeps zero, caps at 100 and rejects absent capacity',()=>{
 assert.deepEqual(a.contextUsage({projectedTokens:0,pressureTokens:500,contextWindow:1000}),{contextPercent:0,contextUsedTokens:0,contextWindow:1000});
 assert.equal(a.contextUsage({projectedTokens:459,pressureTokens:10,contextWindow:1000}).contextPercent,46);
 assert.equal(a.contextUsage({pressureTokens:1500,contextWindow:1000}).contextPercent,100);
 for(const value of [undefined,{}, {pressureTokens:10},{pressureTokens:10,contextWindow:0},{projectedTokens:-1,pressureTokens:10,contextWindow:1000},{pressureTokens:NaN,contextWindow:1000}])assert.equal(a.contextUsage(value).contextPercent,null);
 const snapshot=a.snapshot({...input,contextProjection:{projectedTokens:4200,contextWindow:10000}});assert.equal(snapshot.contextPercent,42);assert.equal(snapshot.tokenUsage,170);assert.equal(snapshot.sessionName,'会话 A');
});

test('HUD lower label uses the same displayTitle as the native session header',()=>{assert.equal(a.snapshot({...input,summary:{title:'stored',displayTitle:'当前屏幕任务名'}}).sessionName,'当前屏幕任务名');});

const durable={type:'assistant/message',time:5000,data:{turn:2,step:0,usage:{outputTokens:900},stream:[{type:'chunk',time:2000,chunk:{type:'reasoning-delta',text:'x'}}]}};
test('native sessionStats keeps the host average during later steps, tools and partial history',()=>{
 const statsProjection={decodeTokens:3400,decodeMs:10000};
 for(const entries of [[],[start,step,durable,{type:'step/start',time:6000,data:{turn:2,step:1}}]]){const s=a.snapshot({...input,entries,statsProjection});assert.equal(s.tokensPerSecond,340);assert.equal(s.speedSource,'session-average');}
 assert.equal(a.snapshot({...input,statsProjection,connected:false}).tokensPerSecond,null);
 assert.equal(a.snapshot({...input,statsProjection:{decodeTokens:0,decodeMs:1000}}).tokensPerSecond,0);
 assert.equal(a.snapshot({...input,entries:[],statsProjection:undefined}).tokensPerSecond,null);
});
test('fallback retains the latest actual settlement across new steps and retry boundaries',()=>{
 const later={type:'step/start',time:6000,data:{turn:2,step:1}},retry={type:'llm/retry-started',time:7000,data:{turn:2,step:1}};
 assert.equal(a.snapshot({...input,entries:[start,step,durable,later,retry]}).tokensPerSecond,300);
 const unmeasured={type:'assistant/message',time:8000,data:{turn:2,step:1,usage:{outputTokens:600}}};
 assert.equal(a.snapshot({...input,entries:[start,step,durable,later,retry,unmeasured]}).tokensPerSecond,300);
 const measured={...unmeasured,data:{...unmeasured.data,stream:[{type:'text-chunks',time0:7000,texts:['','a'],dt:[500]}]}};
 assert.equal(a.snapshot({...input,entries:[start,step,durable,later,retry,measured]}).tokensPerSecond,1200);
});
test('durable compact stream timings work without ephemeral live-chunk or a loaded turn start',()=>{
 assert.equal(a.settledSpeed([durable]),300);
 assert.equal(a.firstStreamToken([{type:'reasoning-chunks',time0:1000,texts:['','b'],dt:[500]}]),1500);
 assert.equal(a.firstStreamToken([{type:'tool-call-chunks',time0:900,name:'read_file',args:[''],dt:[]}]),900);
 assert.equal(a.firstStreamToken([{type:'chunk',time:100,chunk:{type:'usage',usage:{outputTokens:900}}}]),null);
 assert.equal(a.firstStreamToken([{type:'text-chunks',time0:100,texts:['','x'],dt:[-2]}]),null);
 const attempt={type:'assistant/attempt',time:3000,data:{turn:2,step:0,stream:durable.data.stream}},settlement={...durable,data:{...durable.data,stream:[]}};
 assert.equal(a.settledSpeed([start,step,attempt,settlement]),300);
});
test('unavailable or invalid native speed degrades to measured data, never fabricated zeros',()=>{
 for(const statsProjection of [undefined,{}, {decodeTokens:10,decodeMs:0},{decodeTokens:-1,decodeMs:1000},{decodeTokens:Infinity,decodeMs:1000}]){const s=a.snapshot({...input,entries:[durable],statsProjection});assert.equal(s.tokensPerSecond,300);assert.equal(s.speedSource,'last-settled');}
 assert.equal(a.speedReading(undefined,[]).tokensPerSecond,null);
 assert.equal(a.speedReading(undefined,[{...durable,time:2000}]).tokensPerSecond,null);
});
