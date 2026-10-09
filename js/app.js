/* ===== app.js =====
   กล่องกรอกข้อมูล, ปุ่มทั้งหมด, ซิงก์คลาวด์, service worker
   ===================================================== */

/* ---------- MODALS ---------- */
const mask=$('mask'),modal=$('modal');
const open=h=>{modal.innerHTML=h;mask.classList.add('on')};
let SH_DAY=null;                       /* วันที่ของแผ่นสรุปวันที่เปิดค้างอยู่ */
let SH_WL=null;                        /* คิวที่กำลังจะถูกนัด */
let SH_VIS=null,SH_AFTER=null;         /* visit ที่ส่งต่อเข้าเคส / นัดที่จะเปิดต่อ */
const close=()=>{mask.classList.remove('on');modal.innerHTML='';SH_DAY=null;SH_WL=null;SH_VIS=null};
mask.addEventListener('click',e=>{if(e.target===mask)close()});

/* ---------- ปุ่มติ๊ก/เลือก ใช้ในฟอร์มเคส ---------- */
function pickG(name,opts,val,multi){
  const sel=multi?(Array.isArray(val)?val:[]):[val||''];
  return `<div class="pickg" data-g="${name}" data-multi="${multi?1:0}">`+opts.map(o=>{
    const[v,t]=Array.isArray(o)?o:[o,o];
    return `<button type="button" class="pk ${sel.includes(v)?'on':''}" data-pick="${esc(v)}">${esc(t)}</button>`}).join('')+`</div>`}
function pickVal(name){const g=modal.querySelector(`.pickg[data-g="${name}"]`);
  if(!g)return g===null?'':'';
  const on=[...g.querySelectorAll('.pk.on')].map(b=>b.dataset.pick);
  return g.dataset.multi==='1'?on:(on[0]||'')}
modal.addEventListener('click',e=>{const b=e.target.closest('.pk');if(!b)return;
  const g=b.closest('.pickg');if(!g)return;
  if(g.dataset.multi==='1'){b.classList.toggle('on');return}
  const was=b.classList.contains('on');
  g.querySelectorAll('.pk').forEach(x=>x.classList.remove('on'));
  if(!was)b.classList.add('on')});

/* ---------- คิวรอนัด / ต้องโทร ---------- */
function mWait(id,pre={}){
  const x=id?(DB.waitlist||[]).find(w=>w.id===id)
    :{id:'',kind:'invite',patientId:pre.p||'',proc:'',tooth:'',dur:30,prio:'normal',note:'',calls:[]};
  if(!x)return;
  if(!id&&x.patientId){const df=nextDefaults(x.patientId);x.proc=df.proc;x.tooth=df.tooth}
  const p=pt(x.patientId),ap=x.apptId?DB.appointments.find(a=>a.id===x.apptId):null;
  const row=(lbl,inner)=>`<div class="exrow"><span>${lbl}</span><div>${inner}</div></div>`;
  open(`<div class="mtitle">${id?'Edit queue item':'Add to queue'}</div>
   <div class="muted" style="margin-bottom:14px">${x.kind==='review'?`Case review due ${thDate(x.reviewFor)}`:x.kind==='resched'&&ap
     ?`Call to reschedule \u00b7 นัดเดิม ${thDate(ap.date)}${ap.time?' '+esc(ap.time):''}`
     :'Patients to call in when an afternoon slot opens'}</div>
   <div class="f ac-wrap"><label>Patient</label>
     <input id="cpq" autocomplete="off" placeholder="HN / name / phone" value="${p?esc((p.hn||'—')+' — '+p.name):''}" ${x.kind!=='invite'?'disabled':''}>
     <input type="hidden" id="cpid" value="${esc(x.patientId)}"><div class="ac-list" id="cplist"></div></div>
   <div class="g2"><div class="f"><label>Procedure</label><input id="wpr" list="procListW" value="${esc(x.proc)}" placeholder="e.g. Scaling, RCT #46 visit 2">
     <datalist id="procListW">${PROCS.map(v=>`<option>${v}</option>`).join('')}</datalist></div>
   <div class="f"><label>Area</label><input id="cto" value="${esc(x.tooth)}" placeholder="#36"></div></div>
   ${row('Minutes',pickG('wdur',['15','30','45','60','90'],String(x.dur||30)))}
   ${row('Priority',pickG('wpri',[['normal','Normal'],['urgent','Urgent']],x.prio||'normal'))}
   <div class="f" style="margin-top:6px"><label>Note</label><input id="wnt" value="${esc(x.note)}" placeholder="e.g. มาได้แต่บ่าย, โทรหลัง 12:00"></div>
   ${(x.calls||[]).length?`<div class="muted" style="font-size:11.5px;margin:-4px 0 10px">โทรแล้ว ${x.calls.length} ครั้ง: ${x.calls.map(c=>thDate(c.at)).join(', ')}</div>`:''}
   <div class="mfoot">${id?`<button class="btn dg" data-act="wlDrop" data-id="${id}">ไม่ต้องแล้ว</button>`:''}
   <button class="btn" data-act="close">Cancel</button>
   <button class="btn pri" data-act="wlSave" data-id="${id||''}">Save</button></div>`);
  if(x.kind==='invite')initCasePt(pp=>{const df=nextDefaults(pp.id);if(df.proc&&!$('wpr').value.trim())$('wpr').value=df.proc})}

/* กดช่องว่าง -> เสนอคนในคิวที่ใส่ช่องนี้ได้ */
function mFill(d,s0,e0){
  const len=e0-s0,k=dayKind(d),dt=parseD(d);
  const fit=wlWait().filter(x=>x.kind!=='resched'&&(+x.dur||30)<=len);
  const other=wlWait().filter(x=>x.kind!=='resched'&&(+x.dur||30)>len);
  const row=x=>{const p=pt(x.patientId);if(!p)return'';const ph=digits(p.phone);
    return `<div class="wq slim"><div style="min-width:0;flex:1">
      <div class="nm">${esc(p.name)}${x.prio==='urgent'?' <span class="wtag urg">ด่วน</span>':''}</div>
      <div class="hn">${esc(x.proc||'ไม่ระบุ')}${x.tooth?' \u00b7 ซี่ '+esc(x.tooth):''} \u00b7 ${x.dur||30} น.${x.note?' \u00b7 '+esc(x.note):''}</div></div>
      <div class="ac">${ph.length>=9?`<a class="btn sm" href="tel:${ph}">${SI('phone')}</a>`:''}
      <button class="btn sm pri" data-act="wlInto" data-id="${x.id}" data-d="${d}" data-s="${s0}" data-e="${e0}">นัดเข้าช่องนี้</button></div></div>`};
  open(`<div class="mtitle">เติมช่อง ${fmtMin(s0)}\u2013${fmtMin(e0)}</div>
   <div class="muted" style="margin-bottom:12px">${DOWF[dt.getDay()]} ${thDate(d)} \u00b7 ${esc(k.room||'')} \u00b7 ว่าง ${len} นาที</div>
   ${k.main?'':`<div class="warn">${SI('warn')} ${k.none?'วันนี้ยังไม่ได้ตั้งห้อง':'วันนี้ห้อง '+esc(k.room)+' \u2014 ไม่ใช่วันฟุ้ง'} เช็กก่อนนัด</div>`}
   <div class="sec" style="margin-top:4px">ใส่ช่องนี้ได้ \u00b7 ${fit.length}</div>
   ${fit.length?fit.map(row).join(''):'<div class="nempty">ไม่มีคนในคิวที่ใช้เวลาไม่เกิน '+len+' นาที</div>'}
   ${other.length?`<div class="sec">ใช้เวลานานกว่าช่องนี้ \u00b7 ${other.length}</div>`+other.map(row).join(''):''}
   <div class="mfoot"><button class="btn" data-act="close">ปิด</button>
   <button class="btn" data-act="wlAdd">\uff0b เข้าคิว</button>
   <button class="btn pri" data-act="fillOther" data-d="${d}" data-s="${s0}" data-e="${e0}">นัดคนอื่นเข้าช่องนี้</button></div>`)}

/* ---------- แผ่นสรุปรายวัน: เห็นคนไข้ก่อน แล้วค่อยเพิ่มนัด ---------- */
function mDay(d){
  SH_DAY=d;
  const ap=apptsOn(d),s=daySch(d),w=s?wt(s.typeId):null;
  const shown=SESSIONS.filter(se=>ap.some(a=>a.session===se.id));
  const live=liveOn(d).length;
  modal.innerHTML=`<div class="mtitle">${thDate(d)}${d===TODAY?' <span class="chip" style="border-color:var(--hl);color:var(--hl)">วันนี้</span>':''}</div>
   <div class="muted" style="margin-bottom:13px">${w?`<i class="rdot" style="background:${w.color};display:inline-block;width:8px;height:8px;border-radius:50%;vertical-align:1px"></i> ${esc(s.room||w.room)}`:'ยังไม่ได้ตั้งค่าห้อง'}${s&&s.note?' · '+esc(s.note):''} · ${live} คน</div>
   ${ap.length
     ?shown.map(se=>`<div class="dsec"><i class="sdot" style="background:${se.c}"></i>${se.name}</div>`
        +ap.filter(a=>a.session===se.id).map(ptRow).join('')).join('')
     :`<div class="empty" style="padding:26px">ยังไม่มีนัดของวันนี้</div>`}
   ${!isOff(d)&&gapsOn(d).length?`<div class="dgaps"><span>บ่ายยังว่าง</span>${gapChips(d)}</div>`:''}
   <div class="mfoot"><button class="btn" data-act="daySet" data-d="${d}">ตั้งค่าห้อง</button>
   <button class="btn" data-act="close">ปิด</button>
   ${isOff(d)?`<span class="offnote">${SI('ban')} วันหยุด \u2014 ลงนัดไม่ได้</span>`
     :`<button class="btn pri" data-act="addAppt" data-d="${d}">\uff0b เพิ่มนัด</button>`}</div>`;
  mask.classList.add('on')}

/* ---------- บันทึกเคสที่ต้องติดตาม (1 เคส = หลาย entry) ---------- */
const DX_PULP=['Normal pulp','Reversible pulpitis','Symptomatic irreversible pulpitis',
  'Asymptomatic irreversible pulpitis','Pulp necrosis','Previously treated','Previously initiated'];
const DX_APICAL=['Normal apical tissues','Symptomatic apical periodontitis','Asymptomatic apical periodontitis',
  'Acute apical abscess','Chronic apical abscess','Condensing osteitis'];
/* ขั้นตอน RCT: MI = Mechanical Instrumentation, TMC = Trying Main gutta-percha Cone */
const RCT_STEPS=[['Access','Access opening'],['WL','WL'],['MI','MI'],['Dressing','Dressing'],['TMC','TMC'],['Obturation','Obturation']];
const SYMPTOMS=['Asymptomatic','Provoked','Lingering','Spontaneous','Night pain','Swelling','Bite pain'];
function blankEnt(kind){return{id:uid('e_'),kind:kind||'tx',date:TODAY,sym:[],symNote:'',
  dxP:'',dxA:'',cold:'',ept:'',perc:'',palp:'',mob:'',pd:'',sinus:'',caries:[],
  expo:'',hemo:'',hemoMin:'',cap:'',liner:[],temp:'',fin:'',
  canals:[],irrig:[],med:'',interim:'',obt:'',obtTech:'',sealer:'',restPlan:[],restDone:'',note:''}}
function cnlRow(x){x=x||{n:'',ref:'',wl:'',maf:''};
  return `<div class="cnrow"><input class="xin" data-c="n" value="${esc(x.n)}" placeholder="MB">
    <input class="xin" data-c="ref" value="${esc(x.ref||'')}" placeholder="MB cusp">
    <input class="xin" data-c="wl" value="${esc(x.wl)}" placeholder="20.5 mm">
    <input class="xin" data-c="maf" value="${esc(x.maf)}" placeholder="30/.04">
    <button type="button" class="pk xdel" data-act="cnlDel" aria-label="ลบ canal">${IC.x}</button></div>`}

/* id = เคส, eid = entry (ไม่ใส่ = สร้างเคสใหม่) */
function mCase(cid,eid,pre={}){
  const isNew=!cid;
  const c=cid?DB.cases.find(x=>x.id===cid)
    :{id:'',patientId:pre.p||'',tooth:pre.tooth||'',type:'vpt',status:'watch',review:'',entries:[]};
  if(!c)return;
  const e=eid?(c.entries||[]).find(x=>x.id===eid):blankEnt(pre.kind||(isNew?'tx':'fu'));
  if(!e)return;
  if(!eid){if(pre.date)e.date=pre.date;if(pre.note)e.note=pre.note}
  SH_VIS=pre.visitId||null;
  const p=pt(c.patientId);
  const row=(lbl,inner)=>`<div class="exrow"><span>${lbl}</span><div>${inner}</div></div>`;
  const title=isNew?'New case':(eid?'Edit entry':'New entry');
  open(`<div class="mtitle">${title}</div>
   <div class="muted" style="margin-bottom:14px">${isNew?'Follow-up log for a case worth watching'
     :`${esc(p?p.name:'')}${c.tooth?' \u00b7 #'+esc(c.tooth):''} \u00b7 ${esc(CASE_TPL[c.type]||'')}`}</div>
   ${isNew?`<div class="f ac-wrap"><label>Patient</label>
     <input id="cpq" autocomplete="off" placeholder="HN / name / phone" value="${p?esc((p.hn||'—')+' — '+p.name):''}">
     <input type="hidden" id="cpid" value="${esc(c.patientId)}"><div class="ac-list" id="cplist"></div></div>
   <div class="g3 tight"><div class="f"><label>Tooth</label><input id="cto" value="${esc(c.tooth)}" placeholder="36"></div>
   <div class="f"><label>Date</label><input type="date" id="cdt" value="${e.date||TODAY}"></div>
   <div class="f"><label>Template</label><select id="ctp">${Object.entries(CASE_TPL).map(([k,t])=>`<option value="${k}" ${c.type===k?'selected':''}>${t}</option>`).join('')}</select></div></div>`
   :`<input type="hidden" id="cpid" value="${esc(c.patientId)}">
     <input type="hidden" id="cto" value="${esc(c.tooth)}">
     <input type="hidden" id="ctp" value="${esc(c.type)}">
     <div class="g2"><div class="f"><label>Date</label><input type="date" id="cdt" value="${e.date||TODAY}"></div>
     <div class="f"><label>Visit</label><div style="padding-top:3px">${pickG('kind',[['tx','Treatment'],['fu','Follow-up']],e.kind||'fu')}</div></div></div>`}

   <div id="dxBlk" style="display:${c.type==='rct'?'block':'none'}">
     <div class="sec">Diagnosis (AAE)</div>
     ${row('Pulpal',pickG('dxP',DX_PULP,e.dxP))}
     ${row('Apical',pickG('dxA',DX_APICAL,e.dxA))}
   </div>

   <div class="sec">Symptom</div>
   ${pickG('sym',SYMPTOMS,e.sym,true)}
   <div class="f" style="margin-top:9px"><label>Symptom note</label><input id="csn" value="${esc(e.symNote)}" placeholder="e.g. cold-provoked, settles in 5 s"></div>

   <div id="exBlk" style="display:${c.type==='gen'?'none':'block'}">
     <div class="sec">Examination (I/O)</div>
     <div id="pulpTest" style="display:${c.type==='rct'?'block':'none'}">
       ${row('Cold',pickG('cold',[['+','+ve'],['-','\u2212ve'],['L','Lingering']],e.cold))}
       ${row('EPT',`<input id="cept" class="xin" value="${esc(e.ept)}" placeholder="e.g. 32">`)}
     </div>
     ${row('Percussion',pickG('perc',[['+','+ve'],['-','\u2212ve']],e.perc))}
     ${row('Palpation',pickG('palp',[['+','+ve'],['-','\u2212ve']],e.palp))}
     ${row('Mobility',pickG('mob',['0','I','II','III'],e.mob))}
     ${row('PD',`<input id="cpd" class="xin" value="${esc(e.pd)}" placeholder="WNL / 4 mm">`)}
     ${row('Sinus tract',pickG('sinus',['Yes','No'],e.sinus))}
     ${row('Caries surface',pickG('caries',['O','M','D','B','L'],e.caries,true))}
   </div>

   <div id="vptBlk" style="display:${c.type==='vpt'?'block':'none'}">
     <div class="sec">Pulp exposure</div>
     ${row('Exposure',pickG('expo',['None','Pinpoint','<1 mm','>1 mm'],e.expo))}
     ${row('Haemostasis',pickG('hemo',['Achieved','Not achieved'],e.hemo)
        +`<input id="chm" class="xin sm" type="number" min="0" step="1" value="${esc(e.hemoMin)}" placeholder="min">`)}
     <div class="sec">Materials</div>
     ${row('Pulp cap',pickG('cap',['Dycal','Ca(OH)\u2082','MTA','Biodentine'],e.cap))}
   </div>

   <div id="rctBlk" style="display:${c.type==='rct'?'block':'none'}">
     <div class="sec">This visit</div>
     ${row('Steps done',pickG('steps',RCT_STEPS,(e.steps&&e.steps.length)?e.steps:(e.obt==='Done'?['Obturation']:[]),true))}
     <div class="sec">Canals</div>
     <div class="cnhead"><span>Canal</span><span>Ref cusp / point</span><span>Working length</span><span>MAF</span><span></span></div>
     <div id="cnl">${(e.canals&&e.canals.length?e.canals:[{n:'',ref:'',wl:'',maf:''}]).map(cnlRow).join('')}</div>
     <button type="button" class="qbtn" data-act="cnlAdd" style="margin:6px 0 12px">\uff0b canal</button>
     ${row('Irrigation',pickG('irrig',['NaOCl','EDTA','CHX','Saline'],e.irrig,true))}
     ${row('Medicament',pickG('med',['Ca(OH)\u2082','Ledermix','CHX','None'],e.med))}
     <div class="sec">Obturation</div>
     ${row('Technique',pickG('obtTech',['Lateral','Single cone','Warm vertical'],e.obtTech))}
     ${row('Sealer',`<input id="cslr" class="xin" value="${esc(e.sealer)}" placeholder="e.g. AH Plus">`)}
   </div>

   <div id="restBlk" style="display:${c.type==='gen'?'none':'block'}">
     <div class="sec">Restoration</div>
     ${row('Interim',pickG('interim',['Cavit','IRM','GIC','None'],e.interim))}
     ${row('Liner / base',pickG('liner',['Vitrebond','GIC','None'],e.liner,true))}
     <div id="vptRest" style="display:${c.type==='vpt'?'block':'none'}">
       ${row('Temporary',pickG('temp',['Cavit','IRM','None'],e.temp))}
       ${row('Final',pickG('fin',['Bulkfill','Composite','Flowable','None'],e.fin))}
     </div>
     <div id="rctRest" style="display:${c.type==='rct'?'block':'none'}">
       ${row('Final plan',pickG('restPlan',['Composite','Onlay','Crown','Post & core'],e.restPlan,true))}
       ${row('Final done',pickG('restDone',['Not yet','Done'],e.restDone))}
     </div>
   </div>

   <div class="sec">Follow-up</div>
   <div class="g2"><div class="f"><label>Next review</label><input type="date" id="crv" value="${esc(c.review)}"></div>
   <div class="f"><label>Case status</label><select id="cst">
     <option value="watch" ${(c.status||'watch')==='watch'?'selected':''}>Watching</option>
     <option value="done" ${c.status==='done'?'selected':''}>Closed</option></select></div></div>
   <div class="quick">Review in:${[['1 wk',7],['1 mo',30],['3 mo',90],['6 mo',180],['1 y',365]]
     .map(([t,k])=>`<button type="button" class="qbtn" data-act="rvplus" data-n="${k}">+${t}</button>`).join('')}</div>
   <div class="f"><label>Note / outcome</label><textarea id="cnt" rows="3">${esc(e.note)}</textarea></div>
   <div class="mfoot">${eid&&(c.entries||[]).length>1?`<button class="btn dg" data-act="delEnt" data-id="${cid}" data-e="${eid}">ลบครั้งนี้</button>`:''}
   <button class="btn" data-act="close">Cancel</button>
   <button class="btn pri" data-act="saveCase" data-id="${cid||''}" data-e="${eid||''}">Save</button></div>`);
  const tpl=$('ctp');
  if(tpl&&tpl.tagName==='SELECT')tpl.addEventListener('change',ev=>{
    const v=ev.target.value;
    $('dxBlk').style.display=v==='rct'?'block':'none';
    $('exBlk').style.display=v==='gen'?'none':'block';
    $('pulpTest').style.display=v==='rct'?'block':'none';
    $('vptBlk').style.display=v==='vpt'?'block':'none';
    $('rctBlk').style.display=v==='rct'?'block':'none';
    $('restBlk').style.display=v==='gen'?'none':'block';
    $('vptRest').style.display=v==='vpt'?'block':'none';
    $('rctRest').style.display=v==='rct'?'block':'none'});
  if(isNew)initCasePt()}

/* อ่านค่าทั้งหมดจากฟอร์มเป็น entry เดียว */
function readEnt(id,kind){
  const v=k=>{const el=$(k);return el?el.value.trim():''};
  const canals=[...(($('cnl')||{querySelectorAll:()=>[]}).querySelectorAll('.cnrow'))]
    .map(r=>({n:r.querySelector('[data-c=n]').value.trim(),
              ref:r.querySelector('[data-c=ref]').value.trim(),
              wl:r.querySelector('[data-c=wl]').value.trim(),
              maf:r.querySelector('[data-c=maf]').value.trim()}))
    .filter(x=>x.n||x.ref||x.wl||x.maf);
  const steps=pickVal('steps')||[];
  return{id:id||uid('e_'),kind:kind||pickVal('kind')||'tx',date:v('cdt')||TODAY,
    sym:pickVal('sym'),symNote:v('csn'),
    dxP:pickVal('dxP'),dxA:pickVal('dxA'),cold:pickVal('cold'),ept:v('cept'),
    perc:pickVal('perc'),palp:pickVal('palp'),mob:pickVal('mob'),pd:v('cpd'),sinus:pickVal('sinus'),
    caries:pickVal('caries'),
    expo:pickVal('expo'),hemo:pickVal('hemo'),hemoMin:v('chm'),cap:pickVal('cap'),
    canals,irrig:pickVal('irrig'),med:pickVal('med'),
    steps,obt:steps.includes('Obturation')?'Done':'',obtTech:pickVal('obtTech'),sealer:v('cslr'),
    interim:pickVal('interim'),liner:pickVal('liner'),temp:pickVal('temp'),fin:pickVal('fin'),
    restPlan:pickVal('restPlan'),restDone:pickVal('restDone'),note:v('cnt')}}
function initCasePt(onPick){
  const inp=$('cpq'),box=$('cplist'),hid=$('cpid');
  const draw=()=>{const q=inp.value.trim().toLowerCase();
    const list=DB.patients.filter(x=>!q||((x.hn||'')+' '+x.name+' '+(x.phone||'')+' '+digits(x.phone)).toLowerCase().includes(q)).slice(0,10);
    box.innerHTML=list.length?list.map(x=>`<div class="opt" data-p="${x.id}">
      <div style="min-width:0"><b>${esc(x.name)}</b><small>${esc(x.hn||'No HN')} · ${esc(x.cat||'')}</small></div></div>`).join('')
      :`<div class="opt dis">No match</div>`;
    box.style.display='block'};
  inp.addEventListener('input',()=>{hid.value='';draw()});
  inp.addEventListener('focus',draw);
  box.addEventListener('mousedown',e=>{const o=e.target.closest('.opt');if(!o||!o.dataset.p)return;e.preventDefault();
    const x=pt(o.dataset.p);hid.value=x.id;inp.value=(x.hn||'—')+' — '+x.name;box.style.display='none';
    const lv=lastVisit(x.id);if(lv&&lv.tooth&&!$('cto').value.trim())$('cto').value=lv.tooth;
    if(onPick)onPick(x)});
  document.addEventListener('mousedown',e=>{if(box&&!e.target.closest('.ac-wrap'))box.style.display='none'})}

function mDaySet(d){const c=daySch(d);
  open(`<div class="mtitle">ตั้งค่าห้อง · ${thDate(d)}</div>
   <div class="muted" style="margin-bottom:14px">หนึ่งวันเลือกได้ <b>ห้องเดียว</b></div>
   <div class="pick" id="wtPick">${DB.workTypes.map(w=>`<label class="${c&&c.typeId===w.id?'on':''}">
     <input type="radio" name="wtr" value="${w.id}" ${c&&c.typeId===w.id?'checked':''}><i class="sq" style="background:${w.color}"></i>${esc(w.name)}</label>`).join('')}</div>
   <div class="g2" style="margin-top:16px"><div class="f"><label>ชื่อห้องที่แสดง</label><input id="rm" value="${esc(c?c.room:'')}"></div>
   <div class="f"><label>โน้ตประจำวัน</label><input id="dn" value="${esc(c?c.note:'')}"></div></div>
   <div class="row sp"><button class="btn dg" data-act="clearDay" data-d="${d}">ล้างการตั้งค่า</button>
   <div class="row"><button class="btn" data-act="close">ยกเลิก</button>
   <button class="btn pri" data-act="saveDay" data-d="${d}">บันทึก</button></div></div>`);
  $('wtPick').addEventListener('change',e=>{document.querySelectorAll('#wtPick label').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));
    const w=wt(e.target.value),r=$('rm');if(!r.value.trim())r.value=w.room})}
/* visit ล่าสุดของคนไข้ ใช้ตั้งค่าเริ่มต้นให้นัดครั้งถัดไป */
function lastVisit(pid){
  return DB.visits.filter(v=>v.patientId===pid)
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]||null}
function nextDefaults(pid){const v=lastVisit(pid);
  return v?{proc:(v.tx||v.proc||'').trim(),tooth:(v.tooth||'').trim()}:{proc:'',tooth:''}}
function mAppt(id,pre={}){
  const a=id?DB.appointments.find(x=>x.id===id):{id:'',patientId:pre.p||'',date:pre.d||TODAY,session:pre.s||'pm',
    typeId:'',room:'',proc:'',tooth:'',time:pre.t||'',duration:pre.dur||30,status:'scheduled',note:''};
  if(!id&&a.patientId){const df=nextDefaults(a.patientId);
    a.proc=pre.proc!==undefined?pre.proc:df.proc;
    a.tooth=pre.tooth!==undefined?pre.tooth:df.tooth}
  const s=daySch(a.date),w=s?wt(s.typeId):null,cp=pt(a.patientId);
  open(`<div class="mtitle">${id?'Edit appointment':'New appointment'}</div>
   <div class="muted" style="margin-bottom:14px">Search by HN / name / phone</div>
   <div class="f ac-wrap"><label>Patient</label>
     <input id="fpq" autocomplete="off" placeholder="e.g. 385129, ติ๋ม, 0851234567" value="${cp?esc((cp.hn||'—')+' — '+cp.name):''}">
     <input type="hidden" id="fpid" value="${a.patientId}"><div class="ac-list" id="fplist"></div>
     <div id="fpmsg" class="muted" style="font-size:11.5px;margin-top:5px"></div></div>
   <div id="np" style="display:none;border:1px dashed var(--line);border-radius:var(--r);padding:12px;margin-bottom:12px">
     <div class="g2m"><div class="f"><label>HN</label><input id="nhn"></div>
     <div class="f"><label>Phone</label><input id="nph"></div></div>
     <div class="f"><label>Full name</label><input id="nnm"></div>
     <div class="g2m"><div class="f"><label>Sex</label><select id="nsx"><option></option><option>ช</option><option>ญ</option></select></div>
     <div class="f"><label>Case type</label><select id="ncat">${(DB.categories||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select></div></div>
     <div id="nwarn"></div></div>
   <div class="g2m"><div class="f"><label>Date</label><input type="date" id="fd" value="${a.date}"></div>
   <div class="f"><label>Time</label><input type="time" id="ftm" value="${a.time||''}"></div></div>
   <div class="quick">Next:${[['1 wk',7],['2 wk',14],['1 mo',30],['3 mo',90],['6 mo',180]]
     .map(([t,n])=>`<button type="button" class="qbtn" data-act="dplus" data-n="${n}">+${t}</button>`).join('')}</div>
   <div class="g2m"><div class="f"><label>Room</label><select id="ft">${DB.workTypes.map(x=>`<option value="${x.id}" ${(s?s.typeId:a.typeId)===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
   <div class="f"><label>Minutes</label><input type="number" id="fdu" step="15" value="${a.duration||30}"></div></div>
   <div id="ftwarn" class="muted" style="font-size:11.5px;margin:-6px 0 10px"></div>
   <div class="g2m"><div class="f"><label>Area</label><input id="fto" value="${esc(a.tooth)}" placeholder="#36"></div>
   <div class="f"><label>Status</label><select id="fst">
     ${[['scheduled','Scheduled'],['done','Done'],['cancelled','Cancelled'],['noshow','No show']].map(([v,t])=>`<option value="${v}" ${a.status===v?'selected':''}>${t}</option>`).join('')}</select></div></div>
   <div class="f"><label>Procedure — next visit</label>
     <input id="fpr" list="procList" value="${esc(a.proc)}" placeholder="e.g. Insert UTP, F/U 3 mo, Recheck RPD">
     <datalist id="procList">${PROCS.map(x=>`<option>${x}</option>`).join('')}</datalist></div>
   <div class="f"><label>Note</label><input id="fnt" value="${esc(a.note)}"></div>
   <div class="mfoot"><button class="btn" data-act="close">Cancel</button>
   ${id?`<button class="btn" data-act="checkin" data-id="${id}">Check in — record treatment</button>`:''}
   <button class="btn pri" data-act="saveAppt" data-id="${id||''}">Save</button></div>`);
  initPtSearch(id);
  SH_APPT=id||null;SH_WL=pre.wl||null;
  $('fd').addEventListener('change',e=>{const n=daySch(e.target.value);if(n)$('ft').value=n.typeId;checkDup()});
  ['ftm','fdu'].forEach(k=>{const el=$(k);if(el)el.addEventListener('input',checkClash)});
  checkClash()}
function initPtSearch(editId){
  const inp=$('fpq'),box=$('fplist'),hid=$('fpid');
  const draw=()=>{const q=inp.value.trim().toLowerCase(),date=$('fd').value,busy=busyOn(date,editId);
    const list=DB.patients.filter(p=>!q||((p.hn||'')+' '+p.name+' '+(p.phone||'')+' '+digits(p.phone)).toLowerCase().includes(q)).slice(0,10);
    box.innerHTML=list.map(p=>{const b=busy.has(p.id);
      return `<div class="opt ${b?'dis':''}" data-p="${p.id}" data-b="${b?1:0}">
      <div style="min-width:0"><b>${esc(p.name)}</b><small>${esc(p.hn||'No HN')} · ${esc(p.phone||'-')} · ${esc(p.cat||'')}</small></div>
      ${b?'<span class="tag">Booked</span>':''}</div>`}).join('')
      +`<div class="opt new" data-p="__new">＋ New patient${q?' “'+esc(inp.value.trim())+'”':''}</div>`;
    box.style.display='block'};
  inp.addEventListener('input',()=>{hid.value='';$('np').style.display='none';draw();checkDup()});
  inp.addEventListener('focus',draw);
  box.addEventListener('mousedown',e=>{const o=e.target.closest('.opt');if(!o)return;e.preventDefault();
    if(o.dataset.p==='__new'){hid.value='__new';$('np').style.display='block';box.style.display='none';
      const raw=inp.value.trim();
      if(/^\d{4,}$/.test(raw))$('nhn').value=raw;else if(/^0\d[\d\-\s]*$/.test(raw))$('nph').value=raw;else $('nnm').value=raw;
      inp.value='＋ New patient';checkNewDup();return}
    if(o.dataset.b==='1'){alert('This patient already has an appointment on that date.');return}
    const p=pt(o.dataset.p);hid.value=p.id;inp.value=(p.hn||'—')+' — '+p.name;box.style.display='none';$('np').style.display='none';
    if(!editId){const df=nextDefaults(p.id);
      if(df.proc&&!$('fpr').value.trim())$('fpr').value=df.proc;
      if(df.tooth&&!$('fto').value.trim())$('fto').value=df.tooth}
    checkDup()});
  document.addEventListener('mousedown',e=>{if(!e.target.closest('.ac-wrap')&&box)box.style.display='none'});
  ['nhn','nph','nnm'].forEach(k=>$(k).addEventListener('input',checkNewDup));checkDup()}
const toMin=t=>{const[h,m]=(t||'').split(':').map(Number);return h*60+(m||0)};
const fmtMin=v=>`${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
/* คืนนัดที่เวลาทับกัน (วันเดียวกัน = ห้องเดียวกันอยู่แล้ว) */
function clashAt(date,time,dur,exceptId){
  if(!time)return null;
  const s1=toMin(time),e1=s1+(+dur||30);
  return DB.appointments.find(a=>{
    if(a.date!==date||a.id===exceptId||a.status==='cancelled'||!a.time)return false;
    const s2=toMin(a.time),e2=s2+(+a.duration||30);
    return s1<e2&&s2<e1});
}
function clashMsg(c){const p=pt(c.patientId);
  return `${p?p.name:'another appointment'} ${c.time}–${fmtMin(toMin(c.time)+(+c.duration||30))}`}
function checkClash(){const box=$('ftwarn');if(!box)return;
  const c=clashAt($('fd').value,$('ftm').value,$('fdu').value,SH_APPT);
  const off=isOff($('fd').value);
  box.innerHTML=(off?`<span style="color:var(--dng);font-weight:700">${SI('ban')} OFF day \u2014 cannot book</span> `:'')
    +(c?`<span style="color:var(--wrn);font-weight:700">${SI('warn')} Overlaps ${esc(clashMsg(c))}</span>`:'')}
let SH_APPT=null;
function checkDup(){const hid=$('fpid'),msg=$('fpmsg');if(!hid||!msg)return;
  checkClash();
  if(!hid.value||hid.value==='__new'){msg.textContent='';return}
  const date=$('fd').value,ex=DB.appointments.find(a=>a.patientId===hid.value&&a.date===date&&a.status!=='cancelled');
  msg.innerHTML=ex?`<span style="color:var(--dng);font-weight:700">${SI('warn')} Already booked on ${thDate(date)} (${ex.time||SESSIONS.find(s=>s.id===ex.session).name})</span>`:''}
function checkNewDup(){const w=$('nwarn');if(!w)return;
  const hn=$('nhn').value.trim().toLowerCase(),ph=digits($('nph').value);
  const d=(hn&&DB.patients.find(p=>(p.hn||'').trim().toLowerCase()===hn))||(ph.length>=9&&DB.patients.find(p=>digits(p.phone)===ph));
  w.innerHTML=d?`<div class="warn">${SI('warn')} Patient already exists: <b>${esc(d.hn)} — ${esc(d.name)}</b><br>
    <button class="btn sm" style="margin-top:6px" data-act="usePt" data-id="${d.id}">Use this patient</button></div>`:''}
function mPatient(id){const p=id?pt(id):{id:'',hn:'',name:'',age:'',sex:'',phone:'',cat:'อื่นๆ',tags:[],note:''};
  open(`<div class="mtitle">${id?'แก้ไขข้อมูลคนไข้':'เพิ่มคนไข้ใหม่'}</div><div style="height:12px"></div>
   <div class="g2"><div class="f"><label>HN</label><input id="phn" value="${esc(p.hn)}"></div>
   <div class="f"><label>ชื่อ-สกุล</label><input id="pnm" value="${esc(p.name)}"></div></div>
   <div class="g3"><div class="f"><label>อายุ</label><input id="pag" type="number" value="${p.age||''}"></div>
   <div class="f"><label>เพศ</label><select id="psx"><option></option><option ${p.sex==='ช'?'selected':''}>ช</option><option ${p.sex==='ญ'?'selected':''}>ญ</option></select></div>
   <div class="f"><label>เบอร์โทร</label><input id="pph" value="${esc(p.phone)}"></div></div>
   <div class="f"><label>ประเภทเคส</label><select id="pcat">${(DB.categories||[]).map(c=>`<option ${p.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
   <div class="f"><label>โรคประจำตัว / แพ้ยา (คั่นด้วย ,)</label><input id="ptg" value="${esc((p.tags||[]).join(', '))}"></div>
   <div class="f"><label>หมายเหตุทางคลินิก</label><textarea id="pnt" rows="3">${esc(p.note)}</textarea></div>
   <div class="row sp"><button class="btn" data-act="close">ยกเลิก</button>
   <button class="btn pri" data-act="savePatient" data-id="${id||''}">บันทึก</button></div>`)}
/* เคสที่ติดตามอยู่ของคนไข้คนนี้ -> ปุ่มเลือกให้บันทึกนี้ต่อเข้าเคส */
const normT=t=>(t||'').toString().replace(/^#/,'').trim();
function visitCaseHTML(v){
  const linked=DB.cases.find(c=>(c.entries||[]).some(e=>e.visitId===v.id));
  if(linked)return `<div class="vlink">${SI('note')} บันทึกนี้อยู่ในเคส ${esc(CASE_TPL[linked.type]||'')}${linked.tooth?' #'+esc(linked.tooth):''} แล้ว</div>`;
  const oc=DB.cases.filter(c=>c.patientId===v.patientId&&(c.status||'watch')==='watch');
  const hit=oc.find(c=>normT(c.tooth)&&normT(c.tooth)===normT(v.tooth));
  return `<div class="sec">Case notes</div>
   ${pickG('vcase',[...oc.map(c=>[c.id,`ต่อในเคส ${CASE_TPL[c.type]||''}${c.tooth?' #'+c.tooth:''}`]),['__new','\uff0b เปิดเคสใหม่']],hit?hit.id:'')}
   <div class="muted" style="font-size:11px;margin:6px 0 10px">${oc.length?(hit?'เลือกเคสที่ซี่ตรงกันไว้ให้แล้ว \u2014 ':'')+'กดบันทึกแล้วจะเปิดหน้าติ๊กรายละเอียดของเคสต่อ':'เคสน่าสนใจ? เปิดเคสใหม่จากบันทึกนี้ได้เลย'}</div>`}
/* บันทึก visit แล้วส่งต่อเข้าเคสที่เลือก (คืน true ถ้าเปิดหน้าเคส) */
function visitToCase(v,sel,next){
  if(!sel)return false;
  const note=[v.proc,v.dx&&('Dx: '+v.dx),v.tx&&('Plan: '+v.tx),v.note].filter(x=>x&&x.trim()).join(' \u00b7 ');
  if(sel==='__new')mCase(null,null,{p:v.patientId,tooth:normT(v.tooth),date:v.date,note,visitId:v.id});
  else mCase(sel,null,{date:v.date,note,visitId:v.id,kind:'tx'});
  SH_AFTER=next||null;
  return true}
function mVisit(id){const v=DB.visits.find(x=>x.id===id),p=pt(v.patientId);
  open(`<div class="mtitle">บันทึกการรักษา</div>
   <div class="muted" style="margin-bottom:13px">${esc(p.hn||'—')} — ${esc(p.name)} · ${thDate(v.date)}</div>
   ${(p.tags||[]).length?`<div class="warn">${SI('warn')} ${esc(p.tags.join(' · '))}</div>`:''}
   <div class="g2"><div class="f"><label>หัตถการ</label><input id="vpr" list="procList2" value="${esc(v.proc)}">
     <datalist id="procList2">${PROCS.map(x=>`<option>${x}</option>`).join('')}</datalist></div>
   <div class="f"><label>ซี่ฟัน</label><input id="vto" value="${esc(v.tooth)}"></div></div>
   <div class="f"><label>Diagnosis</label><input id="vd" value="${esc(v.dx)}"></div>
   <div class="f"><label>แผนการรักษา / สิ่งที่ต้องทำครั้งหน้า</label><input id="vt" value="${esc(v.tx)}"></div>
   <div class="f"><label>บันทึกเพิ่มเติม</label><textarea id="vn" rows="4">${esc(v.note)}</textarea></div>
   ${visitCaseHTML(v)}
   <div class="mfoot"><button class="btn dg" data-act="delVisit" data-id="${id}">ลบบันทึก</button>
   <button class="btn" data-act="saveVisit" data-id="${id}">บันทึก</button>
   <button class="btn pri" data-act="saveVisitNext" data-id="${id}">บันทึก + นัดต่อ →</button></div>`)}

/* ---------- ACTIONS ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  if(!t){if(!e.target.closest('#tpanel'))$('tpanel').classList.remove('on');
    if(!e.target.closest('#npanel'))$('npanel').classList.remove('on');return}
  const a=t.dataset.act,id=t.dataset.id,d=t.dataset.d,P=S.plan;
  if(!['themeBtn','setTheme','export','import','logout'].includes(a))$('tpanel').classList.remove('on');
  if(a!=='bell')$('npanel').classList.remove('on');
  switch(a){
    case'setTheme':applyTheme(id);save();render();break;
    case'export':{const b=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
      const u=URL.createObjectURL(b),el=document.createElement('a');
      el.href=u;el.download=`dental-tracker-${TODAY}.json`;el.click();URL.revokeObjectURL(u);break}
    case'import':$('fileIn').click();break;
    case'restoreBk':if(confirm('กู้คืนข้อมูลกลับไปเป็นสแนปช็อตนี้?'))restoreBackup(id);break;
    case'logout':if(SYNC.sb&&confirm('ออกจากระบบ? ข้อมูลที่ซิงก์แล้วจะยังอยู่บนคลาวด์'))SYNC.sb.auth.signOut().then(()=>location.reload());break;
    case'login':loginUI();break;
    case'nav':{const v=t.dataset.v;
      if(v==='upcoming'){S.view='schedule';S.mode='up'}else S.view=v;
      location.hash=v;render();window.scrollTo(0,0);break}
    case'mode':S.mode=t.dataset.m;render();break;
    case'sub':S.sub=t.dataset.s;render();window.scrollTo(0,0);break;
    case'psub':S.psub=t.dataset.s;render();window.scrollTo(0,0);break;
    case'srange':S.srange=+t.dataset.n;render();break;
    case'goPlan':$('npanel').classList.remove('on');S.view='planner';S.psub='slots';render();window.scrollTo(0,0);break;
    case'fillGap':mFill(d,+t.dataset.s,+t.dataset.e);break;
    case'fillOther':{const s0=+t.dataset.s,e0=+t.dataset.e;
      mAppt(null,{d,t:fmtMin(s0),dur:Math.min(30,e0-s0)});break}
    case'wlAdd':mWait(null,{p:t.dataset.p});break;
    case'wlEdit':mWait(id);break;
    case'wlSave':{const pid=$('cpid').value;if(!pid){alert('Please select a patient first.');return}
      const o={patientId:pid,proc:$('wpr').value.trim(),tooth:$('cto').value.trim().replace(/^#/,''),
        dur:+pickVal('wdur')||30,prio:pickVal('wpri')||'normal',note:$('wnt').value.trim()};
      if(id)Object.assign(DB.waitlist.find(x=>x.id===id),o);
      else{if(DB.waitlist.some(x=>x.status==='wait'&&x.kind==='invite'&&x.patientId===pid)
          &&!confirm('คนไข้รายนี้อยู่ในคิวแล้ว \u2014 เพิ่มซ้ำ?'))return;
        DB.waitlist.push({id:uid('w_'),kind:'invite',status:'wait',calls:[],created:TODAY,...o})}
      save();close();render();break}
    case'wlDrop':{const x=DB.waitlist.find(w=>w.id===id);if(x){x.status='drop';x.doneAt=TODAY;save()}close();render();break}
    case'wlMiss':{const x=DB.waitlist.find(w=>w.id===id);if(!x)break;
      (x.calls=x.calls||[]).push({at:TODAY,res:'miss'});save();render();break}
    case'wlResched':{const a=DB.appointments.find(x=>x.id===id);if(!a)break;
      if(!DB.waitlist.some(w=>w.kind==='resched'&&w.apptId===id&&w.status==='wait'))
        DB.waitlist.push({id:uid('w_'),kind:'resched',status:'wait',patientId:a.patientId,apptId:id,
          proc:a.proc||'',tooth:a.tooth||'',dur:+a.duration||30,prio:'normal',note:$('rsr')?$('rsr').value.trim():'',calls:[],created:TODAY});
      save();close();render();break}
    case'wlBook':{const x=DB.waitlist.find(w=>w.id===id);if(!x)break;
      if(x.kind==='resched'){if(x.apptId&&DB.appointments.some(a=>a.id===x.apptId)){mResched(x.apptId);break}
        x.status='done';save();render();break}
      const f=firstFit(+x.dur||30);
      mAppt(null,{p:x.patientId,proc:x.proc,tooth:x.tooth,dur:+x.dur||30,wl:x.id,d:f?f.d:TODAY,t:f?f.t:''});break}
    case'wlInto':{const x=DB.waitlist.find(w=>w.id===id);if(!x)break;
      const s0=+t.dataset.s,e0=+t.dataset.e;
      mAppt(null,{p:x.patientId,proc:x.proc,tooth:x.tooth,d,t:fmtMin(s0),dur:Math.min(+x.dur||30,e0-s0),wl:x.id});break}
    case'bell':{const pn=$('npanel'),on=pn.classList.contains('on');
      $('tpanel').classList.remove('on');
      if(on){pn.classList.remove('on')}else{renderNoti();pn.classList.add('on')}break}
    case'goDay':$('npanel').classList.remove('on');mDay(d);break;
    case'goCase':{$('npanel').classList.remove('on');S.view='more';S.sub='cases';S.cfilter='watch';
      render();window.scrollTo(0,0);
      setTimeout(()=>{const el=document.querySelector('.ccard.due');el&&el.scrollIntoView({behavior:'smooth',block:'center'})},90);break}
    case'day':mDay(d);break;
    case'caseFilt':S.cfilter=t.dataset.f;render();break;
    case'addCase':mCase(null,null,{p:t.dataset.p,tooth:t.dataset.tooth});break;
    case'addEnt':mCase(id,null);break;
    case'editEnt':mCase(id,t.dataset.e);break;
    case'editCase':mCase(id,((DB.cases.find(x=>x.id===id)||{}).entries||[])[0]?.id);break;
    case'cnlAdd':{const box=$('cnl');if(box)box.insertAdjacentHTML('beforeend',cnlRow());break}
    case'cnlDel':{const r=t.closest('.cnrow'),box=$('cnl');
      if(r&&box&&box.querySelectorAll('.cnrow').length>1)r.remove();
      else if(r)r.querySelectorAll('input').forEach(i=>i.value='');break}
    case'delEnt':{const c=DB.cases.find(x=>x.id===id);if(!c)break;
      if(c.entries.length<2){alert('เคสต้องมีอย่างน้อย 1 บันทึก');break}
      if(!confirm('ลบบันทึกครั้งนี้?'))break;
      c.entries=c.entries.filter(x=>x.id!==t.dataset.e);save();close();render();break}
    case'rvplus':{const f=$('crv');if(!f)break;const b=f.value?parseD(f.value):new Date();
      b.setDate(b.getDate()+ +t.dataset.n);f.value=iso(b);break}
    case'caseDone':{const c=DB.cases.find(x=>x.id===id);if(c){c.status='done';save();render()}break}
    case'caseOpen':{const c=DB.cases.find(x=>x.id===id);if(c){c.status='watch';save();render()}break}
    case'delCase':if(confirm('ลบบันทึกเคสนี้?')){DB.cases=DB.cases.filter(x=>x.id!==id);save();close();render()}break;
    case'saveCase':{const pid=$('cpid').value,eid=t.dataset.e;
      if(!pid){alert('Please select a patient first.');return}
      const head={patientId:pid,tooth:$('cto').value.trim().replace(/^#/,''),type:$('ctp').value,
        review:$('crv').value,status:$('cst').value};
      const fromVisit=SH_VIS,after=SH_AFTER;SH_AFTER=null;
      if(id){const c=DB.cases.find(x=>x.id===id);if(!c)break;
        Object.assign(c,head);
        const en=readEnt(eid||null);
        const at=eid?c.entries.findIndex(x=>x.id===eid):-1;
        if(at>=0){en.visitId=c.entries[at].visitId||null;c.entries[at]=en}
        else{if(fromVisit)en.visitId=fromVisit;c.entries.push(en)}
      }else{const en=readEnt(null,'tx');if(fromVisit)en.visitId=fromVisit;
        DB.cases.push({id:uid('c_'),...head,entries:[en]})}
      save();close();
      if(!fromVisit){S.view='more';S.sub='cases'}
      render();
      if(after)mAppt(null,after);
      break}
    case'filt':S.filter=t.dataset.f;render();break;
    case'busy':S.onlyBusy=t.dataset.v==='1';render();break;
    case'mv':S.cur=new Date(S.cur.getFullYear(),S.cur.getMonth()+ +t.dataset.n,1);render();break;
    case'today':{
      S.cur=new Date(now.getFullYear(),now.getMonth(),1);S.view='schedule';S.filter='all';
      if(S.mode==='up')S.mode='cal';render();
      setTimeout(()=>{let el=$('d-'+TODAY)||document.querySelector('.cell.tdy');
        if(!el&&S.mode==='list'){S.onlyBusy=false;render();el=$('d-'+TODAY)}
        el&&el.scrollIntoView({behavior:'smooth',block:'center'})},90);break}
    case'openDay':S.view='schedule';S.mode='list';S.onlyBusy=false;render();
      setTimeout(()=>$('d-'+d)?.scrollIntoView({behavior:'smooth',block:'center'}),80);break;
    case'pickDay':P.sel.has(d)?P.sel.delete(d):P.sel.add(d);t.classList.toggle('psel');refreshPlan();break;
    case'planMode':P.mode=t.dataset.m;render();break;
    case'dow':{const i=+t.dataset.i;P.dows.has(i)?P.dows.delete(i):P.dows.add(i);t.classList.toggle('on');break}
    case'applyDow':{if(!P.dows.size){alert('เลือกวันในสัปดาห์ก่อน');return}
      const y=S.cur.getFullYear(),m=S.cur.getMonth(),last=new Date(y,m+1,0).getDate();
      for(let i=1;i<=last;i++){const dt=new Date(y,m,i);if(!P.dows.has(dt.getDay()))continue;
        const occ=Math.floor((i-1)/7);
        if(P.every==='w13'&&!(occ===0||occ===2))continue;
        if(P.every==='w24'&&!(occ===1||occ===3))continue;P.sel.add(iso(dt))}
      render();break}
    case'clearSel':P.sel=new Set();render();break;
    case'savePlan':{const ds=[...P.sel];if(!ds.length){alert('ยังไม่ได้เลือกวัน');return}
      if(P.mode==='clear'){if(!confirm(`ล้างการตั้งค่าห้อง ${ds.length} วัน?`))return;ds.forEach(x=>delete DB.daySchedules[x])}
      else{const ty=P.mode==='off'?'off':P.typeId,w=wt(ty);
        ds.forEach(x=>{DB.daySchedules[x]={typeId:ty,room:w.room,note:P.note};
          DB.appointments.filter(ap=>ap.date===x).forEach(ap=>{ap.typeId=ty;ap.room=w.room})})}
      P.sel=new Set();save();alert(`บันทึก ${ds.length} วันเรียบร้อย`);render();break}
    case'daySet':mDaySet(d);break;
    case'saveDay':{const r=document.querySelector('input[name=wtr]:checked');if(!r){alert('เลือกห้องก่อน');return}
      const w=wt(r.value),room=$('rm').value.trim()||w.room;
      DB.daySchedules[d]={typeId:w.id,room,note:$('dn').value.trim()};
      DB.appointments.filter(x=>x.date===d).forEach(x=>{x.typeId=w.id;x.room=room});
      {const back=SH_DAY;save();close();render();if(back)mDay(back)}break}
    case'clearDay':{const back=SH_DAY;delete DB.daySchedules[d];save();close();render();if(back)mDay(back)}break;
    case'addAppt':{if(isOff(d||TODAY)){alert('วันนั้นตั้งเป็น OFF (วันหยุด) — ลงนัดไม่ได้\nถ้าจะนัดจริง ให้เปลี่ยนห้องของวันนั้นก่อน');return}
      mAppt(null,{d:d||TODAY,s:t.dataset.s,p:t.dataset.p});break}
    case'editAppt':mAppt(id);break;
    case'delAppt':if(confirm('ลบนัดนี้? (กู้คืนได้ภายใน 30 วัน ที่หน้าตั้งค่า)')){
      const ap=DB.appointments.find(x=>x.id===id);
      if(ap){const p=pt(ap.patientId),vs=DB.visits.filter(v=>v.apptId===ap.id);
        toTrash({kind:'appt',label:`นัด ${p?p.name:'—'} · ${thDate(ap.date)}`,appts:[ap],visits:vs});
        DB.appointments=DB.appointments.filter(x=>x.id!==id);DB.visits=DB.visits.filter(v=>v.apptId!==ap.id)}
      save();render();if(SH_DAY)mDay(SH_DAY)}break;
    case'usePt':{const p=pt(id);$('fpid').value=p.id;$('fpq').value=(p.hn||'—')+' — '+p.name;
      $('np').style.display='none';$('nwarn').innerHTML='';checkDup();break}
    case'saveAppt':{let pid=$('fpid').value;
      {const nd=$('fd').value,old=id?DB.appointments.find(x=>x.id===id):null;
       if(isOff(nd)&&(!old||old.date!==nd)){alert('วันนั้นตั้งเป็น OFF (วันหยุด) — ลงนัดไม่ได้\nถ้าจะนัดจริง ให้เปลี่ยนห้องของวันนั้นก่อน');return}}
      if(pid==='__new'){const hn=$('nhn').value.trim(),ph=$('nph').value.trim(),nm=$('nnm').value.trim();
        if(!nm){alert('Please enter the patient name.');return}
        const dup=DB.patients.find(p=>(hn&&(p.hn||'').trim().toLowerCase()===hn.toLowerCase())||(digits(ph).length>=9&&digits(p.phone)===digits(ph)));
        if(dup){alert(`Patient already exists: ${dup.hn} — ${dup.name}`);return}
        const np={id:uid('p_'),hn,name:nm,age:'',sex:$('nsx').value,phone:ph,cat:$('ncat').value,tags:[],note:'',createdAt:TODAY};
        DB.patients.push(np);pid=np.id}
      if(!pid){alert('Please search and select a patient first.');return}
      const date=$('fd').value,tm=$('ftm').value,sesId=tm?ses4(tm):'pm';
      const clash=DB.appointments.find(x=>x.patientId===pid&&x.date===date&&x.status!=='cancelled'&&x.id!==id);
      if(clash&&!confirm('This patient is already booked that day — add another appointment?'))return;
      const ov=clashAt(date,$('ftm').value,$('fdu').value,id||null);
      if(ov&&!confirm(`Overlaps ${clashMsg(ov)}\n\nBook it anyway?`))return;
      const ty=$('ft').value,w=wt(ty),cur=daySch(date),room=cur&&cur.typeId===ty?cur.room:w.room;
      DB.daySchedules[date]={typeId:ty,room,note:cur?cur.note:''};
      DB.appointments.filter(x=>x.date===date).forEach(x=>{x.typeId=ty;x.room=room});
      const o={patientId:pid,date,session:sesId,typeId:ty,room,proc:$('fpr').value,
        time:tm,duration:+$('fdu').value||30,tooth:$('fto').value.trim(),status:$('fst').value,note:$('fnt').value};
      if(id)Object.assign(DB.appointments.find(x=>x.id===id),o);
      else{const nid=uid('a_');DB.appointments.push({id:nid,visitId:null,...o});
        if(SH_WL){const q=(DB.waitlist||[]).find(x=>x.id===SH_WL);if(q){q.status='done';q.apptId=nid;q.doneAt=TODAY}}}
      save();close();render();break}
    case'checkin':{const ap=DB.appointments.find(x=>x.id===id);
      if(ap.visitId){close();mVisit(ap.visitId);break}
      const v={id:uid('v_'),patientId:ap.patientId,apptId:ap.id,date:ap.date,session:ap.session,typeId:ap.typeId,
        proc:ap.proc||'',tooth:ap.tooth||'',dx:'',tx:'',note:ap.note||''};
      DB.visits.push(v);ap.visitId=v.id;ap.status='done';save();close();mVisit(v.id);break}
    case'editVisit':mVisit(id);break;
    case'saveVisit':{const v=DB.visits.find(x=>x.id===id);const sel=pickVal('vcase');
      v.proc=$('vpr').value;v.tooth=$('vto').value.trim();v.dx=$('vd').value;v.tx=$('vt').value;v.note=$('vn').value;
      save();close();render();visitToCase(v,sel,null);break}
    case'saveVisitNext':{const v=DB.visits.find(x=>x.id===id);if(!v)break;
      const sel=pickVal('vcase');
      v.proc=$('vpr').value;v.tooth=$('vto').value.trim();v.dx=$('vd').value;v.tx=$('vt').value;v.note=$('vn').value;
      save();close();
      const nx={p:v.patientId,proc:(v.tx||v.proc||'').trim(),tooth:(v.tooth||'').trim()};
      if(!visitToCase(v,sel,nx))mAppt(null,nx);break}
    case'delVisit':if(confirm('ลบ Visit นี้?')){const ap=DB.appointments.find(x=>x.visitId===id);
      if(ap){ap.visitId=null;ap.status='scheduled'}
      DB.visits=DB.visits.filter(x=>x.id!==id);save();close();render()}break;
    case'selP':S.sel=id;S.view='archive';render();break;
    case'addPatient':mPatient(null);break;
    case'editPatient':mPatient(id);break;
    case'delPatient':{const p0=pt(id);if(!p0)break;
      const aps=DB.appointments.filter(a=>a.patientId===id),vss=DB.visits.filter(v=>v.patientId===id);
      if(!confirm(`ลบ ${p0.name} พร้อมนัด ${aps.length} รายการและบันทึกรักษา ${vss.length} รายการ?\n(กู้คืนได้ภายใน 30 วัน ที่หน้าตั้งค่า)`))break;
      toTrash({kind:'patient',label:`คนไข้ ${p0.name}${p0.hn?' · HN '+p0.hn:''}`,patients:[p0],appts:aps,visits:vss});
      DB.patients=DB.patients.filter(p=>p.id!==id);DB.appointments=DB.appointments.filter(a=>a.patientId!==id);
      DB.visits=DB.visits.filter(v=>v.patientId!==id);if(S.sel===id)S.sel=null;save();render();break}
    case'restoreTrash':{const t=(DB.trash||[]).find(x=>x.tid===id);if(!t)break;
      (t.patients||[]).forEach(p=>{if(!pt(p.id))DB.patients.push(p)});
      (t.appts||[]).forEach(a=>{if(!DB.appointments.find(x=>x.id===a.id))DB.appointments.push(a)});
      (t.visits||[]).forEach(v=>{if(!DB.visits.find(x=>x.id===v.id))DB.visits.push(v)});
      DB.trash=DB.trash.filter(x=>x.tid!==id);save();render();alert('กู้คืนเรียบร้อย');break}
    case'dropTrash':if(confirm('ลบรายการนี้ถาวร? ย้อนกลับไม่ได้')){DB.trash=DB.trash.filter(x=>x.tid!==id);save();render()}break;
    case'resched':mResched(id);break;
    case'rplus':{const f=$('rsd');if(!f)break;const b=f.value?parseD(f.value):new Date();
      b.setDate(b.getDate()+ +t.dataset.n);f.value=iso(b);break}
    case'saveResched':{const a=DB.appointments.find(x=>x.id===id);if(!a)break;
      const nd=$('rsd').value;if(!nd){alert('เลือกวันที่ใหม่ก่อน');return}
      if(isOff(nd)&&nd!==a.date){alert('วันนั้นตั้งเป็น OFF (วันหยุด) — ลงนัดไม่ได้\nถ้าจะนัดจริง ให้เปลี่ยนห้องของวันนั้นก่อน');return}
      if(nd===a.date&&$('rst').value===(a.time||'')){close();break}
      const ov2=clashAt(nd,$('rst').value,a.duration,a.id);
      if(ov2&&!confirm(`เวลาใหม่ทับกับ ${clashMsg(ov2)}\n\nยืนยันเลื่อนไปเวลานี้ไหม?`))break;
      const why=$('rsr').value.trim();
      a.moves=a.moves||[];a.moves.push({from:a.date,to:nd,at:new Date().toISOString(),why});
      a.note=(`เลื่อนจาก ${thDate(a.date)}${why?' ('+why+')':''}`+(a.note?' · '+a.note:''));
      a.date=nd;a.time=$('rst').value;
      (DB.waitlist||[]).filter(w=>w.kind==='resched'&&w.apptId===a.id&&w.status==='wait')
        .forEach(w=>{w.status='done';w.doneAt=TODAY});
      const s=daySch(nd);if(s){a.typeId=s.typeId;a.room=s.room}
      save();close();render();break}
    case'dplus':{const f=$('fd');if(!f)break;const base=f.value?parseD(f.value):new Date();
      base.setDate(base.getDate()+ +t.dataset.n);f.value=iso(base);
      f.dispatchEvent(new Event('change',{bubbles:true}));break}
    case'loadSnaps':loadSnapshots();break;
    case'restoreSnap':{const r=SNAPS.find(x=>String(x.id)===String(id));if(!r)break;
      const n=r.data||{};
      if(!confirm(`กู้คืนข้อมูลของ ${new Date(r.created_at).toLocaleString('th-TH')}?\n\nข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่\n(คนไข้ ${(n.patients||[]).length} · นัด ${(n.appointments||[]).length})`))break;
      DB=n;fixDB(DB);if(!DB.workTypes||!DB.workTypes.length)DB.workTypes=DEF_WT.slice();
      save();applyTheme(DB.theme||'cheesecake');S.sel=null;render();alert('กู้คืนเรียบร้อย');break}
    case'emptyTrash':if(confirm('ล้างถังขยะทั้งหมดถาวร? ย้อนกลับไม่ได้')){DB.trash=[];save();render()}break;
    case'setSt':{const a=DB.appointments.find(x=>x.id===id);if(a){a.status=t.dataset.s;save();render()}break}
    case'nextAppt':{const pid=t.dataset.pid;close();mAppt(null,{p:pid});break}
    case'catFil':S.cat=t.dataset.c;render();break;
    case'copyStats':{const txt=statsText();
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>alert('คัดลอกแล้ว'),()=>prompt('คัดลอกข้อความนี้',txt));
      else prompt('คัดลอกข้อความนี้',txt);break}
    case'caseSt':{const p=pt(id);if(!p)break;p.caseSt=p.caseSt===t.dataset.s?'':t.dataset.s;save();render();break}
    case'savePatient':{const o={hn:$('phn').value.trim(),name:$('pnm').value.trim(),age:$('pag').value,sex:$('psx').value,
      phone:$('pph').value.trim(),cat:$('pcat').value,tags:$('ptg').value.split(',').map(s=>s.trim()).filter(Boolean),note:$('pnt').value};
      if(!o.name){alert('กรอกชื่อคนไข้');return}
      const dup=DB.patients.find(p=>p.id!==id&&o.hn&&(p.hn||'').toLowerCase()===o.hn.toLowerCase());
      if(dup&&!confirm(`HN ซ้ำกับ ${dup.name}\nยืนยันบันทึกต่อ?`))return;
      if(id)Object.assign(pt(id),o);else{const np={id:uid('p_'),createdAt:TODAY,...o};DB.patients.push(np);S.sel=np.id;S.view='archive'}
      save();close();render();break}
    case'addWT':DB.workTypes.push({id:uid('w_'),name:'ห้องใหม่',short:'NEW',room:'ห้องใหม่',color:'#0f9b8e',group:'อื่น ๆ'});save();render();break;
    case'delWT':if(confirm('ลบประเภทงานนี้?')){DB.workTypes=DB.workTypes.filter(w=>w.id!==id);save();render()}break;
    case'reset':if(confirm('ล้างข้อมูลทั้งหมดและเริ่มใหม่?')){const th=DB.theme;localStorage.removeItem(KEY);DB=seed();DB.theme=th;save();S.sel=null;render()}break;
    case'close':close();break;
  }});
document.addEventListener('change',e=>{const i=e.target;
  if(i.dataset.wt){const w=wt(i.dataset.wt);w[i.dataset.f]=i.value;save();if(i.dataset.f!=='name')render();return}
  if(i.dataset.plan){S.plan[i.dataset.plan]=i.value;refreshPlan()}});
document.addEventListener('input',e=>{if(e.target.dataset.plan==='note')S.plan.note=e.target.value});
$('fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j.patients)throw 0;
    DB=fixDB(j);save();applyTheme(DB.theme||'cheesecake');S.sel=null;render();alert('นำเข้าข้อมูลสำเร็จ — '+DB.patients.length+' คนไข้')}
    catch(x){alert('ไฟล์ไม่ถูกต้อง')}};r.readAsText(f);e.target.value=''});
document.addEventListener('change',e=>{
  if(!e.target.matches('[data-pm]'))return;
  const v=e.target.value;if(!/^\d\d:\d\d$/.test(v))return;
  const old=pmWin(),nw=Object.assign({},old,{[e.target.dataset.pm]:v});
  if(toMin(nw.to)-toMin(nw.from)<MIN_GAP){alert('ช่วงบ่ายต้องยาวอย่างน้อย '+MIN_GAP+' นาที');render();return}
  DB.pmWin=nw;
  save();render()});
document.addEventListener('input',e=>{
  if(e.target.matches('[data-cq]')){
    S.cq=e.target.value;const pos=e.target.selectionStart;render();
    const el=$('cq');if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(_){}}
    return}
  if(!e.target.matches('[data-q]'))return;
  S.q=e.target.value;const id=e.target.id,pos=e.target.selectionStart;render();
  const el=id&&$(id);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(_){}}
  document.querySelectorAll('[data-q]').forEach(i=>{if(i.id!==id)i.value=S.q})
});
/* ปัดซ้าย/ขวาเพื่อสลับ Month / Upcoming / Day list (เฉพาะหน้าปฏิทิน) */
let _tx=0,_ty=0,_tt=0;
document.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;
  _tx=e.touches[0].clientX;_ty=e.touches[0].clientY;_tt=Date.now()},{passive:true});
document.addEventListener('touchend',e=>{
  if(S.view!=='schedule'||mask.classList.contains('on'))return;
  if(e.target.closest&&e.target.closest('input,select,textarea,button,a,.ac-list'))return;
  const t=e.changedTouches[0],dx=t.clientX-_tx,dy=t.clientY-_ty;
  if(Date.now()-_tt>700||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.8)return;
  const ord=['cal','up','list'],j=ord.indexOf(S.mode)+(dx<0?1:-1);
  if(j<0||j>=ord.length)return;
  S.mode=ord[j];render();window.scrollTo(0,0)},{passive:true});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){$('tpanel').classList.remove('on');$('npanel').classList.remove('on');return}
  const t=e.target;
  if((e.key==='Enter'||e.key===' ')&&t.getAttribute&&t.getAttribute('role')==='button'&&t.dataset.act){e.preventDefault();t.click()}
});

/* ---------- CLOUD SYNC ---------- */
const SYNC={on:false,sb:null,dirty:false,t:null,email:'',seenAt:''};   // seenAt = updated_at ของคลาวด์ที่เครื่องนี้เห็นล่าสุด
const SNAP_KEY='dental_last_snapshot';
const DEVICE=localStorage.getItem('dev_id')||(()=>{const v='d_'+Math.random().toString(36).slice(2,8);localStorage.setItem('dev_id',v);return v})();
function setSync(txt,color){const b=$('syncBadge');if(!b)return;
  b.classList.remove('ok','wrn','dng');
  if(color==='var(--ok)')b.classList.add('ok');else if(color==='var(--wrn)')b.classList.add('wrn');else if(color==='var(--dng)')b.classList.add('dng');
  b.innerHTML='<b></b>'+esc(txt)}
function queuePush(){SYNC.dirty=true;clearTimeout(SYNC.t);setSync('กำลังบันทึก…');SYNC.t=setTimeout(cloudPush,700)}
async function cloudPush(force){if(!navigator.onLine){setSync('ออฟไลน์','var(--wrn)');return}
  // กันเขียนทับ: ถ้าคลาวด์ใหม่กว่าที่เครื่องนี้เห็นล่าสุด และมาจากอีกเครื่อง ให้ถามก่อน
  if(!force){
    const {data:cur}=await SYNC.sb.from('clinic_state').select('updated_at,updated_by').eq('id',ROW_ID).maybeSingle();
    if(cur&&cur.updated_by!==DEVICE&&SYNC.seenAt&&cur.updated_at>SYNC.seenAt){
      setSync('ข้อมูลชนกัน','var(--dng)');
      const keepMine=confirm('อีกเครื่องหนึ่งบันทึกข้อมูลใหม่กว่าไว้บนคลาวด์\n\nกด "ตกลง" = ใช้ข้อมูลของเครื่องนี้ทับของบนคลาวด์\nกด "ยกเลิก" = ทิ้งการแก้ไขในเครื่องนี้ แล้วดึงของบนคลาวด์มาแทน');
      if(!keepMine){await cloudPull();applyTheme(DB.theme||'cheesecake');render();SYNC.dirty=false;setSync('sync.','var(--ok)');return}
    }
  }
  const at=new Date().toISOString();
  const {error}=await SYNC.sb.from('clinic_state').upsert({id:ROW_ID,data:DB,updated_at:at,updated_by:DEVICE});
  if(error){setSync('ซิงก์ไม่สำเร็จ','var(--dng)');console.warn(error)}
  else{SYNC.dirty=false;SYNC.seenAt=at;setSync('sync.','var(--ok)');cloudSnapshot()}}
async function cloudPull(){const {data,error}=await SYNC.sb.from('clinic_state').select('data,updated_at').eq('id',ROW_ID).maybeSingle();
  if(error){setSync('ดึงข้อมูลไม่ได้','var(--dng)');return}
  if(data?.data?.patients){DB=data.data;fixDB(DB);SYNC.seenAt=data.updated_at||'';localSave()}else await cloudPush(true)}
/* สแนปช็อตบนคลาวด์ วันละครั้ง — กู้คืนได้ถ้าข้อมูลหลักเสียหาย */
async function cloudSnapshot(){
  if(!SYNC.on)return;
  try{
    if(localStorage.getItem(SNAP_KEY)===TODAY)return;
    const {error}=await SYNC.sb.from('clinic_backups').insert({row_id:ROW_ID,data:DB});
    if(error){console.warn('snapshot',error);return}
    localStorage.setItem(SNAP_KEY,TODAY);
    const {data:old}=await SYNC.sb.from('clinic_backups').select('id').eq('row_id',ROW_ID).order('created_at',{ascending:false}).range(60,200);
    if(old&&old.length)await SYNC.sb.from('clinic_backups').delete().in('id',old.map(r=>r.id));
  }catch(e){console.warn('snapshot',e)}}
async function loadSnapshots(){
  const box=$('snapBox');if(!box)return;
  if(!SYNC.on){box.innerHTML='<div class="muted">ต้องเข้าสู่ระบบก่อนจึงจะดูข้อมูลสำรองบนคลาวด์ได้</div>';return}
  box.innerHTML='<div class="muted">กำลังโหลด…</div>';
  const {data,error}=await SYNC.sb.from('clinic_backups').select('id,created_at,data').eq('row_id',ROW_ID).order('created_at',{ascending:false}).limit(60);
  if(error){box.innerHTML=`<div class="warn">อ่านไม่ได้ — ยังไม่ได้สร้างตาราง clinic_backups หรือสิทธิ์ไม่พอ<br><span style="font-weight:400">${esc(error.message||'')}</span></div>`;return}
  if(!data.length){box.innerHTML='<div class="muted">ยังไม่มีสแนปช็อต — ระบบจะสร้างให้อัตโนมัติวันละครั้งเมื่อมีการบันทึก</div>';return}
  SNAPS=data;
  box.innerHTML=data.map(r=>{const d=new Date(r.created_at),n=r.data||{};
    return `<div class="pt"><div class="avatar">${SI('cloud')}</div><div style="min-width:0">
      <div class="nm">${d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</div>
      <div class="hn">คนไข้ ${(n.patients||[]).length} · นัด ${(n.appointments||[]).length} · บันทึกรักษา ${(n.visits||[]).length}</div></div>
      <div class="ac"><button class="btn sm" data-act="restoreSnap" data-id="${r.id}">กู้คืน</button></div></div>`}).join('')}
let SNAPS=[];
function subscribeRealtime(){SYNC.sb.channel('clinic-sync').on('postgres_changes',
  {event:'*',schema:'public',table:'clinic_state',filter:`id=eq.${ROW_ID}`},p=>{
    const n=p.new;if(!n)return;SYNC.seenAt=n.updated_at||SYNC.seenAt;if(n.updated_by===DEVICE)return;
    DB=n.data;fixDB(DB);localSave();applyTheme(DB.theme||'cheesecake');render();setSync('sync.','var(--ok)')}).subscribe()}
window.addEventListener('online',()=>{if(SYNC.dirty)cloudPush()});
function loginUI(msg){
  app.innerHTML=`<div style="max-width:380px;margin:12vh auto"><div class="card">
    <div class="mtitle">เข้าสู่ระบบ</div><div class="muted" style="margin-bottom:16px">ใช้บัญชีที่สร้างไว้ใน Supabase</div>
    ${msg?`<div class="warn">${msg}</div>`:''}
    <div class="f"><label>อีเมล</label><input id="lgE" type="email" autocomplete="username"></div>
    <div class="f"><label>รหัสผ่าน</label><input id="lgP" type="password" autocomplete="current-password"></div>
    <button class="btn pri blk" id="lgB">เข้าสู่ระบบ</button></div></div>`;
  const go=async()=>{const {error}=await SYNC.sb.auth.signInWithPassword({email:$('lgE').value.trim(),password:$('lgP').value});
    error?loginUI('อีเมลหรือรหัสผ่านไม่ถูกต้อง'):boot()};
  $('lgB').onclick=go;$('lgP').onkeydown=e=>{if(e.key==='Enter')go()}}
async function boot(){
  const h=(location.hash||'').replace('#','');
  if(h==='upcoming'){S.view='schedule';S.mode='up'}
  else if(['schedule','planner','stats','archive','settings'].includes(h))S.view=h;
  if(!SUPA_URL||!SUPA_KEY){setSync('เครื่องนี้');render();return}
  SYNC.sb=supabase.createClient(SUPA_URL,SUPA_KEY);
  const {data:{session}}=await SYNC.sb.auth.getSession();
  if(!session){setSync('ยังไม่เข้าสู่ระบบ');loginUI();return}
  SYNC.email=(session.user&&session.user.email)||'';
  SYNC.on=true;setSync('กำลังดึงข้อมูล…');
  await cloudPull();applyTheme(DB.theme||'cheesecake');purgeOldTrash();render();subscribeRealtime();setSync('sync.','var(--ok)');cloudSnapshot()}
boot();

/* ---------- PWA ---------- */
const bar=$('pwaBar'),pmsg=$('pwaMsg'),okBtn=$('pwaBtn'),xBtn=$('pwaX');
const showBar=(text,label,fn)=>{pmsg.textContent=text;okBtn.textContent=label;okBtn.onclick=fn;bar.classList.add('on')};
xBtn.onclick=()=>bar.classList.remove('on');
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{
  try{const reg=await navigator.serviceWorker.register('./sw.js');
    reg.addEventListener('updatefound',()=>{const nw=reg.installing;
      nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller)
        showBar('มีเวอร์ชันใหม่พร้อมใช้งาน','อัปเดต',()=>nw.postMessage('SKIP_WAITING'))})});
    let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(rl)return;rl=true;location.reload()});
    setInterval(()=>reg.update(),30*60*1000)}catch(e){console.warn('SW',e)}})}
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;
  showBar('ติดตั้งเป็นแอปบนเครื่องนี้?','ติดตั้ง',async()=>{bar.classList.remove('on');deferred.prompt();await deferred.userChoice;deferred=null})});
window.addEventListener('appinstalled',()=>{bar.classList.remove('on');deferred=null});
window.addEventListener('offline',()=>showBar('ออฟไลน์ — ข้อมูลเก็บในเครื่องไว้ก่อน','เข้าใจแล้ว',()=>bar.classList.remove('on')));
