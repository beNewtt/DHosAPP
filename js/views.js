/* ===== views.js =====
   ฟังก์ชันวาดหน้าจอทุกหน้า — ปฏิทิน / รายวัน / นัดที่จะถึง / สรุป / ทะเบียน / ตั้งค่า
   ===================================================== */

/* ---------- RENDER ---------- */
const app=document.getElementById('app'),$=x=>document.getElementById(x);
function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));
  document.body.dataset.v=S.view;
  app.innerHTML=S.view==='schedule'?vSchedule():S.view==='planner'?vPlanner():S.view==='stats'?vStats():S.view==='upcoming'?vUpcoming():S.view==='archive'?vArchive():vSettings();
}
function vSchedule(){const y=S.cur.getFullYear(),m=S.cur.getMonth(),od=overdueAppts().length;
  const hero=S.mode==='up'?'':`<div class="hero"><div class="num mono">${String(m+1).padStart(2,'0')}</div>
    <div class="rt"><div class="mn">${TH_MF[m]}</div><div class="yr">${y+543}</div>
    <div class="nav2"><button data-act="mv" data-n="-1" aria-label="เดือนก่อน"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><button data-act="mv" data-n="1" aria-label="เดือนถัดไป"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button></div></div></div>`;
  return hero+`<div class="tools"><div class="seg">
    <button data-act="mode" data-m="cal" class="${S.mode==='cal'?'on':''}">Month</button>
    <button data-act="mode" data-m="up" class="${S.mode==='up'?'on':''} ${od?'alert':''}">Upcoming</button>
    <button data-act="mode" data-m="list" class="${S.mode==='list'?'on':''}">Day list</button></div>
    <div class="tright"><button class="ico-sm" data-act="today" title="วันนี้" aria-label="วันนี้"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M12 1.6v2.6M12 19.8v2.6M22.4 12h-2.6M4.2 12H1.6"/></svg></button>
    <button class="btn pri sm" data-act="addAppt" data-d="${TODAY}">＋ เพิ่มนัด</button></div></div>`
  +(S.mode==='cal'?calendar(y,m):S.mode==='up'?vUpcoming():dayList(y,m))}
function calendar(y,m){
  const start=new Date(y,m,1-new Date(y,m,1).getDay());
  let cells='';
  for(let i=0;i<42;i++){
    const dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=iso(dt);
    const out=dt.getMonth()!==m,s=daySch(k),w=s?wt(s.typeId):null;
    if(S.filter!=='all'&&(!w||w.id!==S.filter)){cells+=`<div class="cell ${out?'out':''}" style="opacity:.3"><div class="ctop"><span class="cn ${dt.getDay()===0?'sun':''}">${dt.getDate()}</span></div></div>`;continue}
    const n=liveOn(k).length,tdy=k===TODAY,mk=w&&(w.id==='off'||w.id==='scr');
    cells+=`<div class="cell ${out?'out':''} ${tdy?'tdy':''} ${mk&&!tdy?'mark':''}" ${mk?`style="--mk:${w.color}"`:''} role="button" tabindex="0" data-act="addAppt" data-d="${k}" title="คลิกเพื่อเพิ่มนัดวันนี้">
      <div class="ctop"><span class="cn ${dt.getDay()===0?'sun':''}">${dt.getDate()}</span></div>
      <div class="cmid">${w?`<div class="rline"><i class="rdot" style="background:${w.color}"></i><span class="rl" style="color:${tdy?'var(--onhl)':w.color}">${esc(s.room||w.room)}</span></div>`:''}
      ${s&&s.note?`<div class="rl sub" style="color:var(--tx2);font-weight:500">${esc(s.note)}</div>`:''}</div>
      <div class="cbot">${n?`<span class="cnt">${n}<i> คน</i></span>`:''}</div></div>`}
  return `<div class="cal"><div class="grid">${DOW.map(d=>`<div class="gh">${d}</div>`).join('')}</div><div class="grid">${cells}</div></div>
    <div class="filters"><button class="fl ${S.filter==='all'?'on':''}" data-act="filt" data-f="all">ทั้งหมด</button>
    ${DB.workTypes.map(w=>`<button class="fl ${S.filter===w.id?'on':''}" data-act="filt" data-f="${w.id}"><i class="dot" style="background:${w.color}"></i>${esc(w.name)}</button>`).join('')}</div>`}
function dayList(y,m){
  const last=new Date(y,m+1,0).getDate();let out='',any=false;
  out+=`<div class="row" style="margin-bottom:12px;gap:8px;flex-wrap:wrap">
    <div class="seg"><button data-act="busy" data-v="1" class="${S.onlyBusy?'on':''}">เฉพาะวันที่มีนัด</button>
    <button data-act="busy" data-v="0" class="${!S.onlyBusy?'on':''}">ทุกวันที่มีงาน</button></div>
    ${S.q?`<span class="chip" style="border-color:var(--line);color:var(--tx2)">กรอง “${esc(S.q)}”</span>`:''}</div>`;
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
        ${s&&s.note?`<div class="note">📌 ${esc(s.note)}</div>`:''}
        ${off?`<div class="slot" style="border-left-color:#9aa0b5"><h4>🚫 วันหยุด (OFF)</h4></div>`:''}
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
  const al=(p.tags||[]).length?`<span class="chip" style="border-color:var(--dngLn);color:var(--dng);background:var(--dngBg)">⚠ ${esc(p.tags[0])}</span>`:'';
  const ST={scheduled:'นัดไว้',done:'มาแล้ว',cancelled:'ยกเลิก',noshow:'ไม่มา'};
  return `<div class="pt ${a.status==='cancelled'?'cx':''}">
    <div class="ptinfo">
      <div class="ptop">${a.time?`<span class="ptime">${esc(a.time)}<i>${a.duration||30} น.</i></span>`:''}
        <span class="st ${a.status}">${ST[a.status]}</span>
        ${(a.moves||[]).length?`<span class="mv">เลื่อน ${a.moves.length}×</span>`:''}</div>
      <div class="nm">${esc(p.name)} ${catChip(p.cat)} ${al}</div>
      <div class="hn">${esc(p.hn||'ไม่มี HN')}${p.phone?' · '+telLink(p.phone):''} · ${esc(a.proc||'ไม่ระบุ')}${a.tooth?' · ซี่ '+esc(a.tooth):''}</div>
    </div>
    <div class="ac">
    ${a.status==='scheduled'
      ?`<button class="btn sm pri" data-act="checkin" data-id="${a.id}">✓ มาแล้ว</button>
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
   <div class="mfoot"><button class="btn" data-act="close">ยกเลิก</button>
   <button class="btn pri" data-act="saveResched" data-id="${id}">บันทึกการเลื่อน</button></div>`);
  const rw=()=>{const b=$('rswarn');if(!b)return;const c=clashAt($('rsd').value,$('rst').value,a.duration,a.id);
    b.innerHTML=c?`<span style="color:var(--wrn);font-weight:700">⚠ เวลาทับกับ ${esc(clashMsg(c))}</span>`:''};
  ['rsd','rst'].forEach(k=>{const el=$(k);if(el)el.addEventListener('input',rw)});rw()}
function vPlanner(){
  const y=S.cur.getFullYear(),m=S.cur.getMonth(),P=S.plan;
  const start=new Date(y,m,1-new Date(y,m,1).getDay());let cells='';
  for(let i=0;i<42;i++){const dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=iso(dt),out=dt.getMonth()!==m;
    const s=daySch(k),w=s?wt(s.typeId):null;
    cells+=`<button class="cell ${out?'out':''} ${P.sel.has(k)?'pk':''}" data-act="pickDay" data-d="${k}" ${out?'disabled':''}>
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
        <div class="tabs"><button data-act="planMode" data-m="room" class="${P.mode==='room'?'on':''}">🏥 ลงห้อง</button>
        <button data-act="planMode" data-m="off" class="${P.mode==='off'?'on':''}">🗓 วันหยุด</button>
        <button data-act="planMode" data-m="clear" class="${P.mode==='clear'?'on':''}">🧹 ล้าง</button></div>
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
    return c.length?`<div class="warn">⚠ มี ${c.length} วันที่ยังมีนัดคนไข้อยู่</div>`:''}
  if(P.mode==='clear')return `<div class="warn">⚠ จะลบการตั้งค่าห้องของ ${d.length} วัน</div>`;
  const c=d.filter(x=>{const s=daySch(x);return s&&s.typeId!==P.typeId});
  return c.length?`<div class="warn">⚠ ${c.length} วันมีห้องเดิมอยู่แล้ว — จะเขียนทับ</div>`:''}
function refreshPlan(){const c=$('planCount'),w=$('planWarn');if(c)c.textContent=`เลือกแล้ว ${S.plan.sel.size} วัน`;if(w)w.innerHTML=planWarnHTML()}
function overdueAppts(){return DB.appointments.filter(a=>a.date<TODAY&&a.status==='scheduled')
  .sort((a,b)=>b.date.localeCompare(a.date)||(b.time||'').localeCompare(a.time||''))}
function overdueHTML(){
  const od=overdueAppts();if(!od.length)return '';
  return `<div class="odbox"><div class="row sp" style="flex-wrap:wrap;gap:8px">
    <b>⏰ ค้างอัปเดต ${od.length} นัด</b>
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
        <span class="rl2" style="background:var(--infBg);color:var(--inf)">${diff===0?'วันนี้':diff===1?'พรุ่งนี้':'อีก '+diff+' วัน'}</span></div>
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
    <div class="asearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>
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
      <div class="row">${p.caseSt?`<button class="btn sm" data-act="caseSt" data-id="${p.id}" data-s="${p.caseSt}" title="กดเพื่อเปิดเคสอีกครั้ง">${CASE_ST[p.caseSt]} ✕</button>`:''}
      <button class="btn sm dg" data-act="delPatient" data-id="${p.id}">ลบ</button>
      <button class="btn sm" data-act="editPatient" data-id="${p.id}">แก้ไข</button>
      <button class="btn sm pri" data-act="addAppt" data-p="${p.id}" data-d="${TODAY}">＋ นัดใหม่</button></div></div>
      ${(p.tags||[]).length?`<div class="row" style="gap:6px;margin-top:11px;flex-wrap:wrap">${p.tags.map(t=>`<span class="chip" style="border-color:var(--dngLn);color:var(--dng);background:var(--dngBg)">⚠ ${esc(t)}</span>`).join('')}</div>`:''}
      ${p.note?`<div class="note" style="margin-top:11px">📝 ${esc(p.note)}</div>`:''}
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
      style="background:${x.v.bg};color:${x.v.hl}">${x.name}
      <span class="sws">${x.sw.map(c=>`<i class="sw" style="background:${c}"></i>`).join('')}</span></button>`).join('')}</div>`).join('')}
  <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm" data-act="export">⬇ สำรองข้อมูล</button>
  <button class="btn sm" data-act="import">⬆ นำเข้าไฟล์</button>
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
    <button class="wtdel" data-act="delWT" data-id="${w.id}" title="ลบห้องนี้" aria-label="ลบ">✕</button></div>`).join('')}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri sm" data-act="addWT">＋ เพิ่มห้อง</button>
  <button class="btn dg sm" data-act="reset" style="margin-left:auto">ล้างข้อมูลทั้งหมด</button></div></div>
  <h2>ข้อมูลสำรองบนคลาวด์ <span class="muted" style="font-size:12px;font-weight:600">· เก็บวันละ 1 ชุด ย้อนหลัง 60 วัน</span></h2>
  <div class="card"><div class="muted" style="margin-bottom:10px">กันกรณีข้อมูลหลักเสียหายหรือเผลอนำเข้าไฟล์ผิด — ต้องสร้างตาราง <b>clinic_backups</b> ใน Supabase ก่อน (ดู SQL ที่ท้ายหน้านี้)</div>
  <div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="loadSnaps">โหลดรายการสำรอง</button></div>
  <div id="snapBox"></div></div>

  <h2>สำรองข้อมูลอัตโนมัติ</h2>
  <div class="card"><div class="muted" style="margin-bottom:10px">เก็บสแนปช็อตย้อนหลัง 7 วันอัตโนมัติ</div>
  ${bks.map(k=>`<div class="pt"><div class="avatar">💾</div><div><div class="nm">${thDate(k.replace(BK,''))}</div>
    <div class="hn">${k.replace(BK,'')}</div></div>
    <div class="ac"><button class="btn sm" data-act="restoreBk" data-id="${k}">กู้คืน</button></div></div>`).join('')||'<div class="muted">ยังไม่มีสแนปช็อต</div>'}
  <div class="row" style="margin-top:12px"><button class="btn" data-act="export">⬇ สำรองเป็นไฟล์</button>
  <button class="btn" data-act="import">⬆ นำเข้าไฟล์</button></div></div>
  <h2>ถังขยะ <span class="muted" style="font-size:12px;font-weight:600">· เก็บไว้ ${TRASH_DAYS} วันแล้วลบถาวรอัตโนมัติ</span></h2>
  <div class="card">${(DB.trash||[]).length?`
    ${DB.trash.map(t=>{const days=Math.max(0,TRASH_DAYS-Math.floor((Date.now()-t.at)/864e5));
      return `<div class="pt"><div class="avatar">🗑</div>
      <div style="min-width:0"><div class="nm">${esc(t.label||'รายการที่ลบ')}</div>
      <div class="hn">ลบเมื่อ ${thDate(new Date(t.at).toISOString().slice(0,10))} · เหลืออีก ${days} วัน${t.appts&&t.appts.length>1?` · ${t.appts.length} นัด`:''}</div></div>
      <div class="ac"><button class="btn sm pri" data-act="restoreTrash" data-id="${t.tid}">กู้คืน</button>
      <button class="btn sm dg" data-act="dropTrash" data-id="${t.tid}">ลบถาวร</button></div></div>`}).join('')}
    <div class="row" style="margin-top:12px"><button class="btn sm dg" data-act="emptyTrash">ล้างถังขยะทั้งหมด</button></div>`
    :`<div class="ok">✓ ถังขยะว่าง</div>`}</div>

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
    :`<div class="ok">✓ ไม่พบคนไข้ซ้ำในระบบ</div>`}</div>`}

/* ---------- THEME PANEL ---------- */
function renderThemePanel(){
  const grp=(dk,lbl)=>`<div class="lb">${lbl}</div>`+THEMES.filter(x=>x.dark===dk).map(x=>
    `<button class="th ${DB.theme===x.id?'on':''}" data-act="setTheme" data-id="${x.id}">${x.name}
     <span class="sws">${x.sw.map(c=>`<i class="sw" style="background:${c}"></i>`).join('')}</span></button>`).join('');
  $('tpanel').innerHTML=grp(false,'☀ ธีมสว่าง')+`<div class="hr"></div>`+grp(true,'🌙 ธีมมืด')
   +`<div class="hr"></div><div class="lb">ข้อมูล</div>
   <div class="row" style="gap:8px"><button class="btn sm" style="flex:1" data-act="export">⬇ สำรอง</button>
   <button class="btn sm" style="flex:1" data-act="import">⬆ นำเข้า</button></div>
   ${SYNC.on?`<button class="btn sm blk" style="margin-top:8px" data-act="logout">ออกจากระบบ</button>`:''}`}
