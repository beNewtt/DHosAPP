/* ===== app.js =====
   กล่องกรอกข้อมูล, ปุ่มทั้งหมด, ซิงก์คลาวด์, service worker
   ===================================================== */

/* ---------- MODALS ---------- */
const mask=$('mask'),modal=$('modal');
const open=h=>{modal.innerHTML=h;mask.classList.add('on')};
const close=()=>{mask.classList.remove('on');modal.innerHTML=''};
mask.addEventListener('click',e=>{if(e.target===mask)close()});
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
    typeId:'',room:'',proc:'',tooth:'',time:'',duration:30,status:'scheduled',note:''};
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
  SH_APPT=id||null;
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
  box.innerHTML=c?`<span style="color:var(--wrn);font-weight:700">⚠ Overlaps ${esc(clashMsg(c))}</span>`:''}
let SH_APPT=null;
function checkDup(){const hid=$('fpid'),msg=$('fpmsg');if(!hid||!msg)return;
  checkClash();
  if(!hid.value||hid.value==='__new'){msg.textContent='';return}
  const date=$('fd').value,ex=DB.appointments.find(a=>a.patientId===hid.value&&a.date===date&&a.status!=='cancelled');
  msg.innerHTML=ex?`<span style="color:var(--dng);font-weight:700">⚠ Already booked on ${thDate(date)} (${ex.time||SESSIONS.find(s=>s.id===ex.session).name})</span>`:''}
function checkNewDup(){const w=$('nwarn');if(!w)return;
  const hn=$('nhn').value.trim().toLowerCase(),ph=digits($('nph').value);
  const d=(hn&&DB.patients.find(p=>(p.hn||'').trim().toLowerCase()===hn))||(ph.length>=9&&DB.patients.find(p=>digits(p.phone)===ph));
  w.innerHTML=d?`<div class="warn">⚠ Patient already exists: <b>${esc(d.hn)} — ${esc(d.name)}</b><br>
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
function mVisit(id){const v=DB.visits.find(x=>x.id===id),p=pt(v.patientId);
  open(`<div class="mtitle">บันทึกการรักษา</div>
   <div class="muted" style="margin-bottom:13px">${esc(p.hn||'—')} — ${esc(p.name)} · ${thDate(v.date)}</div>
   ${(p.tags||[]).length?`<div class="warn">⚠ ${esc(p.tags.join(' · '))}</div>`:''}
   <div class="g2"><div class="f"><label>หัตถการ</label><input id="vpr" list="procList2" value="${esc(v.proc)}">
     <datalist id="procList2">${PROCS.map(x=>`<option>${x}</option>`).join('')}</datalist></div>
   <div class="f"><label>ซี่ฟัน</label><input id="vto" value="${esc(v.tooth)}"></div></div>
   <div class="f"><label>Diagnosis</label><input id="vd" value="${esc(v.dx)}"></div>
   <div class="f"><label>แผนการรักษา / สิ่งที่ต้องทำครั้งหน้า</label><input id="vt" value="${esc(v.tx)}"></div>
   <div class="f"><label>บันทึกเพิ่มเติม</label><textarea id="vn" rows="4">${esc(v.note)}</textarea></div>
   <div class="mfoot"><button class="btn dg" data-act="delVisit" data-id="${id}">ลบบันทึก</button>
   <button class="btn" data-act="saveVisit" data-id="${id}">บันทึก</button>
   <button class="btn pri" data-act="saveVisitNext" data-id="${id}">บันทึก + นัดต่อ →</button></div>`)}

/* ---------- ACTIONS ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  if(!t){if(!e.target.closest('#tpanel'))$('tpanel').classList.remove('on');return}
  const a=t.dataset.act,id=t.dataset.id,d=t.dataset.d,P=S.plan;
  if(!['themeBtn','setTheme','export','import','logout'].includes(a))$('tpanel').classList.remove('on');
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
    case'pickDay':P.sel.has(d)?P.sel.delete(d):P.sel.add(d);t.classList.toggle('pk');refreshPlan();break;
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
      save();close();render();break}
    case'clearDay':delete DB.daySchedules[d];save();close();render();break;
    case'addAppt':{if(isOff(d||TODAY)&&!confirm('วันนี้ตั้งเป็น OFF — ยืนยันลงนัด?'))return;
      mAppt(null,{d:d||TODAY,s:t.dataset.s,p:t.dataset.p});break}
    case'editAppt':mAppt(id);break;
    case'delAppt':if(confirm('ลบนัดนี้? (กู้คืนได้ภายใน 30 วัน ที่หน้าตั้งค่า)')){
      const ap=DB.appointments.find(x=>x.id===id);
      if(ap){const p=pt(ap.patientId),vs=DB.visits.filter(v=>v.apptId===ap.id);
        toTrash({kind:'appt',label:`นัด ${p?p.name:'—'} · ${thDate(ap.date)}`,appts:[ap],visits:vs});
        DB.appointments=DB.appointments.filter(x=>x.id!==id);DB.visits=DB.visits.filter(v=>v.apptId!==ap.id)}
      save();render()}break;
    case'usePt':{const p=pt(id);$('fpid').value=p.id;$('fpq').value=(p.hn||'—')+' — '+p.name;
      $('np').style.display='none';$('nwarn').innerHTML='';checkDup();break}
    case'saveAppt':{let pid=$('fpid').value;
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
      if(id)Object.assign(DB.appointments.find(x=>x.id===id),o);else DB.appointments.push({id:uid('a_'),visitId:null,...o});
      save();close();render();break}
    case'checkin':{const ap=DB.appointments.find(x=>x.id===id);
      if(ap.visitId){close();mVisit(ap.visitId);break}
      const v={id:uid('v_'),patientId:ap.patientId,apptId:ap.id,date:ap.date,session:ap.session,typeId:ap.typeId,
        proc:ap.proc||'',tooth:ap.tooth||'',dx:'',tx:'',note:ap.note||''};
      DB.visits.push(v);ap.visitId=v.id;ap.status='done';save();close();mVisit(v.id);break}
    case'editVisit':mVisit(id);break;
    case'saveVisit':{const v=DB.visits.find(x=>x.id===id);
      v.proc=$('vpr').value;v.tooth=$('vto').value.trim();v.dx=$('vd').value;v.tx=$('vt').value;v.note=$('vn').value;
      save();close();render();break}
    case'saveVisitNext':{const v=DB.visits.find(x=>x.id===id);if(!v)break;
      v.proc=$('vpr').value;v.tooth=$('vto').value.trim();v.dx=$('vd').value;v.tx=$('vt').value;v.note=$('vn').value;
      save();close();mAppt(null,{p:v.patientId,proc:(v.tx||v.proc||'').trim(),tooth:(v.tooth||'').trim()});break}
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
      if(nd===a.date&&$('rst').value===(a.time||'')){close();break}
      const ov2=clashAt(nd,$('rst').value,a.duration,a.id);
      if(ov2&&!confirm(`เวลาใหม่ทับกับ ${clashMsg(ov2)}\n\nยืนยันเลื่อนไปเวลานี้ไหม?`))break;
      const why=$('rsr').value.trim();
      a.moves=a.moves||[];a.moves.push({from:a.date,to:nd,at:new Date().toISOString(),why});
      a.note=(`เลื่อนจาก ${thDate(a.date)}${why?' ('+why+')':''}`+(a.note?' · '+a.note:''));
      a.date=nd;a.time=$('rst').value;
      const s=daySch(nd);if(s){a.typeId=s.typeId;a.room=s.room}
      save();close();render();break}
    case'dplus':{const f=$('fd');if(!f)break;const base=f.value?parseD(f.value):new Date();
      base.setDate(base.getDate()+ +t.dataset.n);f.value=iso(base);
      f.dispatchEvent(new Event('change',{bubbles:true}));break}
    case'loadSnaps':loadSnapshots();break;
    case'restoreSnap':{const r=SNAPS.find(x=>String(x.id)===String(id));if(!r)break;
      const n=r.data||{};
      if(!confirm(`กู้คืนข้อมูลของ ${new Date(r.created_at).toLocaleString('th-TH')}?\n\nข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่\n(คนไข้ ${(n.patients||[]).length} · นัด ${(n.appointments||[]).length})`))break;
      DB=n;if(!Array.isArray(DB.trash))DB.trash=[];if(!DB.workTypes||!DB.workTypes.length)DB.workTypes=DEF_WT.slice();
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
    DB=j;save();applyTheme(DB.theme||'cheesecake');S.sel=null;render();alert('นำเข้าข้อมูลสำเร็จ — '+DB.patients.length+' คนไข้')}
    catch(x){alert('ไฟล์ไม่ถูกต้อง')}};r.readAsText(f);e.target.value=''});
document.addEventListener('input',e=>{
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
  if(e.key==='Escape'){$('tpanel').classList.remove('on');return}
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
  if(data?.data?.patients){DB=data.data;if(!Array.isArray(DB.trash))DB.trash=[];SYNC.seenAt=data.updated_at||'';localSave()}else await cloudPush(true)}
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
    return `<div class="pt"><div class="avatar">☁</div><div style="min-width:0">
      <div class="nm">${d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</div>
      <div class="hn">คนไข้ ${(n.patients||[]).length} · นัด ${(n.appointments||[]).length} · บันทึกรักษา ${(n.visits||[]).length}</div></div>
      <div class="ac"><button class="btn sm" data-act="restoreSnap" data-id="${r.id}">กู้คืน</button></div></div>`}).join('')}
let SNAPS=[];
function subscribeRealtime(){SYNC.sb.channel('clinic-sync').on('postgres_changes',
  {event:'*',schema:'public',table:'clinic_state',filter:`id=eq.${ROW_ID}`},p=>{
    const n=p.new;if(!n)return;SYNC.seenAt=n.updated_at||SYNC.seenAt;if(n.updated_by===DEVICE)return;
    DB=n.data;if(!Array.isArray(DB.trash))DB.trash=[];localSave();applyTheme(DB.theme||'cheesecake');render();setSync('sync.','var(--ok)')}).subscribe()}
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
