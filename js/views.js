/* ===== views.js =====
   ฟังก์ชันวาดหน้าจอทุกหน้า — ปฏิทิน / รายวัน / นัดที่จะถึง / สรุป / ทะเบียน / ตั้งค่า
   ===================================================== */

/* ---------- RENDER ---------- */
const app=document.getElementById('app'),$=x=>document.getElementById(x);
function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));
  document.body.dataset.v=S.view==='stats'?'more':S.view;
  syncBell();
  document.querySelectorAll('#nav button').forEach(b=>{if(b.dataset.v==='more')b.classList.toggle('on',S.view==='more'||S.view==='stats')});
  app.innerHTML=S.view==='schedule'?vSchedule():S.view==='planner'?vPlanner():(S.view==='more'||S.view==='stats')?vMore():S.view==='upcoming'?vUpcoming():S.view==='archive'?vArchive():vSettings();
}
function vSchedule(){const y=S.cur.getFullYear(),m=S.cur.getMonth(),od=overdueAppts().length;
  const hero=S.mode==='up'?'':`<div class="hero"><div class="num mono">${String(m+1).padStart(2,'0')}</div>
    <div class="rt"><div class="mn">${TH_MF[m]}</div><div class="yr">${y+543}</div>
    <div class="nav2"><button data-act="mv" data-n="-1" aria-label="เดือนก่อน">${SI('chevL')}</button><button data-act="mv" data-n="1" aria-label="เดือนถัดไป">${SI('chevR')}</button></div></div></div>`;
  const sub=S.mode==='cal'?'':`<div class="row subrow">
    <div class="seg sub"><button data-act="mode" data-m="up" class="${S.mode==='up'?'on':''}">All</button>
    <button data-act="mode" data-m="list" class="${S.mode==='list'?'on':''}">By day</button></div>
    ${S.mode==='list'?`<div class="seg sub"><button data-act="busy" data-v="1" class="${S.onlyBusy?'on':''}">เฉพาะวันที่มีนัด</button>
    <button data-act="busy" data-v="0" class="${!S.onlyBusy?'on':''}">ทุกวันที่มีงาน</button></div>`:''}
    ${S.q?`<span class="chip" style="border-color:var(--line);color:var(--tx2)">กรอง “${esc(S.q)}”</span>`:''}</div>`;
  return hero+`<div class="tools"><div class="seg">
    <button data-act="mode" data-m="cal" class="${S.mode==='cal'?'on':''}">Month</button>
    <button data-act="mode" data-m="${S.mode==='list'?'list':'up'}" class="${S.mode!=='cal'?'on':''} ${od?'alert':''}">Upcoming</button></div>
    <div class="tright"><button class="ico-sm" data-act="today" title="วันนี้" aria-label="วันนี้">${SI('target')}</button>
    <button class="btn pri sm" data-act="addAppt" data-d="${TODAY}">＋ เพิ่มนัด</button></div></div>`
  +sub+(S.mode==='cal'?calendar(y,m):S.mode==='up'?vUpcoming():dayList(y,m))}
function calendar(y,m){
  const start=new Date(y,m,1-new Date(y,m,1).getDay());
  let cells='';
  for(let i=0;i<42;i++){
    const dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=iso(dt);
    const out=dt.getMonth()!==m,s=daySch(k),w=s?wt(s.typeId):null;
    if(S.filter!=='all'&&(!w||w.id!==S.filter)){cells+=`<div class="cell ${out?'out':''}" style="opacity:.3"><div class="ctop"><span class="cn ${dt.getDay()===0?'sun':''}">${dt.getDate()}</span></div></div>`;continue}
    const n=liveOn(k).length,tdy=k===TODAY,mk=w&&(w.id==='off'||w.id==='scr');
    cells+=`<div class="cell ${out?'out':''} ${tdy?'tdy':''} ${mk&&!tdy?'mark':''}" ${mk?`style="--mk:${w.color}"`:''} role="button" tabindex="0" data-act="day" data-d="${k}" title="ดูนัดของวันนี้">
      <div class="ctop"><span class="cn ${dt.getDay()===0?'sun':''}">${dt.getDate()}</span></div>
      <div class="cmid">${w?`<div class="rline"><i class="rdot" style="background:${w.color}"></i><span class="rl" style="color:${tdy?'var(--onhl)':w.color}">${esc(s.room||w.room)}</span></div>`:''}
      ${s&&s.note?`<div class="rl sub" style="color:var(--tx2);font-weight:500">${esc(s.note)}</div>`:''}</div>
      <div class="cbot">${n?`<span class="cnt">${n}<i> คน</i></span>`:''}</div></div>`}
  return `<div class="cal"><div class="grid">${DOW.map(d=>`<div class="gh">${d}</div>`).join('')}</div><div class="grid">${cells}</div></div>
    <div class="filters"><button class="fl ${S.filter==='all'?'on':''}" data-act="filt" data-f="all">ทั้งหมด</button>
    ${DB.workTypes.map(w=>`<button class="fl ${S.filter===w.id?'on':''}" data-act="filt" data-f="${w.id}"><i class="dot" style="background:${w.color}"></i>${esc(w.name)}</button>`).join('')}</div>`}
function dayList(y,m){
  const last=new Date(y,m+1,0).getDate();let out='',any=false;
  for(let i=1;i<=last;i++){
    const k=iso(new Date(y,m,i)),s=daySch(k),ap=filterAppts(apptsOn(k));
    if(S.onlyBusy&&!ap.length)continue;
    if(!S.onlyBusy&&!s&&!ap.length)continue;
    any=true;
    const dt=parseD(k),w=s?wt(s.typeId):null,off=s&&s.typeId==='off';
    const shown=SESSIONS.filter(se=>ap.some(a=>a.session===se.id));
    out+=`<div class="day" id="d-${k}">
      <div class="rail ${k===TODAY?'today':''}">
        <div class="dw">${DOWF[dt.getDay()]}</div><div class="dn">${i}</div><div class="dm">${TH_M[m]} ${y+543}</div>
        ${w?`<span class="rl2" style="background:${w.color}22;color:${w.color};border:1px solid ${w.color}55">${esc(s.room||w.room)}</span>`
           :`<span class="rl2" style="background:var(--soft);color:var(--tx2)">ยังไม่ตั้งห้อง</span>`}
        <button class="btn sm blk" data-act="daySet" data-d="${k}">ตั้งค่าห้อง</button></div>
      <div class="slots">
        ${s&&s.note?`<div class="note">${SI('pin')} ${esc(s.note)}</div>`:''}
        ${off?`<div class="slot" style="border-left-color:#9aa0b5"><h4>${SI('ban')} วันหยุด (OFF)</h4></div>`:''}
        ${shown.map(se=>{const l=ap.filter(a=>a.session===se.id);
          return `<div class="slot ${se.id}"><div class="row sp">
            <h4><i class="dot" style="background:${se.c}"></i> ${se.name}<span class="muted">· ${l.filter(a=>a.status!=='cancelled').length} คน</span></h4>
            <button class="btn sm" data-act="addAppt" data-d="${k}" data-s="${se.id}">＋ เพิ่ม</button></div>
            ${l.map(ptRow).join('')}</div>`}).join('')}
        <div class="addrow">＋ เพิ่มนัด:
          ${SESSIONS.map(se=>`<button class="btn sm" data-act="addAppt" data-d="${k}" data-s="${se.id}">${se.name}</button>`).join('')}</div>
      </div></div>`}
  return out+(any?'':`<div class="empty">ไม่มีนัดในเดือนนี้</div>`)}
function ptRow(a){
  const p=pt(a.patientId);if(!p)return'';
  const al=(p.tags||[]).length?`<span class="chip" style="border-color:var(--dngLn);color:var(--dng);background:var(--dngBg)">${SI('warn')} ${esc(p.tags[0])}</span>`:'';
  const ST={scheduled:'นัดไว้',done:'มาแล้ว',cancelled:'ยกเลิก',noshow:'ไม่มา'};
  return `<div class="pt ${a.status==='cancelled'?'cx':''}">
    <div class="ptinfo">
      <div class="ptop">${a.time?`<span class="ptime">${esc(a.time)}<i>${a.duration||30} น.</i></span>`:''}
        <span class="st ${a.status}">${ST[a.status]}</span>
        ${(a.moves||[]).length?`<span class="mv">เลื่อน ${a.moves.length}×</span>`:''}${(DB.waitlist||[]).some(w=>w.kind==='resched'&&w.apptId===a.id&&w.status==='wait')?`<span class="mv">${SI('phone')} รอโทรเลื่อน</span>`:''}</div>
      <div class="nm">${esc(p.name)} ${catChip(p.cat)} ${al}</div>
      <div class="hn">${esc(p.hn||'ไม่มี HN')}${p.phone?' · '+telLink(p.phone):''} · ${esc(a.proc||'ไม่ระบุ')}${a.tooth?' · ซี่ '+esc(a.tooth):''}</div>
    </div>
    <div class="ac">
    ${a.status==='scheduled'
      ?`<button class="btn sm pri" data-act="checkin" data-id="${a.id}">มาแล้ว</button>
        <button class="btn sm" data-act="resched" data-id="${a.id}">เลื่อน</button>`
      :`<button class="btn sm" data-act="checkin" data-id="${a.id}">บันทึกรักษา</button>`}
    <button class="btn sm" data-act="editAppt" data-id="${a.id}">แก้ไข</button>
    <button class="btn sm dg" data-act="delAppt" data-id="${a.id}">ลบ</button></div></div>`}
function mResched(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;const p=pt(a.patientId);
  open(`<div class="mtitle">เลื่อนนัด</div>
   <div class="muted" style="margin-bottom:13px">${esc(p?p.name:'')} · เดิม ${thDate(a.date)}${a.time?' '+esc(a.time):''}</div>
   ${(a.moves||[]).length?`<div class="note" style="margin-bottom:12px">เคยเลื่อนมาแล้ว ${a.moves.length} ครั้ง — ครั้งแรกนัดไว้ ${thDate(a.moves[0].from)}</div>`:''}
   <div class="g2m"><div class="f"><label>วันที่ใหม่</label><input type="date" id="rsd" value="${a.date}"></div>
   <div class="f"><label>เวลา</label><input type="time" id="rst" value="${esc(a.time||'')}"></div></div>
   <div class="quick">เลื่อนไป:${[['1 สัปดาห์',7],['2 สัปดาห์',14],['1 เดือน',30],['3 เดือน',90]]
     .map(([t,n])=>`<button type="button" class="qbtn" data-act="rplus" data-n="${n}">+${t}</button>`).join('')}</div>
   <div id="rswarn" class="muted" style="font-size:11.5px;margin:-4px 0 10px"></div>
   <div class="f"><label>เหตุผล (ไม่ใส่ก็ได้)</label><input id="rsr" placeholder="เช่น คนไข้ติดธุระ, หมอติดประชุม"></div>
   <div class="mfoot"><button class="btn" data-act="wlResched" data-id="${id}">${SI('phone')} ยังไม่รู้วัน \u2014 ใส่รายชื่อต้องโทร</button>
   <button class="btn" data-act="close">ยกเลิก</button>
   <button class="btn pri" data-act="saveResched" data-id="${id}">บันทึกการเลื่อน</button></div>`);
  const rw=()=>{const b=$('rswarn');if(!b)return;const c=clashAt($('rsd').value,$('rst').value,a.duration,a.id);
    b.innerHTML=c?`<span style="color:var(--wrn);font-weight:700">${SI('warn')} เวลาทับกับ ${esc(clashMsg(c))}</span>`:''};
  ['rsd','rst'].forEach(k=>{const el=$(k);if(el)el.addEventListener('input',rw)});rw()}
/* ---------- PLANNER: เติมช่องว่างตอนบ่าย + ตั้งห้อง ---------- */
function vPlanner(){
  const sb=S.psub==='rooms'?'rooms':'slots';
  const nq=(DB.waitlist||[]).filter(w=>w.status==='wait').length;
  return `<div class="row subrow"><div class="seg sub">
    <button data-act="psub" data-s="slots" class="${sb==='slots'?'on':''}">Fill slots${nq?` \u00b7 ${nq}`:''}</button>
    <button data-act="psub" data-s="rooms" class="${sb==='rooms'?'on':''}">Rooms</button></div></div>`
   +(sb==='slots'?vSlots():vRooms())}

const MIN_GAP=30;
const pmWin=()=>DB.pmWin||{from:'13:00',to:'15:30'};
const isMainRoom=tid=>{if(!tid)return false;const w=DB.workTypes.find(x=>x.id===tid);return tid==='fung'||!!(w&&/ฟุ้ง/.test(w.name))};
/* วันนี้เป็นวันแบบไหน: ข้าม OFF / เสาร์-อาทิตย์ที่ไม่ได้ตั้งห้อง, เตือนถ้าไม่ใช่วันฟุ้ง */
function dayKind(d){const s=daySch(d),dow=parseD(d).getDay();
  if(s&&s.typeId==='off')return{skip:true,off:true};
  if(s){const w=wt(s.typeId);return{main:isMainRoom(s.typeId),room:s.room||w.room,color:w.color}}
  if(dow===0||dow===6)return{skip:true};
  return{main:false,none:true,room:'ยังไม่ตั้งห้อง',color:'var(--tx2)'}}
/* นัดที่กินเวลาในช่วงบ่าย (ตัดยกเลิกออก) */
function pmBusy(d){const w=pmWin(),f=toMin(w.from),t=toMin(w.to);
  return DB.appointments.filter(a=>a.date===d&&a.status!=='cancelled'&&a.time)
    .map(a=>({a,s:toMin(a.time),e:toMin(a.time)+(+a.duration||30)}))
    .filter(x=>x.e>f&&x.s<t).sort((x,y)=>x.s-y.s)}
/* ช่องว่างอย่างน้อย 30 นาที ภายในช่วงบ่าย — คืนเป็น [เริ่ม, จบ] หน่วยนาที */
function gapsOn(d){
  const w=pmWin(),f=toMin(w.from),t=toMin(w.to);let cur=f;
  if(d<TODAY)return[];
  if(d===TODAY){const n=new Date();cur=Math.max(f,Math.ceil((n.getHours()*60+n.getMinutes())/15)*15)}
  const out=[];
  pmBusy(d).forEach(x=>{const end=Math.min(x.s,t);if(end-cur>=MIN_GAP)out.push([cur,end]);cur=Math.max(cur,x.e)});
  if(t-cur>=MIN_GAP)out.push([cur,t]);
  return out}
const gapLen=g=>g[1]-g[0];
/* หาช่องแรกที่ใส่ได้ (เฉพาะวันฟุ้ง) */
function firstFit(dur){
  for(let i=0;i<42;i++){const d=iso(new Date(Date.now()+i*864e5)),k=dayKind(d);
    if(k.skip||!k.main)continue;
    const g=gapsOn(d).find(x=>gapLen(x)>=dur);if(g)return{d,t:fmtMin(g[0])}}
  return null}
const WL_KIND={invite:'เรียกมาเติม',resched:'โทรเลื่อน'};
const wlWait=()=>(DB.waitlist||[]).filter(w=>w.status==='wait')
  .sort((a,b)=>(a.kind==='resched'?0:1)-(b.kind==='resched'?0:1)||(b.prio==='urgent')-(a.prio==='urgent')||(a.created||'').localeCompare(b.created||''));

function pmBar(d){const w=pmWin(),f=toMin(w.from),t=toMin(w.to),span=t-f;
  return `<div class="fbar">${pmBusy(d).map(x=>{const s=Math.max(x.s,f),e=Math.min(x.e,t);
    return `<i style="left:${(s-f)/span*100}%;width:${(e-s)/span*100}%"></i>`}).join('')}</div>`}
function gapChips(d){return gapsOn(d).map(g=>`<button class="fgap" data-act="fillGap" data-d="${d}" data-s="${g[0]}" data-e="${g[1]}">
  ${fmtMin(g[0])}\u2013${fmtMin(g[1])} <b>${gapLen(g)} น.</b> \uff0b</button>`).join('')}

function wlRow(x){const p=pt(x.patientId);if(!p)return'';
  const ap=x.apptId?DB.appointments.find(a=>a.id===x.apptId):null;
  const calls=(x.calls||[]).length,ph=digits(p.phone);
  return `<div class="wq ${x.kind}">
    <div class="wqt"><span class="wtag ${x.kind}">${WL_KIND[x.kind]||''}</span>${x.prio==='urgent'?'<span class="wtag urg">ด่วน</span>':''}
      ${calls?`<span class="wcalls">โทรแล้ว ${calls} ครั้ง \u00b7 ล่าสุด ${thDate(x.calls[calls-1].at)}</span>`:''}</div>
    <div class="nm">${esc(p.name)} <span class="muted" style="font-weight:500">${esc(p.hn||'')}</span></div>
    <div class="hn">${x.kind==='resched'&&ap?`นัดเดิม ${thDate(ap.date)}${ap.time?' '+esc(ap.time):''} \u00b7 `:''}${esc(x.proc||(ap&&ap.proc)||'ไม่ระบุ')}${x.tooth?' \u00b7 ซี่ '+esc(x.tooth):''} \u00b7 ${x.dur||30} น.</div>
    ${x.note?`<div class="wnote">${esc(x.note)}</div>`:''}
    <div class="ac">
      ${ph.length>=9?`<a class="btn sm" href="tel:${ph}">${SI('phone')} โทร</a>`:''}
      <button class="btn sm pri" data-act="wlBook" data-id="${x.id}">นัดได้แล้ว</button>
      <button class="btn sm" data-act="wlMiss" data-id="${x.id}">ไม่รับสาย</button>
      <button class="btn sm" data-act="wlEdit" data-id="${x.id}">แก้ไข</button></div></div>`}

function vSlots(){
  const w=pmWin(),R=S.srange||14,days=[];
  for(let i=0;i<R;i++){const d=iso(new Date(Date.now()+i*864e5)),k=dayKind(d);if(k.skip)continue;
    if(d===TODAY&&!gapsOn(d).length&&toMin(w.to)<=new Date().getHours()*60+new Date().getMinutes())continue;
    days.push([d,k])}
  const totalFree=days.filter(([d,k])=>k.main).reduce((n,[d])=>n+gapsOn(d).reduce((a,g)=>a+gapLen(g),0),0);
  const q=wlWait();
  const dayRows=days.map(([d,k])=>{const g=gapsOn(d),free=g.reduce((a,x)=>a+gapLen(x),0),dt=parseD(d);
    const untimed=DB.appointments.filter(a=>a.date===d&&a.status!=='cancelled'&&!a.time&&a.session==='pm').length;
    return `<div class="fday ${k.main?'':'nomain'} ${g.length?'':'full'}">
      <div class="fdh"><button class="fdd" data-act="day" data-d="${d}"><b>${DOW[dt.getDay()]}. ${dt.getDate()} ${TH_M[dt.getMonth()]}</b>${d===TODAY?' <span class="tdy2">วันนี้</span>':''}</button>
        ${k.none?'':`<span class="frm"><i class="dot" style="background:${k.color}"></i>${esc(k.room)}</span>`}
        ${k.main?'':`<span class="fwarn">${SI('warn')} ${k.none?'ยังไม่ได้ตั้งห้อง':'ไม่ใช่วันฟุ้ง'}</span>`}
        <span class="fsum">${g.length?`ว่าง ${free} น.`:'เต็ม'}</span></div>
      ${pmBar(d)}
      ${g.length?`<div class="fgaps">${gapChips(d)}</div>`:''}
      ${untimed?`<div class="muted" style="font-size:11px;margin-top:5px">มีนัดบ่ายที่ไม่ระบุเวลา ${untimed} ราย \u2014 ยังไม่ได้หักออก</div>`:''}
    </div>`}).join('');
  return `<div class="sthead"><div><div class="eyebrow">FILL SLOTS</div>
      <h1 class="ptitle2">เติมช่องว่างตอนบ่าย</h1>
      <div class="pmw">ช่วงบ่าย <input type="time" class="xin sm" data-pm="from" value="${w.from}"> \u2013 <input type="time" class="xin sm" data-pm="to" value="${w.to}">
        <span class="muted">\u00b7 ช่องว่าง \u2265 ${MIN_GAP} น. \u00b7 วันฟุ้งว่างรวม ${totalFree} น.</span></div></div>
    <div class="row" style="gap:8px"><div class="seg sub">${[[14,'2 wk'],[28,'4 wk']].map(([n,t])=>
      `<button data-act="srange" data-n="${n}" class="${R===n?'on':''}">${t}</button>`).join('')}</div>
    <button class="btn pri" data-act="wlAdd">\uff0b เข้าคิว</button></div></div>
  <div class="fill">
    <div class="fq"><div class="fqh">${SI('phone')} ต้องโทร <span class="muted">\u00b7 ${q.length}</span></div>
      ${q.length?q.map(wlRow).join(''):`<div class="nempty">ยังไม่มีคิว \u2014 กด \uff0b เข้าคิว หรือกด "เข้าคิว" จากรายชื่อที่ยังไม่ได้นัดต่อ</div>`}</div>
    <div class="fslots">${dayRows||'<div class="empty">ไม่มีวันทำงานในช่วงนี้</div>'}</div>
  </div>`}

function vRooms(){
  const y=S.cur.getFullYear(),m=S.cur.getMonth(),P=S.plan;
  const start=new Date(y,m,1-new Date(y,m,1).getDay());let cells='';
  for(let i=0;i<42;i++){const dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=iso(dt),out=dt.getMonth()!==m;
    const s=daySch(k),w=s?wt(s.typeId):null;
    cells+=`<button class="cell ${out?'out':''} ${P.sel.has(k)?'psel':''}" data-act="pickDay" data-d="${k}" ${out?'disabled':''}>
      <div class="ctop"><span class="cn ${dt.getDay()===0?'sun':''}">${dt.getDate()}</span></div>
      ${w?`<div class="rl" style="color:${w.color}">${esc(s.room||w.room)}</div>`:''}</button>`}
  const roomOpts=DB.workTypes.filter(w=>w.id!=='off').map(w=>`<option value="${w.id}" ${P.typeId===w.id?'selected':''}>${esc(w.name)} — ${esc(w.room)}</option>`).join('');
  return `<div class="row sp" style="margin:22px 0 6px;flex-wrap:wrap;gap:14px">
      <div><div class="plab">CLINIC PLANNER</div><div class="ptitle mono">Plan clinic days</div>
      <div class="muted">เลือกหลายวัน แล้วตั้งห้องพร้อมกันทีเดียว</div></div>
      <div class="row"><button class="btn sm" data-act="mv" data-n="-1">‹</button>
      <b style="min-width:120px;text-align:center">${TH_MF[m]} ${y+543}</b>
      <button class="btn sm" data-act="mv" data-n="1">›</button></div></div>
    <div class="row" style="gap:14px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--line);margin-bottom:16px">
      ${DB.workTypes.map(w=>`<span class="row" style="gap:6px;font-size:12px;font-weight:600;color:var(--tx2)"><i class="dot" style="background:${w.color}"></i>${esc(w.name)}</span>`).join('')}</div>
    <div class="plan"><div><div class="cal"><div class="grid">${DOW.map(d=>`<div class="gh">${d}</div>`).join('')}</div><div class="grid">${cells}</div></div></div>
      <div class="side"><div class="plab">NEW PLAN</div>
        <div style="font-size:17px;font-weight:800;color:var(--ink);margin:2px 0 14px">ลงตารางหลายวัน</div>
        <div class="tabs"><button data-act="planMode" data-m="room" class="${P.mode==='room'?'on':''}">${SI('room')} ลงห้อง</button>
        <button data-act="planMode" data-m="off" class="${P.mode==='off'?'on':''}">${SI('caloff')} วันหยุด</button>
        <button data-act="planMode" data-m="clear" class="${P.mode==='clear'?'on':''}">${SI('eraser')} ล้าง</button></div>
        ${P.mode==='room'?`<div class="f"><label>ห้อง / ประเภทงาน</label><select data-plan="typeId">${roomOpts}</select></div>`:''}
        ${P.mode!=='clear'?`<div class="f"><label>หมายเหตุ</label><textarea rows="2" data-plan="note">${esc(P.note)}</textarea></div>`:''}
        <div class="f"><label>เลือกวันซ้ำ</label>
          <div class="dows" style="margin:6px 0 8px">${DOW.map((d,i)=>`<button data-act="dow" data-i="${i}" class="${P.dows.has(i)?'on':''}">${d}</button>`).join('')}</div>
          <div class="row"><select data-plan="every" style="flex:1;border:1px solid var(--line);padding:9px 10px;border-radius:var(--r);background:var(--surface)">
            <option value="all" ${P.every==='all'?'selected':''}>ทุกสัปดาห์</option>
            <option value="w13" ${P.every==='w13'?'selected':''}>สัปดาห์ที่ 1 และ 3</option>
            <option value="w24" ${P.every==='w24'?'selected':''}>สัปดาห์ที่ 2 และ 4</option></select>
          <button class="btn pri sm" data-act="applyDow">เลือกวัน</button></div></div>
        <div id="planWarn">${planWarnHTML()}</div>
        <div class="row sp" style="margin:12px 0"><b id="planCount">เลือกแล้ว ${P.sel.size} วัน</b>
        <button class="btn sm dg" data-act="clearSel">ล้างทั้งหมด</button></div>
        <button class="btn pri blk" data-act="savePlan">บันทึกทั้งหมด</button></div></div>`}
function planWarnHTML(){const P=S.plan,d=[...P.sel];if(!d.length)return'';
  if(P.mode==='off'){const c=d.filter(x=>apptsOn(x).length);
    return c.length?`<div class="warn">${SI('warn')} มี ${c.length} วันที่ยังมีนัดคนไข้อยู่</div>`:''}
  if(P.mode==='clear')return `<div class="warn">${SI('warn')} จะลบการตั้งค่าห้องของ ${d.length} วัน</div>`;
  const c=d.filter(x=>{const s=daySch(x);return s&&s.typeId!==P.typeId});
  return c.length?`<div class="warn">${SI('warn')} ${c.length} วันมีห้องเดิมอยู่แล้ว — จะเขียนทับ</div>`:''}
function refreshPlan(){const c=$('planCount'),w=$('planWarn');if(c)c.textContent=`เลือกแล้ว ${S.plan.sel.size} วัน`;if(w)w.innerHTML=planWarnHTML()}
function overdueAppts(){return DB.appointments.filter(a=>a.date<TODAY&&a.status==='scheduled')
  .sort((a,b)=>b.date.localeCompare(a.date)||(b.time||'').localeCompare(a.time||''))}
function overdueHTML(){
  const od=overdueAppts();if(!od.length)return '';
  return `<div class="odbox"><div class="row sp" style="flex-wrap:wrap;gap:8px">
    <b>${SI('clock')} ค้างอัปเดต ${od.length} นัด</b>
    <span class="muted" style="font-size:11.5px">เลยวันนัดแล้วแต่ยังเป็น “นัดไว้” — ปิดสถานะเพื่อให้ยอดนับถูกต้อง</span></div>
    ${od.slice(0,12).map(a=>{const p=pt(a.patientId);if(!p)return '';
      return `<div class="odrow"><div style="min-width:0"><b>${esc(p.name)}</b>
        <span class="muted"> · ${thDate(a.date)}${a.time?' '+esc(a.time):''}${a.proc?' · '+esc(a.proc):''}</span></div>
        <div class="odbtns"><button class="btn sm" data-act="setSt" data-id="${a.id}" data-s="done">มาแล้ว</button>
        <button class="btn sm" data-act="setSt" data-id="${a.id}" data-s="noshow">ไม่มา</button>
        <button class="btn sm dg" data-act="setSt" data-id="${a.id}" data-s="cancelled">ยกเลิก</button></div></div>`}).join('')}
    ${od.length>12?`<div class="muted" style="font-size:11.5px;margin-top:8px">และอีก ${od.length-12} นัด</div>`:''}</div>`}
const CASE_ST={dc:'จบเคสแล้ว',lost:'ไม่มาต่อ'};
function openCases(){
  const future=new Set(DB.appointments.filter(a=>a.date>=TODAY&&a.status==='scheduled').map(a=>a.patientId));
  const last={};
  DB.visits.forEach(v=>{if(!last[v.patientId]||v.date>last[v.patientId].date)last[v.patientId]=v});
  return Object.values(last).filter(v=>{const p=pt(v.patientId);return p&&!p.caseSt&&!future.has(v.patientId)})
    .sort((a,b)=>b.date.localeCompare(a.date))}
function openCasesHTML(){
  const oc=openCases();if(!oc.length)return '';
  return `<h2 style="margin-top:26px">ยังไม่ได้นัดครั้งต่อไป <span class="muted" style="font-size:13px;font-weight:600">· ${oc.length} ราย</span></h2>
    <div class="muted" style="margin:-6px 0 10px">รักษาไปแล้วแต่ยังไม่มีนัดล่วงหน้า — เช็กว่าจบเคสแล้วหรือตกหล่น</div>
    <div class="card">${oc.slice(0,25).map(v=>{const p=pt(v.patientId);
      return `<div class="pt"><div class="avatar">${esc(initials(p.name))}</div>
      <div style="min-width:0"><div class="nm">${esc(p.name)} ${catChip(p.cat)}</div>
      <div class="hn">รักษาล่าสุด ${thDate(v.date)}${v.proc?' · '+esc(v.proc):''}${v.tx?' · แผน: '+esc(v.tx):''}</div></div>
      <div class="ac"><button class="btn sm" data-act="caseSt" data-id="${p.id}" data-s="dc" title="รักษาครบแล้ว ไม่ต้องนัดต่อ">จบเคส</button>
      <button class="btn sm dg" data-act="caseSt" data-id="${p.id}" data-s="lost" title="คนไข้หายไป ไม่มาต่อ">ไม่มาต่อ</button>
      <button class="btn sm" data-act="wlAdd" data-p="${p.id}">เข้าคิว</button>
      <button class="btn sm pri" data-act="addAppt" data-p="${p.id}" data-d="${TODAY}">＋ นัด</button></div></div>`}).join('')}
      ${oc.length>25?`<div class="muted" style="margin-top:8px;font-size:11.5px">และอีก ${oc.length-25} ราย</div>`:''}</div>`}
function vUpcoming(){
  const list=filterAppts(DB.appointments.filter(a=>a.date>=TODAY&&a.status!=='cancelled'))
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99').localeCompare(b.time||'99'));
  if(!list.length)return `<h2>นัดที่จะถึง</h2>`+overdueHTML()+`<div class="empty">ยังไม่มีนัดล่วงหน้า</div>`+openCasesHTML();
  const by={};list.forEach(a=>(by[a.date]=by[a.date]||[]).push(a));
  return `<h2>นัดที่จะถึง <span class="muted" style="font-size:13px;font-weight:600">· ${list.length} นัด</span></h2>`+overdueHTML()+
    Object.entries(by).map(([d,as])=>{const dt=parseD(d),diff=Math.round((dt-parseD(TODAY))/864e5),s=daySch(d),w=s?wt(s.typeId):null;
      const shown=SESSIONS.filter(se=>as.some(a=>a.session===se.id));
      return `<div class="day"><div class="rail ${d===TODAY?'today':''}">
        <div class="dw">${DOWF[dt.getDay()]}</div><div class="dn">${dt.getDate()}</div><div class="dm">${TH_M[dt.getMonth()]} ${dt.getFullYear()+543}</div>
        ${w?`<span class="rl2" style="background:${w.color}22;color:${w.color};border:1px solid ${w.color}55">${esc(s.room||w.room)}</span>`:''}
        ${diff===0?'':`<span class="rl2 rdiff">${diff===1?'พรุ่งนี้':'อีก '+diff+' วัน'}</span>`}</div>
        <div class="slots">${shown.map(se=>{const l=as.filter(a=>a.session===se.id);
          return `<div class="slot ${se.id}"><h4><i class="dot" style="background:${se.c}"></i> ${se.name}</h4>${l.map(ptRow).join('')}</div>`}).join('')}</div></div>`}).join('')+openCasesHTML()}
function monthStats(y,m){
  const pre=`${y}-${String(m+1).padStart(2,'0')}`;
  const inM=DB.appointments.filter(a=>a.date.startsWith(pre));
  const done=inM.filter(a=>a.status==='done');
  const byRoom={},byCat={};
  done.forEach(a=>{const w=wt(a.typeId);if(w&&w.id!=='off')byRoom[w.id]=(byRoom[w.id]||0)+1;
    const p=pt(a.patientId),c=(p&&p.cat)||'ไม่ระบุ';byCat[c]=(byCat[c]||0)+1});
  const rank=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]);
  return {done:done.length,noshow:inM.filter(a=>a.status==='noshow').length,
    cancel:inM.filter(a=>a.status==='cancelled').length,
    pending:inM.filter(a=>a.status==='scheduled').length,
    rooms:rank(byRoom),cats:rank(byCat)};
}
function bars(rows,label){
  if(!rows.length)return '';
  const max=rows[0][1];
  return `<div class="stsec"><div class="stlab">${label}</div>${rows.map(([k,n])=>{
    const w=wt(k),nm=w&&w.id===k?w.name:k, col=w&&w.id===k?w.color:'var(--hl)';
    return `<div class="strow"><span class="stk">${esc(nm)}</span>
      <span class="stbar"><i style="width:${Math.round(n/max*100)}%;background:${col}"></i></span>
      <b class="stn">${n}</b></div>`}).join('')}</div>`}
const MON_EN=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function yearSeen(y){return MON_EN.map((_,i)=>monthStats(y,i).done)}
/* ---------- MORE: สรุป + เคสที่ต้องติดตาม ---------- */
function vMore(){
  const sb=S.sub==='stats'?'stats':'cases';
  const watch=DB.cases.filter(c=>(c.status||'watch')==='watch').length;
  return `<div class="row subrow"><div class="seg sub">
    <button data-act="sub" data-s="cases" class="${sb==='cases'?'on':''} ${caseDue().length?'alert':''}">Case notes${watch?` · ${watch}`:''}</button>
    <button data-act="sub" data-s="stats" class="${sb==='stats'?'on':''}">Summary</button>
    </div></div>`+(sb==='cases'?vCases():vStats());}

/* เคสที่ถึงกำหนดรีวิวแล้ว */
const caseDue=()=>DB.cases.filter(c=>(c.status||'watch')==='watch'&&c.review&&c.review<=TODAY);
const CASE_TPL={vpt:'VPT / Pulp cap',rct:'RCT',gen:'General'};
const KIND={tx:'Treatment',fu:'Follow-up'};
const ents=c=>(c.entries||[]).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
const lastEnt=c=>ents(c).slice(-1)[0]||{};
const caseDate=c=>(ents(c)[0]||{}).date||'';

/* ย่อสิ่งที่ติ๊กไว้ใน 1 entry ให้เป็นชิปอ่านเร็ว */
function entChips(e,type){const o=[];
  if(type==='rct'){
    if(e.dxP)o.push(e.dxP);
    if(e.dxA)o.push(e.dxA);
    if(e.cold)o.push('Cold '+({'+':'+ve','-':'\u2212ve','L':'Lingering'}[e.cold]||e.cold));
    if(e.ept)o.push('EPT '+e.ept);
  }
  if(e.perc)o.push('Perc '+(e.perc==='+'?'+ve':'\u2212ve'));
  if(e.palp)o.push('Palp '+(e.palp==='+'?'+ve':'\u2212ve'));
  if(e.mob)o.push('Mob '+e.mob);
  if(e.pd)o.push('PD '+e.pd);
  if(e.sinus==='Yes')o.push('Sinus tract');
  if((e.caries||[]).length)o.push('Caries '+e.caries.join(''));
  if(type==='vpt'){
    if(e.expo)o.push('Exp '+e.expo);
    if(e.hemo)o.push('Haemo '+(e.hemo==='Achieved'?'{ok}':'{x}'));
    if(e.cap)o.push(e.cap);
  }
  if(type==='rct'){
    const cn=(e.canals||[]).filter(x=>x.n||x.wl||x.maf);
    if(cn.length)o.push(cn.length+' canal'+(cn.length>1?'s':''));
    cn.forEach(x=>o.push([x.n,x.wl?x.wl+' mm':'',x.maf].filter(Boolean).join(' ')));
    if((e.irrig||[]).length)o.push(e.irrig.join(' + '));
    if(e.med&&e.med!=='None')o.push('Med '+e.med);
    if(e.obt&&e.obt!=='Not yet')o.push('Obturated'+(e.obtTech?' \u00b7 '+e.obtTech:''));
    if(e.sealer)o.push('Sealer '+e.sealer);
    if((e.restPlan||[]).length)o.push('Final: '+e.restPlan.join(' + '));
  }
  if((e.liner||[]).filter(x=>x!=='None').length)o.push(e.liner.filter(x=>x!=='None').join(' + '));
  if(e.interim&&e.interim!=='None')o.push('Interim '+e.interim);
  if(e.temp&&e.temp!=='None')o.push('Temp '+e.temp);
  if(e.fin&&e.fin!=='None')o.push(e.fin);
  return o}

function entryHTML(c,e,i,total){
  const chips=entChips(e,c.type);
  return `<div class="ent ${e.kind==='fu'?'fu':''}">
    <div class="edot"></div>
    <div class="ebody">
      <div class="ehead"><b>${thDate(e.date||TODAY)}</b>
        <span class="ekind ${e.kind==='fu'?'fu':''}">${KIND[e.kind]||'Treatment'}</span>
        ${i===total-1?'<span class="elast">ล่าสุด</span>':''}
        <span class="eac"><button class="btn sm" data-act="editEnt" data-id="${c.id}" data-e="${e.id}">แก้ไข</button></span></div>
      ${(e.sym||[]).length||e.symNote?`<div class="csym">${(e.sym||[]).map(x=>`<span class="chip" style="border-color:var(--line2);color:var(--tx2)">${esc(x)}</span>`).join('')}${e.symNote?` <span class="muted">${esc(e.symNote)}</span>`:''}</div>`:''}
      ${chips.length?`<div class="cchips">${chips.map(x=>`<span class="ck">${esc(x).replace('{ok}',IC.ok).replace('{x}',IC.x)}</span>`).join('')}</div>`:''}
      ${e.note?`<div class="cnote">${esc(e.note)}</div>`:''}
    </div></div>`}

function vCases(){
  const f=S.cfilter||'watch',q=(S.cq||'').trim().toLowerCase();
  let list=DB.cases.slice().sort((a,b)=>{
    const aw=(a.status||'watch')==='watch',bw=(b.status||'watch')==='watch';
    if(aw!==bw)return aw?-1:1;
    const ar=a.review||'9999',br=b.review||'9999';
    return ar!==br?ar.localeCompare(br):(lastEnt(b).date||'').localeCompare(lastEnt(a).date||'')});
  if(f!=='all')list=list.filter(c=>(c.status||'watch')===f);
  if(q)list=list.filter(c=>{const p=pt(c.patientId)||{};
    const txt=(p.name||'')+' '+(p.hn||'')+' '+(c.tooth||'')+' '+(CASE_TPL[c.type]||'')+' '
      +ents(c).map(e=>[e.note,e.symNote,e.cap,e.fin,e.dxP,e.dxA,e.med,(e.restPlan||[]).join(' ')].join(' ')).join(' ');
    return txt.toLowerCase().includes(q)});
  const cnt=k=>DB.cases.filter(c=>k==='all'||(c.status||'watch')===k).length;
  const head=`<div class="sthead"><div><div class="eyebrow">FOLLOW-UP</div>
      <h1 class="ptitle2">Case notes</h1></div>
    <button class="btn pri" data-act="addCase">\uff0b New case</button></div>
    <div class="row subrow" style="margin-top:0"><div class="seg sub">
      ${[['watch','Watching'],['done','Closed'],['all','All']].map(([k,t])=>
        `<button data-act="caseFilt" data-f="${k}" class="${f===k?'on':''}">${t} \u00b7 ${cnt(k)}</button>`).join('')}</div>
      <div class="asearch" style="flex:1 1 180px;max-width:260px">${SI('search')}
        <input id="cq" data-cq placeholder="ค้นหา ชื่อ / HN / ซี่ / วัสดุ" value="${esc(S.cq||'')}"></div></div>`;
  if(!list.length)return head+`<div class="empty">${DB.cases.length?'ไม่พบเคสที่ตรงกับตัวกรอง':'ยังไม่มีเคสที่ติดตาม \u2014 กด \uff0b New case เพื่อเริ่ม'}</div>`;
  return head+list.map(c=>{
    const p=pt(c.patientId),due=(c.status||'watch')==='watch'&&c.review&&c.review<=TODAY;
    const dd=c.review?Math.round((parseD(c.review)-parseD(TODAY))/864e5):null;
    const es=ents(c);
    return `<div class="ccard ${due?'due':''} ${(c.status||'watch')==='done'?'cdone':''}">
      <div class="chead">
        <div style="min-width:0">
          <div class="cname">${esc(p?p.name:'(ลบคนไข้แล้ว)')}${c.tooth?` <span class="ctooth">#${esc(c.tooth)}</span>`:''}
            <span class="ctpl">${esc(CASE_TPL[c.type]||c.type||'')}</span></div>
          <div class="cmeta">${esc(p&&p.hn?p.hn:'ไม่มี HN')} \u00b7 เริ่ม ${thDate(caseDate(c)||TODAY)} \u00b7 ${es.length} ครั้ง</div></div>
        <div class="ac">
          ${(c.status||'watch')==='watch'
            ?`<button class="btn sm" data-act="caseDone" data-id="${c.id}">ปิดเคส</button>`
            :`<button class="btn sm" data-act="caseOpen" data-id="${c.id}">ติดตามต่อ</button>`}
          <button class="btn sm dg" data-act="delCase" data-id="${c.id}">ลบเคส</button></div></div>
      <div class="tline">${es.map((e,i)=>entryHTML(c,e,i,es.length)).join('')}</div>
      <div class="cfoot">
        <button class="btn sm pri" data-act="addEnt" data-id="${c.id}">\uff0b บันทึกครั้งต่อไป</button>
        ${c.review?`<span class="crev ${due?'on':''}">Review ${thDate(c.review)}${(c.status||'watch')==='watch'?` \u00b7 ${dd<0?`เลยมา ${-dd} วัน`:dd===0?'วันนี้':`อีก ${dd} วัน`}`:''}</span>`:'<span class="crev" style="font-weight:500;opacity:.7">ยังไม่ได้ตั้งวันรีวิว</span>'}
      </div></div>`}).join('');}
/* ---------- แจ้งเตือนเงียบ ๆ: พรุ่งนี้ / รีวิว / ค้างอัปเดต ---------- */
function notis(){
  const tmr=iso(new Date(Date.now()+864e5));
  return{tomorrow:liveOn(tmr).filter(a=>a.status==='scheduled'),
         today:liveOn(TODAY).filter(a=>a.status==='scheduled'),
         due:caseDue(),
         overdue:overdueAppts(),
         calls:wlWait(),
         fill:(()=>{const d=tmr,k=dayKind(d);if(k.skip||!k.main)return null;
           const g=gapsOn(d);return g.length?{d,g,free:g.reduce((a,x)=>a+gapLen(x),0)}:null})()}}
const notiCount=()=>{const n=notis();return n.tomorrow.length+n.today.length+n.due.length+n.overdue.length+n.calls.length+(n.fill?1:0)};
function renderNoti(){
  const n=notis(),L=[];
  const apRow=(a,cls)=>{const p=pt(a.patientId);
    return `<button class="nrow ${cls||''}" data-act="goDay" data-d="${a.date}">
      <i>${esc(a.time||'—')}</i><span><b>${esc(p?p.name:'—')}</b>
      <small>${esc(a.proc||'ไม่ระบุ')}${a.tooth?' \u00b7 ซี่ '+esc(a.tooth):''}</small></span></button>`};
  if(n.today.length)L.push(`<div class="ntitle">วันนี้ \u00b7 ${n.today.length} นัด</div>`+n.today.map(a=>apRow(a)).join(''));
  if(n.tomorrow.length)L.push(`<div class="ntitle">พรุ่งนี้ \u00b7 ${n.tomorrow.length} นัด</div>`+n.tomorrow.map(a=>apRow(a)).join(''));
  if(n.due.length)L.push(`<div class="ntitle">ถึงกำหนดรีวิว \u00b7 ${n.due.length} เคส</div>`+n.due.map(c=>{
    const p=pt(c.patientId),dd=Math.round((parseD(c.review)-parseD(TODAY))/864e5);
    return `<button class="nrow warn2" data-act="goCase" data-id="${c.id}">
      <i>${dd<0?'เลย '+(-dd)+' วัน':'วันนี้'}</i><span><b>${esc(p?p.name:'—')}${c.tooth?' #'+esc(c.tooth):''}</b>
      <small>${esc(CASE_TPL[c.type]||'')} \u00b7 ${thDate(c.review)}</small></span></button>`}).join(''));
  if(n.fill)L.push(`<div class="ntitle">พรุ่งนี้บ่ายยังว่าง \u00b7 ${n.fill.free} น.</div>`+n.fill.g.map(g=>
    `<button class="nrow" data-act="goPlan"><i>${fmtMin(g[0])}</i><span><b>ว่างถึง ${fmtMin(g[1])}</b><small>${gapLen(g)} นาที \u2014 เติมจากคิวได้</small></span></button>`).join(''));
  if(n.calls.length)L.push(`<div class="ntitle">ต้องโทร \u00b7 ${n.calls.length} คน</div>`+n.calls.slice(0,5).map(x=>{const p=pt(x.patientId);
    return `<button class="nrow" data-act="goPlan"><i>${x.kind==='resched'?'เลื่อน':'เติม'}</i><span><b>${esc(p?p.name:'—')}</b><small>${esc(x.proc||'')}${x.note?' \u00b7 '+esc(x.note):''}</small></span></button>`}).join(''));
  if(n.overdue.length)L.push(`<div class="ntitle">ค้างอัปเดต \u00b7 ${n.overdue.length} นัด</div>`+n.overdue.slice(0,6).map(a=>apRow(a,'warn2')).join(''));
  $('npanel').innerHTML=L.length?L.join(''):`<div class="nempty">ไม่มีอะไรต้องตามตอนนี้</div>`}
function syncBell(){const b=$('bellBtn');if(b)b.classList.toggle('has',notiCount()>0)}
function vStats(){
  const y=S.cur.getFullYear(),m=S.cur.getMonth(),s=monthStats(y,m);
  const ys=yearSeen(y),yTot=ys.reduce((a,b)=>a+b,0),yMax=Math.max(1,...ys);
  const best=ys.indexOf(Math.max(...ys));
  const booked=s.done+s.noshow+s.cancel;
  const pc=n=>booked?Math.round(n/booked*100)+'% ของที่นัด':'—';
  const days=new Set(DB.appointments.filter(a=>a.status==='done'&&a.date.startsWith(`${y}-${String(m+1).padStart(2,'0')}`)).map(a=>a.date)).size;
  return `<div class="sthead">
    <div><div class="eyebrow">MONTHLY OVERVIEW</div><h1 class="ptitle2">${TH_MF[m]} ${y+543}</h1></div>
    <div class="ynav"><button data-act="mv" data-n="-1" aria-label="เดือนก่อน">‹</button>
      <span>${MON_EN[m]}</span><button data-act="mv" data-n="1" aria-label="เดือนถัดไป">›</button></div></div>

  <div class="stgrid">
    <div class="stcell"><div class="eyebrow">PATIENTS SEEN</div><b>${s.done}</b><small>${days?`เฉลี่ย ${(s.done/days).toFixed(1)} คน/วันตรวจ`:'ยังไม่มีวันตรวจ'}</small></div>
    <div class="stcell"><div class="eyebrow">NO-SHOW</div><b>${s.noshow}</b><small>${pc(s.noshow)}</small></div>
    <div class="stcell"><div class="eyebrow">CANCELLED</div><b>${s.cancel}</b><small>${pc(s.cancel)}</small></div>
    <div class="stcell hi"><div class="eyebrow">STILL OPEN</div><b>${s.pending}</b><small>ยังไม่ปิดสถานะ</small></div>
  </div>

  <div class="sechead"><span class="pill">12 MONTHS</span><span class="sect">คนไข้ที่มาต่อเดือน</span>
    <span class="secr">Total <b>${yTot}</b></span></div>
  <div class="chart">${ys.map((n,i)=>`<div class="cb ${i===m?'on':''}" title="${MON_EN[i]} ${n}">
    <i style="height:${Math.max(2,Math.round(n/yMax*100))}%"></i><span>${MON_EN[i]}</span></div>`).join('')}</div>
  <div class="foot3">
    <div><div class="eyebrow">BEST MONTH</div><b>${MON_EN[best]} · ${ys[best]}</b></div>
    <div><div class="eyebrow">DAYS WITH PATIENTS</div><b>${days}</b></div>
    <div><div class="eyebrow">MONTH SHARE</div><b>${yTot?Math.round(s.done/yTot*100):0}%</b></div>
  </div>

  ${s.rooms.length?`<div class="sechead"><span class="pill">BY ROOM</span><span class="sect">แยกตามห้อง</span></div>
  <table class="dt"><thead><tr><th>ROOM</th><th class="n">SEEN</th><th class="n">SHARE</th></tr></thead>
  <tbody>${s.rooms.map(([k,n])=>{const w=wt(k);
    return `<tr><td><i class="rdot" style="background:${w?w.color:'var(--hl)'};display:inline-block;margin-right:7px;vertical-align:-1px"></i>${esc(w?w.name:k)}</td>
    <td class="n">${n}</td><td class="n muted">${Math.round(n/s.done*100)}%</td></tr>`}).join('')}</tbody></table>`:''}

  ${s.cats.length?`<div class="sechead"><span class="pill">BY CASE</span><span class="sect">แยกตามประเภทเคส</span></div>
  <table class="dt"><thead><tr><th>TYPE</th><th class="n">SEEN</th><th class="n">SHARE</th></tr></thead>
  <tbody>${s.cats.map(([k,n])=>`<tr><td>${esc(k)}</td><td class="n">${n}</td>
    <td class="n muted">${Math.round(n/s.done*100)}%</td></tr>`).join('')}</tbody></table>`:''}

  ${!s.done?`<div class="empty" style="margin-top:20px">เดือนนี้ยังไม่มีคนไข้ที่บันทึกว่า “มาแล้ว”</div>`:''}
  <div class="row" style="margin-top:24px"><button class="btn sm" data-act="copyStats">คัดลอกเป็นข้อความ</button></div>`}
function statsText(){
  const y=S.cur.getFullYear(),m=S.cur.getMonth(),s=monthStats(y,m);
  const L=[`สรุปงาน ${TH_MF[m]} ${y+543}`,`มาแล้ว ${s.done} · ไม่มา ${s.noshow} · ยกเลิก ${s.cancel}`];
  if(s.rooms.length){L.push('','แยกตามห้อง');s.rooms.forEach(([k,n])=>{const w=wt(k);L.push(`  ${w&&w.id===k?w.name:k}  ${n}`)})}
  if(s.cats.length){L.push('','แยกตามประเภทเคส');s.cats.forEach(([k,n])=>L.push(`  ${k}  ${n}`))}
  return L.join('\n')}
function vArchive(){
  const cf=S.cat||'all';
  const res=DB.patients.filter(p=>match(p,S.q)&&(cf==='all'||p.cat===cf)).sort((a,b)=>(a.hn||'').localeCompare(b.hn||''));
  const left=`<div class="card"><div class="row sp"><h3 style="margin:0">คนไข้ (${res.length})</h3>
    <button class="btn sm pri" data-act="addPatient">＋ ใหม่</button></div>
    <div class="asearch">${SI('search')}
    <input id="aq" data-q placeholder="ค้นหา HN / ชื่อ / เบอร์โทร" value="${esc(S.q)}"></div>
    <div class="cfil"><button class="cf ${cf==='all'?'on':''}" data-act="catFil" data-c="all">ทั้งหมด</button>
    ${(DB.categories||[]).map(c=>{const n=DB.patients.filter(p=>p.cat===c).length;if(!n)return '';
      return `<button class="cf ${cf===c?'on':''}" data-act="catFil" data-c="${esc(c)}">${esc(c)} <b>${n}</b></button>`}).join('')}</div>
    <div style="max-height:70vh;overflow:auto"><table style="margin-top:10px"><tbody>${res.map(p=>`<tr class="${S.sel===p.id?'sel':''}" style="cursor:pointer" data-act="selP" data-id="${p.id}">
    <td><b>${esc(p.hn||'—')}</b> ${catChip(p.cat)}<div class="hn muted">${esc(p.name)}</div></td>
    <td style="text-align:right" class="muted">${DB.visits.filter(v=>v.patientId===p.id).length}</td></tr>`).join('')||'<tr><td class="muted">ไม่พบคนไข้</td></tr>'}</tbody></table></div></div>`;
  let right=`<div class="empty">เลือกคนไข้จากรายการซ้าย หรือค้นหาด้วย HN / ชื่อ / เบอร์</div>`;
  const p=pt(S.sel);
  if(p){const vs=DB.visits.filter(v=>v.patientId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
    const ap=DB.appointments.filter(a=>a.patientId===p.id&&a.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date));
    right=`<div class="card"><div class="row sp" style="flex-wrap:wrap"><div class="row">
      <div class="avatar" style="width:46px;height:46px;flex:0 0 46px;font-size:16px">${esc(initials(p.name))}</div>
      <div><div style="font-size:18px;font-weight:800;color:var(--ink)">${esc(p.name)} ${catChip(p.cat)}</div>
      <div class="muted">${esc(p.hn||'ไม่มี HN')} · ${esc(p.sex||'-')} · ${p.age||'-'} ปี · ${p.phone?telLink(p.phone):'ไม่มีเบอร์'}</div></div></div>
      <div class="row">${p.caseSt?`<button class="btn sm" data-act="caseSt" data-id="${p.id}" data-s="${p.caseSt}" title="กดเพื่อเปิดเคสอีกครั้ง">${CASE_ST[p.caseSt]} ${IC.x}</button>`:''}
      <button class="btn sm dg" data-act="delPatient" data-id="${p.id}">ลบ</button>
      <button class="btn sm" data-act="editPatient" data-id="${p.id}">แก้ไข</button>
      <button class="btn sm pri" data-act="addAppt" data-p="${p.id}" data-d="${TODAY}">＋ นัดใหม่</button></div></div>
      ${(p.tags||[]).length?`<div class="row" style="gap:6px;margin-top:11px;flex-wrap:wrap">${p.tags.map(t=>`<span class="chip" style="border-color:var(--dngLn);color:var(--dng);background:var(--dngBg)">${SI('warn')} ${esc(t)}</span>`).join('')}</div>`:''}
      ${p.note?`<div class="note" style="margin-top:11px">${SI('note')} ${esc(p.note)}</div>`:''}
      <h3>นัดหมายที่จะถึง (${ap.length})</h3>
      ${ap.map(a=>{const w=wt(a.typeId);return`<div class="pt"><div class="avatar" style="background:${w.color}18;color:${w.color};border-color:${w.color}55">${esc(w.short)}</div>
        <div><div class="nm">${thDate(a.date)}${a.time?' · '+esc(a.time):''}</div>
        <div class="hn">${esc(a.room)} · ${esc(a.proc||'-')}</div></div>
        <div class="ac"><button class="btn sm" data-act="editAppt" data-id="${a.id}">แก้ไข</button>
        <button class="btn sm pri" data-act="checkin" data-id="${a.id}">เช็คอิน</button></div></div>`}).join('')||'<div class="muted">ไม่มีนัดล่วงหน้า</div>'}
      <h3>Case History · Visits (${vs.length})</h3>
      <div class="tl">${vs.map(v=>{const w=wt(v.typeId);return`<div class="it"><div class="row sp" style="flex-wrap:wrap"><b>${thDate(v.date)}
        <span class="chip" style="border-color:${w.color}55;color:${w.color};background:${w.color}15">${esc(w.name)}</span></b>
        <button class="btn sm" data-act="editVisit" data-id="${v.id}">บันทึก/แก้ไข</button></div>
        <div class="muted" style="margin-top:4px">${esc(v.proc||'-')}${v.tooth?' · ซี่ '+esc(v.tooth):''}</div>
        ${v.dx?`<div class="muted"><b>Dx:</b> ${esc(v.dx)}</div>`:''}
        ${v.tx?`<div class="muted"><b>Tx plan:</b> ${esc(v.tx)}</div>`:''}
        ${v.note?`<div class="muted">${esc(v.note)}</div>`:''}</div>`}).join('')||'<div class="muted">ยังไม่มีประวัติ</div>'}</div></div>`}
  return `<h2>ทะเบียนคนไข้</h2><div class="split">${left}${right}</div>`}
function vSettings(){
  const dups=dupPatients(),bks=backupList();
  return `<h2>ธีมสี</h2>
  <div class="card">${[[false,'สว่าง'],[true,'มืด']].map(([dk,lbl])=>`
    <div class="thlab">${lbl}</div>
    <div class="thgrid">${THEMES.filter(x=>x.dark===dk).map(x=>`<button class="th ${DB.theme===x.id?'on':''}" data-act="setTheme" data-id="${x.id}"
      style="background:${x.v.bg};color:${x.v.ink||x.v.hl}"><span class="thn">${x.name}</span>
      <span class="sws">${x.sw.map(c=>`<i class="sw" style="background:${c}"></i>`).join('')}</span></button>`).join('')}</div>`).join('')}
  <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm" data-act="export">${SI('down')} สำรองข้อมูล</button>
  <button class="btn sm" data-act="import">${SI('up')} นำเข้าไฟล์</button>
  </div>
  <div class="acct">${SYNC.on
    ?`<div><b>เข้าสู่ระบบแล้ว</b><div class="muted">${esc(SYNC.email||'')} — ข้อมูลซิงก์ข้ามเครื่องอัตโนมัติ</div></div>
      <button class="btn sm dg" data-act="logout">ออกจากระบบ</button>`
    :`<div><b>ยังไม่ได้เข้าสู่ระบบ</b><div class="muted">${SUPA_URL?'ข้อมูลเก็บในเครื่องนี้เท่านั้น ยังไม่ซิงก์':'ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์ซิงก์'}</div></div>
      ${SUPA_URL?`<button class="btn sm pri" data-act="login">เข้าสู่ระบบ</button>`:''}`}</div></div>
  <h2>ตั้งค่าห้อง / ประเภทงาน</h2>
  <div class="card"><div class="muted" style="margin-bottom:12px">สีคือจุดบนปฏิทิน — <b>หนึ่งวันเลือกได้ห้องเดียว</b></div>
  <div class="wtlist">${DB.workTypes.map(w=>`<div class="wt">
    <label class="swatch" style="--c:${w.color}" title="เลือกสี"><input type="color" value="${w.color}" data-wt="${w.id}" data-f="color"></label>
    <div class="wtf"><span>ชื่อที่แสดง</span><input value="${esc(w.name)}" data-wt="${w.id}" data-f="name"></div>
    <div class="wtf sm"><span>ย่อ</span><input value="${esc(w.short)}" data-wt="${w.id}" data-f="short"></div>
    <div class="wtf"><span>ห้อง</span><input value="${esc(w.room)}" data-wt="${w.id}" data-f="room"></div>
    <div class="wtf"><span>กลุ่ม</span><input value="${esc(w.group)}" data-wt="${w.id}" data-f="group"></div>
    <button class="wtdel" data-act="delWT" data-id="${w.id}" title="ลบห้องนี้" aria-label="ลบ">${IC.x}</button></div>`).join('')}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri sm" data-act="addWT">＋ เพิ่มห้อง</button>
  <button class="btn dg sm" data-act="reset" style="margin-left:auto">ล้างข้อมูลทั้งหมด</button></div></div>
  <h2>ข้อมูลสำรองบนคลาวด์ <span class="muted" style="font-size:12px;font-weight:600">· เก็บวันละ 1 ชุด ย้อนหลัง 60 วัน</span></h2>
  <div class="card"><div class="muted" style="margin-bottom:10px">กันกรณีข้อมูลหลักเสียหายหรือเผลอนำเข้าไฟล์ผิด — ต้องสร้างตาราง <b>clinic_backups</b> ใน Supabase ก่อน (ดู SQL ที่ท้ายหน้านี้)</div>
  <div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="loadSnaps">โหลดรายการสำรอง</button></div>
  <div id="snapBox"></div></div>

  <h2>สำรองข้อมูลอัตโนมัติ</h2>
  <div class="card"><div class="muted" style="margin-bottom:10px">เก็บสแนปช็อตย้อนหลัง 7 วันอัตโนมัติ</div>
  ${bks.map(k=>`<div class="pt"><div class="avatar">${SI('save')}</div><div><div class="nm">${thDate(k.replace(BK,''))}</div>
    <div class="hn">${k.replace(BK,'')}</div></div>
    <div class="ac"><button class="btn sm" data-act="restoreBk" data-id="${k}">กู้คืน</button></div></div>`).join('')||'<div class="muted">ยังไม่มีสแนปช็อต</div>'}
  <div class="row" style="margin-top:12px"><button class="btn" data-act="export">${SI('down')} สำรองเป็นไฟล์</button>
  <button class="btn" data-act="import">${SI('up')} นำเข้าไฟล์</button></div></div>
  <h2>ถังขยะ <span class="muted" style="font-size:12px;font-weight:600">· เก็บไว้ ${TRASH_DAYS} วันแล้วลบถาวรอัตโนมัติ</span></h2>
  <div class="card">${(DB.trash||[]).length?`
    ${DB.trash.map(t=>{const days=Math.max(0,TRASH_DAYS-Math.floor((Date.now()-t.at)/864e5));
      return `<div class="pt"><div class="avatar">${SI('trash')}</div>
      <div style="min-width:0"><div class="nm">${esc(t.label||'รายการที่ลบ')}</div>
      <div class="hn">ลบเมื่อ ${thDate(new Date(t.at).toISOString().slice(0,10))} · เหลืออีก ${days} วัน${t.appts&&t.appts.length>1?` · ${t.appts.length} นัด`:''}</div></div>
      <div class="ac"><button class="btn sm pri" data-act="restoreTrash" data-id="${t.tid}">กู้คืน</button>
      <button class="btn sm dg" data-act="dropTrash" data-id="${t.tid}">ลบถาวร</button></div></div>`}).join('')}
    <div class="row" style="margin-top:12px"><button class="btn sm dg" data-act="emptyTrash">ล้างถังขยะทั้งหมด</button></div>`
    :`<div class="ok">${IC.ok} ถังขยะว่าง</div>`}</div>

  <h2>SQL สำหรับตารางสำรองบนคลาวด์</h2>
  <div class="card"><div class="muted" style="margin-bottom:8px">รันครั้งเดียวใน Supabase → SQL Editor</div>
  <pre class="sql">create table if not exists clinic_backups (
  id bigserial primary key,
  row_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists clinic_backups_row_created
  on clinic_backups (row_id, created_at desc);
alter table clinic_backups enable row level security;
create policy "auth users only" on clinic_backups
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');</pre></div>

  <h2>ตรวจสอบคนไข้ซ้ำ</h2>
  <div class="card">${dups.length?dups.map(g=>`<div style="margin-bottom:12px">
    <div class="warn">พบข้อมูลซ้ำ (${g.k.startsWith('hn')?'HN':'เบอร์โทร'}เดียวกัน)</div>
    ${g.v.map(p=>`<div class="pt"><div class="avatar">${esc(initials(p.name))}</div>
      <div><div class="nm">${esc(p.name)}</div><div class="hn">${esc(p.hn)} · ${DB.appointments.filter(a=>a.patientId===p.id).length} นัด / ${DB.visits.filter(v=>v.patientId===p.id).length} visit</div></div>
      <div class="ac"><button class="btn sm" data-act="editPatient" data-id="${p.id}">แก้ไข</button>
      <button class="btn sm dg" data-act="delPatient" data-id="${p.id}">ลบ</button></div></div>`).join('')}</div>`).join('')
    :`<div class="ok">${IC.ok} ไม่พบคนไข้ซ้ำในระบบ</div>`}</div>`}

/* ---------- THEME PANEL ---------- */
function renderThemePanel(){
  const grp=(dk,lbl)=>`<div class="lb">${lbl}</div>`+THEMES.filter(x=>x.dark===dk).map(x=>
    `<button class="th ${DB.theme===x.id?'on':''}" data-act="setTheme" data-id="${x.id}"><span class="thn">${x.name}</span>
     <span class="sws">${x.sw.map(c=>`<i class="sw" style="background:${c}"></i>`).join('')}</span></button>`).join('');
  $('tpanel').innerHTML=grp(false,SI('sun')+' ธีมสว่าง')+`<div class="hr"></div>`+grp(true,SI('moon')+' ธีมมืด')
   +`<div class="hr"></div><div class="lb">ข้อมูล</div>
   <div class="row" style="gap:8px"><button class="btn sm" style="flex:1" data-act="export">${SI('down')} สำรอง</button>
   <button class="btn sm" style="flex:1" data-act="import">${SI('up')} นำเข้า</button></div>
   ${SYNC.on?`<button class="btn sm blk" style="margin-top:8px" data-act="logout">ออกจากระบบ</button>`:''}`}
