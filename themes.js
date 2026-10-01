/* ===== themes.js =====
   ธีมสีทั้งหมด + ตัวช่วยคำนวณสี — แก้สีธีมที่นี่
   ===================================================== */

/* ---------- THEME ENGINE ---------- */
const hx=h=>{h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const lum=h=>{const[r,g,b]=hx(h);return (.299*r+.587*g+.114*b)/255};
const rgba=(h,a)=>{const[r,g,b]=hx(h);return `rgba(${r},${g},${b},${a})`};
const mixc=(a,b,t)=>{const A=hx(a),B=hx(b);
  return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const onC=h=>lum(h)>.62?'#141414':'#ffffff';
function T(id,name,c){
  const dark=lum(c.bg)<.5;
  const okc=dark?'#34d399':'#0f7a4c', wrc=dark?'#fbbf24':'#8a6410';
  return {id,name,dark,sw:[c.accent,c.secondary,c.text],v:{
    bg:c.bg, surface:c.surface, soft:c.surface2,
    line:c.border, line2:mixc(c.border,c.surface,.55),
    bar:mixc(c.accent,c.bg,.52),
    ink:c.accent, ink2:c.subtext, tx:c.text, tx2:c.subtext,
    hl:c.accent, onhl:onC(c.accent),
    am:dark?'#fbbf24':'#d99206', pm:c.secondary, ev:c.accentHover,
    dngBg:rgba(c.danger,dark?.20:.12), dngLn:rgba(c.danger,.45), dng:c.danger,
    okBg:rgba(okc,dark?.18:.14), okLn:rgba(okc,.40), ok:okc,
    wrnBg:rgba(wrc,dark?.18:.16), wrnLn:rgba(wrc,.40), wrn:wrc,
    infBg:rgba(c.accent,dark?.20:.13), infLn:rgba(c.accent,.40), inf:c.accent}};
}
const THEMES=[
 T('light','Daylight',{bg:'#FFFFFF',surface:'#FFFFFF',surface2:'#F5F7FB',text:'#1F2140',subtext:'#8A8FA8',accent:'#2A2A6E',accentHover:'#1E1E55',secondary:'#6B6EC9',border:'#E6E8F0',danger:'#C2344A'}),
 T('sakura','Sakura',{bg:'#FFFAFC',surface:'#FFFFFF',surface2:'#FDF1F5',text:'#3F2230',subtext:'#A67C8C',accent:'#B81F55',accentHover:'#951642',secondary:'#E0568E',border:'#F5DDE5',danger:'#C2185B'}),
 T('iceberg','Iceberg',{bg:'#E8EAF0',surface:'#D5DAE6',surface2:'#C3CADB',text:'#1F365C',subtext:'#6E7F9E',accent:'#2F5DAA',accentHover:'#264C8C',secondary:'#A7B1CA',border:'#CBD1DD',danger:'#B75A68'}),
 T('macroblank','Macroblank',{bg:'#B8D8CF',surface:'#9FC7BC',surface2:'#8AB7AB',text:'#3B2420',subtext:'#5C6A63',accent:'#8F2414',accentHover:'#75190C',secondary:'#7B8780',border:'#A7C8BF',danger:'#B12D25'}),
 T('pastel','Pastel',{bg:'#F7DDE4',surface:'#FCEAEF',surface2:'#FFD3DA',text:'#5E5363',subtext:'#7E96A0',accent:'#A8365C',accentHover:'#8C2A4A',secondary:'#4FA9BC',border:'#FFF0B8',danger:'#C65C79'}),
 T('sewingtin','Sewing Tin Light',{bg:'#FFFFFF',surface:'#C8CEDF',surface2:'#B5BFD8',text:'#2D2076',subtext:'#385ECA',accent:'#2D2076',accentHover:'#241966',secondary:'#385ECA',border:'#C8CEDF',danger:'#A9445A'}),
 T('milkshake','Milkshake',{bg:'#FFFFFF',surface:'#DDEFF3',surface2:'#C9E6ED',text:'#212B43',subtext:'#3E9FB3',accent:'#212B43',accentHover:'#141B2C',secondary:'#62CFE6',border:'#C9E6ED',danger:'#C45E72'}),
 T('cheesecake','Cheesecake',{bg:'#FDF0D5',surface:'#F3E2BF',surface2:'#EAD4A8',text:'#302A1D',subtext:'#B01568',accent:'#8E2949',accentHover:'#76203C',secondary:'#D91C81',border:'#E3CFA4',danger:'#8E2949'}),
 T('solarlight','Solarized Light',{bg:'#FDF6E3',surface:'#EEE8D5',surface2:'#E5DDC8',text:'#586E75',subtext:'#839496',accent:'#1E72B0',accentHover:'#165A8C',secondary:'#9A7600',border:'#D8CFB7',danger:'#DC322F'}),
 T('discord','Discord',{bg:'#313338',surface:'#2B2D31',surface2:'#3F4147',text:'#F2F3F5',subtext:'#8E9297',accent:'#8B95FF',accentHover:'#6F7BF0',secondary:'#6D7280',border:'#4E5058',danger:'#ED4245'}),
 T('incognito','Incognito',{bg:'#0B0B0B',surface:'#1A1A1A',surface2:'#2B2B2B',text:'#F4F1E8',subtext:'#8A8A8A',accent:'#FF9D00',accentHover:'#D98200',secondary:'#5C5C5C',border:'#333333',danger:'#D9514E'}),
 T('redsamurai','Red Samurai',{bg:'#942532',surface:'#7D1D29',surface2:'#651722',text:'#F2D49B',subtext:'#C99C68',accent:'#F2CD8C',accentHover:'#DDB36D',secondary:'#6E151D',border:'#B0505C',danger:'#FF8080'}),
 T('trance','Trance',{bg:'#0B102E',surface:'#151B3D',surface2:'#202A55',text:'#FF2F92',subtext:'#6F83B8',accent:'#F72585',accentHover:'#D81B72',secondary:'#4F5F9A',border:'#3A2A55',danger:'#FF5C8A'}),
 T('dots','Dots',{bg:'#121520',surface:'#1B1E2C',surface2:'#25293A',text:'#FFFFFF',subtext:'#676E8A',accent:'#FFFFFF',accentHover:'#E6E6E8',secondary:'#676E8A',border:'#2B3042',danger:'#F94348'}),
 T('rosepine','Rose Pine',{bg:'#1F1D27',surface:'#282533',surface2:'#353140',text:'#E0DEF4',subtext:'#C4A7E7',accent:'#9CCFD8',accentHover:'#83BAC5',secondary:'#C4A7E7',border:'#35313F',danger:'#EB6F92'}),
 T('oblivion','Oblivion',{bg:'#313231',surface:'#3A3B3B',surface2:'#484949',text:'#F7F5F1',subtext:'#9AA0A0',accent:'#A5A096',accentHover:'#8F8A81',secondary:'#9A90B4',border:'#4B4C4C',danger:'#DD452E'}),
 T('evileye','Evil Eye',{bg:'#05364B',surface:'#0A4A66',surface2:'#0E5C80',text:'#EAF7FD',subtext:'#68C4E8',accent:'#33C9F5',accentHover:'#1FA8D0',secondary:'#FFD166',border:'#0D5872',danger:'#FF7A7A'}),
 T('ezmode','EZ Mode',{bg:'#0C3C66',surface:'#124F84',surface2:'#186199',text:'#FFFFFF',subtext:'#A8DAF7',accent:'#FF8BDA',accentHover:'#F06BC4',secondary:'#2AA7E8',border:'#2D7FC4',danger:'#FF6B6B'}),
 T('nebula','Nebula',{bg:'#25233D',surface:'#302D4A',surface2:'#3B3658',text:'#EDE6F5',subtext:'#2CB7B5',accent:'#EE72AE',accentHover:'#D25494',secondary:'#2CB7B5',border:'#D1448D',danger:'#FF6B8A'}),
 T('catppuccin','Catppuccin',{bg:'#1E1E2E',surface:'#313244',surface2:'#45475A',text:'#CDD6F4',subtext:'#A6ADC8',accent:'#CBA6F7',accentHover:'#B48BE8',secondary:'#9399B2',border:'#45475A',danger:'#F38BA8'}),
 T('gruvbox','Gruvbox',{bg:'#282828',surface:'#3C3836',surface2:'#504945',text:'#EBDBB2',subtext:'#A89984',accent:'#FABD2F',accentHover:'#D79921',secondary:'#8EC07C',border:'#665C54',danger:'#FB4934'}),
 T('solardark','Solarized Dark',{bg:'#002B36',surface:'#073642',surface2:'#124552',text:'#EEE8D5',subtext:'#93A1A1',accent:'#B58900',accentHover:'#A17900',secondary:'#268BD2',border:'#1C4C59',danger:'#DC322F'}),
 T('redvelvet','Red Velvet',{bg:'#2A1016',surface:'#3A1720',surface2:'#4A1D29',text:'#F4D7D7',subtext:'#C4858E',accent:'#F0707C',accentHover:'#D25764',secondary:'#8F2634',border:'#5B2830',danger:'#FF6B72'}),
 T('mintchoco','Mint Choco',{bg:'#16211D',surface:'#20312B',surface2:'#2C443B',text:'#D7F3EA',subtext:'#8CB6A8',accent:'#64D6AC',accentHover:'#4EBC94',secondary:'#7B5E4B',border:'#355248',danger:'#E36C6C'}),
 T('rgb','RGB',{bg:'#111215',surface:'#191A1E',surface2:'#232428',text:'#E9EAEC',subtext:'#8A8D94',accent:'#3FAE55',accentHover:'#34913F',secondary:'#3C9FB8',border:'#2B2C31',danger:'#F0474E'}),
 T('spiderman','Spiderman',{bg:'#0D1426',surface:'#151E36',surface2:'#1E2A47',text:'#EDF1FA',subtext:'#3D7FE0',accent:'#F23A42',accentHover:'#D0262E',secondary:'#2F6FE4',border:'#24314F',danger:'#FF5560'})];
