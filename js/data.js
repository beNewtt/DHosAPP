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
const telLink=(ph,label)=>{const d=digits(ph);return d.length>=9?`<a class="tel" href="tel:${d}" onclick="event.stopPropagation()">${esc(label||ph)}</a>`:esc(label||ph||'')};
const ses4=t=>{const h=+(t||'13:00').split(':')[0];return h<12?'am':h<16?'pm':'ev'};

/* เติมคีย์ที่ขาดให้ข้อมูลเก่า (ไฟล์สำรองเดิม / คลาวด์เดิม) */
function fixDB(d){if(!d)return d;
  if(!Array.isArray(d.trash))d.trash=[];
  if(!Array.isArray(d.cases))d.cases=[];
  if(!Array.isArray(d.workTypes)||!d.workTypes.length)d.workTypes=DEF_WT.slice();
  if(!Array.isArray(d.visits))d.visits=[];
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
  const db={patients:[],appointments:[],visits:[],cases:[],trash:[],daySchedules:{},workTypes:DEF_WT.slice(),
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
let S={view:'schedule',mode:'cal',sub:'stats',cq:'',cfilter:'watch',cur:new Date(now.getFullYear(),now.getMonth(),1),q:'',sel:null,onlyBusy:true,filter:'all',
  plan:{sel:new Set(),mode:'room',typeId:DEF_WT[0].id,session:'am',note:'',dows:new Set(),every:'all'}};
function applyTheme(id){const t=THEMES.find(x=>x.id===id)||THEMES.find(x=>x.id==='cheesecake')||THEMES[0];
  Object.entries(t.v).forEach(([k,v])=>document.documentElement.style.setProperty('--'+k,v));
  document.documentElement.toggleAttribute('data-rgb',t.id==='rgb');
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
