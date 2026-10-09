/* ===== data.js =====
   โครงสร้างข้อมูล, localStorage, สำรองอัตโนมัติ, สถานะหน้าจอ, ตัวกรองข้อมูล
   ===================================================== */

/* ---------- MODEL ---------- */
const KEY='dental_tracker_v5';
const SESSIONS=[{id:'am',name:'เช้า',time:'09:00–12:00',c:'var(--am)'},{id:'pm',name:'บ่าย',time:'13:00–16:00',c:'var(--pm)'},{id:'ev',name:'เย็น',time:'16:00–20:00',c:'var(--ev)'}];
const DEF_WT=[
 {id:'fung',name:'ฟุ้ง',short:'ฟุ้ง',room:'ฟุ้ง',color:'#e0a30b',group:'ฟุ้ง'},
 {id:'pks',name:'ปกส',short:'ปกส',room:'ปกส',color:'#c07f06',group:'ปกส / 1-1'},
 {id:'r11',name:'1/1',short:'1/1',room:'1/1',color:'#8a5cf6',group:'ปกส / 1-1'},
 {id:'scr',name:'Screen',short:'SCR',room:'Screen',color:'#e5115f',group:'Screen / รพ.สต.'},
 {id:'rpst',name:'รพ.สต.',short:'สต.',room:'รพ.สต.',color:'#0f9b8e',group:'Screen / รพ.สต.'},
 {id:'dm',name:'DM',short:'DM',room:'DM',color:'#3d3f92',group:'DM'},
 {id:'off',name:'OFF (วันหยุด)',short:'OFF',room:'วันหยุด',color:'#9aa0b5',group:'OFF'}];
const PROCS=['ตรวจ / ปรึกษา','ขูดหินปูน','อุดฟัน','ถอนฟัน','ผ่าฟันคุด','รักษารากฟัน','Insert RPD','Insert TP','Try in framework','Try in teeth','Border molding','Final impression','Recheck','Reline','Stitch off','F/U','X-ray'];
const uid=p=>p+Math.random().toString(36).slice(2,9);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseD=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const TH_M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DOW=['อา','จ','อ','พ','พฤ','ศ','ส'],DOWF=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสฯ','ศุกร์','เสาร์'];
const thDate=s=>{const d=parseD(s);return `${d.getDate()} ${TH_M[d.getMonth()]} ${d.getFullYear()+543}`};
const TODAY=iso(new Date());
const esc=s=>(s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const digits=s=>(s||'').replace(/\D/g,'');
/* ไอคอนติ๊กถูก / กากบาท เส้นเดียวกันทั้งเว็บ (แทน ✓ ✕ ที่หน้าตาไม่เท่ากันแต่ละฟอนต์) */
const IC={
  x:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  ok:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.8l4.4 4.4L19 7.6"/></svg>'};
/* ไอคอนทึบ (แทนอีโมจิ) */
const SIP={
  warn:'M12 2.6c.5 0 .9.3 1.2.7l9.4 16.4c.5.9-.1 2-1.2 2H2.6c-1 0-1.7-1.1-1.2-2L10.8 3.3c.3-.4.7-.7 1.2-.7zM11 9v6h2V9h-2zm0 8v2h2v-2h-2z',
  clock:'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 5v6.6l4.9 2.9 1-1.7-3.9-2.3V7h-2z',
  pin:'M8 2h8v2l-1 1v5l3 3v2h-5v6l-1 2-1-2v-6H6v-2l3-3V5L8 4V2z',
  ban:'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.8a7.2 7.2 0 0 0-5.8 11.5L16.3 6.2A7.2 7.2 0 0 0 12 4.8zm5.8 2.9L7.7 17.8A7.2 7.2 0 0 0 17.8 7.7z',
  room:'M4 3h16v18h-6v-4h-4v4H4V3zm7 3v2H9v2h2v2h2v-2h2V8h-2V6h-2z',
  caloff:'M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2zM5 9v10h14V9H5zm4.2 2.5l1.4-1.4L12 11.6l1.4-1.5 1.4 1.4-1.4 1.5 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4z',
  eraser:'M15.6 3.4l5 5c.8.8.8 2 0 2.8L12.8 19H20v2H8.2l-4.8-4.8c-.8-.8-.8-2 0-2.8L12.8 3.4c.8-.8 2-.8 2.8 0zM9 11.2l-3.6 3.6 4.2 4.2h.4l2.6-2.6L9 11.2z',
  note:'M4 4h9v2H6v12h12v-7h2v9H4V4zm14.6-1.4l2.8 2.8-8.6 8.6H10v-2.8l8.6-8.6z',
  down:'M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3V3zM4 18h16v3H4v-3z',
  up:'M12 3l5.7 5.7-1.4 1.4L13 6.8V16h-2V6.8L7.7 10.1 6.3 8.7 12 3zM4 18h16v3H4v-3z',
  save:'M4 3h13l4 4v14H4V3zm3 2v5h9V5H7zm5 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  trash:'M9 2h6l1 2h4v2H4V4h4l1-2zM5 8h14l-1 13H6L5 8z',
  sun:'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM1 11h3v2H1v-2zm19 0h3v2h-3v-2zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4z',
  moon:'M14.5 2.5a9.5 9.5 0 1 0 7 15.6 8 8 0 0 1-7-15.6z',
  cloud:'M7 19a5 5 0 0 1-.6-10A6.5 6.5 0 0 1 19 9.6 4.8 4.8 0 0 1 18 19H7z',
  phone:'M6.5 3h3l1.5 4.5L9 9.3a12.5 12.5 0 0 0 5.7 5.7l1.8-2 4.5 1.5v3c0 1.1-.9 2-2 2C10.5 19.5 4.5 13.5 4.5 5c0-1.1.9-2 2-2z',
  list:'M3 5h3v3H3V5zm5 .5h13v2H8v-2zM3 10.5h3v3H3v-3zm5 .5h13v2H8v-2zM3 16h3v3H3v-3zm5 .5h13v2H8v-2z',
  slot:'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.5a7.5 7.5 0 0 0 0 15V12V4.5z'};
const SI=n=>`<svg class="ics" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${SIP[n]}"/></svg>`;
const telLink=(ph,label)=>{const d=digits(ph);return d.length>=9?`<a class="tel" href="tel:${d}" onclick="event.stopPropagation()">${esc(label||ph)}</a>`:esc(label||ph||'')};
const ses4=t=>{const h=+(t||'13:00').split(':')[0];return h<12?'am':h<16?'pm':'ev'};

/* เติมคีย์ที่ขาดให้ข้อมูลเก่า (ไฟล์สำรองเดิม / คลาวด์เดิม) */
function fixDB(d){if(!d)return d;
  if(!Array.isArray(d.trash))d.trash=[];
  if(!Array.isArray(d.cases))d.cases=[];
  /* เคสรุ่นเก่า (1 เคส = 1 บันทึก) -> ย้ายเป็น entry แรกของไทม์ไลน์ */
  d.cases.forEach(c=>{
    if(Array.isArray(c.entries))return;
    const e={id:'e_'+Math.random().toString(36).slice(2,9),kind:'tx',date:c.date||TODAY,
      sym:c.sym||[],symNote:c.symNote||'',perc:c.perc||'',mob:c.mob||'',pd:c.pd||'',caries:c.caries||[],
      expo:c.expo||'',hemo:c.hemo||'',hemoMin:c.hemoMin||'',cap:c.cap||'',liner:c.liner||[],
      temp:c.temp||'',fin:c.fin||'',note:c.note||''};
    c.entries=[e];
    ['date','sym','symNote','perc','mob','pd','caries','expo','hemo','hemoMin','cap','liner','temp','fin','note']
      .forEach(k=>delete c[k])});
  if(!Array.isArray(d.workTypes)||!d.workTypes.length)d.workTypes=DEF_WT.slice();
  if(!Array.isArray(d.visits))d.visits=[];
  if(!Array.isArray(d.waitlist))d.waitlist=[];
  if(!d.pmWin||!d.pmWin.from||!d.pmWin.to)d.pmWin={from:'13:00',to:'15:30'};
  return d}
let DB=loadLocal();
function loadLocal(){try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&r.patients)return fixDB(r)}catch(e){}return seed()}
const TRASH_DAYS=30;
function purgeOldTrash(){if(!DB.trash)DB.trash=[];const cut=Date.now()-TRASH_DAYS*864e5,n=DB.trash.length;
  DB.trash=DB.trash.filter(t=>t.at>cut);if(DB.trash.length!==n)localSave()}
function toTrash(o){DB.trash=DB.trash||[];DB.trash.unshift(Object.assign({tid:uid('t_'),at:Date.now(),patients:[],appts:[],visits:[]},o))}
function localSave(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){alert('พื้นที่เก็บข้อมูลเต็ม — สำรองแล้วลบข้อมูลเก่า')}}
function save(){localSave();autoBackup();if(SYNC.on)queuePush()}
const wt=id=>DB.workTypes.find(w=>w.id===id)||DB.workTypes[0];
const pt=id=>DB.patients.find(p=>p.id===id);
const daySch=d=>DB.daySchedules[d]||null;
const isOff=d=>{const s=daySch(d);return !!s&&s.typeId==='off'};
function seed(){
  const db={patients:[],appointments:[],visits:[],cases:[],waitlist:[],pmWin:{from:'13:00',to:'15:30'},trash:[],daySchedules:{},workTypes:DEF_WT.slice(),
    categories:['Oral exam','RPD','TP','CD','ENDO','SUR','Stitch off','F/U','อื่นๆ'],
    categoryStyles:{'Oral exam':{bg:'#EDEAE0',text:'#5C6D68'},'RPD':{bg:'#EFE1EA',text:'#63405A'},
      'TP':{bg:'#EFE1EA',text:'#63405A'},'CD':{bg:'#EFE1EA',text:'#63405A'},'ENDO':{bg:'#F7E4DD',text:'#9C4530'},
      'SUR':{bg:'#FBDADA',text:'#A33636'},'Stitch off':{bg:'#FBDADA',text:'#A33636'},
      'F/U':{bg:'#E3E7F3',text:'#3C4A75'},'อื่นๆ':{bg:'#F0EBDD',text:'#8A7F63'}},theme:'cheesecake'};
  localStorage.setItem(KEY,JSON.stringify(db));return db;
}
/* ---------- AUTO BACKUP ---------- */
const BK='dental_backup_';
function autoBackup(){const k=BK+TODAY;
  try{localStorage.setItem(k,JSON.stringify({at:new Date().toISOString(),data:DB}));
    const keys=Object.keys(localStorage).filter(x=>x.startsWith(BK)).sort();
    while(keys.length>7)localStorage.removeItem(keys.shift())}catch(e){}}
const backupList=()=>Object.keys(localStorage).filter(x=>x.startsWith(BK)).sort().reverse();
function restoreBackup(k){try{const j=JSON.parse(localStorage.getItem(k));
  if(!j?.data?.patients)throw 0;DB=fixDB(j.data);localSave();applyTheme(DB.theme||'cheesecake');render();
  alert('กู้คืนข้อมูลวันที่ '+k.replace(BK,'')+' เรียบร้อย')}catch(e){alert('ไฟล์สำรองเสียหาย')}}

/* ---------- STATE ---------- */
const now=new Date();
let S={view:'schedule',mode:'cal',sub:'cases',psub:'slots',srange:14,cq:'',cfilter:'watch',cur:new Date(now.getFullYear(),now.getMonth(),1),q:'',sel:null,onlyBusy:true,filter:'all',
  plan:{sel:new Set(),mode:'room',typeId:DEF_WT[0].id,session:'am',note:'',dows:new Set(),every:'all'}};
function applyTheme(id){const t=THEMES.find(x=>x.id===id)||THEMES.find(x=>x.id==='cheesecake')||THEMES[0];
  Object.entries(t.v).forEach(([k,v])=>document.documentElement.style.setProperty('--'+k,v));
  document.documentElement.toggleAttribute('data-rgb',t.id==='rgb');
  document.documentElement.dataset.theme=t.id;
  const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',t.v.hl);
  DB.theme=t.id;localSave()}
applyTheme(DB.theme||'cheesecake');
purgeOldTrash();

/* ---------- QUERIES ---------- */
const apptsOn=d=>DB.appointments.filter(a=>a.date===d).sort((x,y)=>(x.time||'99:99').localeCompare(y.time||'99:99'));
const liveOn=d=>apptsOn(d).filter(a=>a.status!=='cancelled');   // ไม่นับนัดที่ยกเลิก
const match=(p,q)=>!q||(p.hn+' '+p.name+' '+(p.cat||'')+' '+(p.tags||[]).join(' ')+' '+(p.phone||'')+' '+digits(p.phone)).toLowerCase().includes(q.toLowerCase());
const filterAppts=l=>!S.q?l:l.filter(a=>{const p=pt(a.patientId);return p&&match(p,S.q)});
const initials=n=>(n||'?').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('');
const busyOn=(date,ex)=>new Set(DB.appointments.filter(a=>a.date===date&&a.status!=='cancelled'&&a.id!==ex).map(a=>a.patientId));
function dupPatients(){const g={},out=[];
  DB.patients.forEach(p=>{const k1='hn:'+(p.hn||'').trim().toLowerCase(),k2='ph:'+digits(p.phone);
    if(p.hn)(g[k1]=g[k1]||[]).push(p);if(digits(p.phone).length>=9)(g[k2]=g[k2]||[]).push(p)});
  Object.entries(g).forEach(([k,v])=>{if(v.length>1)out.push({k,v})});return out}
const catChip=c=>{const cs=(DB.categoryStyles||{})[c];
  return c?`<span class="chip" style="border-color:${cs?cs.bg:'var(--line)'};color:${cs?cs.text:'var(--tx2)'};background:${cs?cs.bg:'transparent'}">${esc(c)}</span>`:''};
