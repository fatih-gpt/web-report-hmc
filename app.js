const SUPABASE_URL="https://uafgcwfiyaywgjtwuzqp.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_LFTM5dNbnKEobcxi5_6dOw_zI3lKY3t";
const db=(!window.supabase||SUPABASE_ANON_KEY.includes("GANTI_"))?null:supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);let user=null,profile=null,shiftRows=[],breakRows=[],editShiftId=null,editBreakId=null;
const status=["Standby","Maintenance","Operasi","Breakdown","Operasi / Breakdown","Maintenance / Operasi","Standby / Maintenance","Lainnya"];
const esc=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const minutes=(a,b)=>{if(!a||!b)return 0;let A=a.split(":").map(Number),B=b.split(":").map(Number),m=B[0]*60+B[1]-A[0]*60-A[1];return m<0?m+1440:m};
const duration=m=>Math.floor((m||0)/60)+"j "+((m||0)%60)+"m";const dateFmt=x=>{let d=new Date(x+"T00:00:00");return String(d.getDate()).padStart(2,"0")+"-"+["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][d.getMonth()]+"-"+String(d.getFullYear()).slice(-2)};function toast(x){$("toast").textContent=x;$("toast").classList.remove("hidden");clearTimeout(window.tt);window.tt=setTimeout(()=>$('toast').classList.add('hidden'),3000)}
async function login(){if(!db)return $("loginError").textContent="Isi Publishable/Anon Key pada app.js.";let r=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(r.error)return $('loginError').textContent=r.error.message;user=r.data.user;let p=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();if(p.error||!p.data){$('loginError').textContent="Profil belum tersedia. Jalankan supabase.sql terbaru.";return}profile=p.data;$('userName').textContent=profile.full_name||user.email;$('navMonitor').classList.remove('hidden');$('userRole').textContent=(profile.role||'technician').toUpperCase();$('loginPage').classList.add('hidden');$('app').classList.remove('hidden');loadShift();loadBreak()}
async function logout(){await db.auth.signOut();location.reload()}
function module(m){$('shiftModule').classList.toggle('hidden',m!=='shift');$('breakModule').classList.toggle('hidden',m!=='breakdown');$('monitorModule').classList.toggle('hidden',m!=='monitor');$('navShift').classList.toggle('active',m==='shift');$('navBreak').classList.toggle('active',m==='breakdown');$('navMonitor').classList.toggle('active',m==='monitor');if(m==='monitor')loadMonitor()}
function resetShift(){editShiftId=null;$('shiftTitle').textContent='Tambah Laporan Shift';$('shiftSave').textContent='☁ Simpan ke Cloud';$('shiftDate').value=new Date().toISOString().slice(0,10);[1,2].forEach(n=>{$('s'+n).value='Standby';$('st'+n).value='';$('en'+n).value='';$('n'+n).value='';$('du'+n).value='0m'});$('detail').value=''}
function shiftData(){return{report_date:$('shiftDate').value,report_month:$('shiftDate').value.slice(0,7),shift1_status:$('s1').value,shift1_start:$('st1').value||null,shift1_end:$('en1').value||null,shift1_duration:minutes($('st1').value,$('en1').value),shift1_note:$('n1').value,shift2_status:$('s2').value,shift2_start:$('st2').value||null,shift2_end:$('en2').value||null,shift2_duration:minutes($('st2').value,$('en2').value),shift2_note:$('n2').value,detail:$('detail').value}}
async function saveShift(){if(!db||!user)return toast('Supabase belum terhubung.');let p=shiftData();if(!p.report_date)return toast('Tanggal wajib diisi.');let r=editShiftId?await db.from('hmc_shift_entries').update({...p,updated_by:user.id,updated_at:new Date().toISOString()}).eq('id',editShiftId):await db.from('hmc_shift_entries').insert({...p,created_by:user.id,updated_by:user.id});if(r.error)return toast('Gagal Simpan Cloud: '+r.error.message);toast('✓ Data shift tersimpan di cloud');resetShift();loadShift()}
async function loadShift(){if(!db||!user)return;let q=db.from('hmc_shift_entries').select('*').order('report_date');let f=$('filterMonth').value;if(f)q=q.eq('report_month',f);let r=await q;if(r.error)return toast('Gagal memuat shift: '+r.error.message);shiftRows=r.data||[];renderShift()}
function renderShift(){let t=$('shiftRows');t.innerHTML=shiftRows.length?shiftRows.map(r=>`<tr><td>${dateFmt(r.report_date)}</td><td><b>${esc(r.shift1_status)}</b><br>${r.shift1_start||''} - ${r.shift1_end||''}<br>${duration(r.shift1_duration)}<br>${esc(r.shift1_note)}</td><td><b>${esc(r.shift2_status)}</b><br>${r.shift2_start||''} - ${r.shift2_end||''}<br>${duration(r.shift2_duration)}<br>${esc(r.shift2_note)}</td><td>${esc(r.detail)}</td><td>${duration((r.shift1_duration||0)+(r.shift2_duration||0))}</td><td><button class="btn gray" onclick="editShift(${r.id})">Edit</button> <button class="btn red" onclick="deleteShift(${r.id})">Hapus</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Belum ada data.</td></tr>'}
function timeInput(v){return v?String(v).slice(0,5):''}
function editShift(id){let r=shiftRows.find(x=>x.id===id);if(!r)return;editShiftId=id;$('shiftTitle').textContent='Edit Laporan Shift';$('shiftSave').textContent='☁ Update ke Cloud';$('shiftDate').value=r.report_date;[1,2].forEach(n=>{$('s'+n).value=r['shift'+n+'_status'];$('st'+n).value=timeInput(r['shift'+n+'_start']);$('en'+n).value=timeInput(r['shift'+n+'_end']);$('n'+n).value=r['shift'+n+'_note']||'';$('du'+n).value=duration(r['shift'+n+'_duration'])});$('detail').value=r.detail||'';scrollTo({top:0,behavior:'smooth'})}
async function deleteShift(id){if(!confirm('Hapus data shift?'))return;let r=await db.from('hmc_shift_entries').delete().eq('id',id);if(r.error)return toast(r.error.message);loadShift()}
function resetBreak(){editBreakId=null;$('breakTitle').textContent='Tambah Breakdown';$('breakSave').textContent='☁ Simpan Breakdown ke Cloud';$('bNo').value=breakRows.length?Math.max(...breakRows.map(x=>x.report_no||0))+1:1;$('bDate').value=new Date().toISOString().slice(0,10);$('bMachine').value='HMC';['bFrom','bTo','bPic','bStrat','bProblem','bChecking','bCause','bAction','bParts','bRemarks'].forEach(i=>$(i).value='');$('bPhoto').value='';$('photoInfo').textContent='';$('bDur').value='0m'}
function breakData(){return{report_no:+$('bNo').value||1,machine:$('bMachine').value||'HMC',breakdown_date:$('bDate').value,time_from:$('bFrom').value||null,time_to:$('bTo').value||null,down_time_minutes:minutes($('bFrom').value,$('bTo').value),problem_description:$('bProblem').value,checking_steps:$('bChecking').value,root_cause:$('bCause').value,corrective_actions:$('bAction').value,spare_parts:$('bParts').value,pic:$('bPic').value,stratification:$('bStrat').value,remarks:$('bRemarks').value}}
async function saveBreak(){if(!db||!user)return toast('Supabase belum terhubung.');let p=breakData();if(!p.breakdown_date||!p.problem_description)return toast('Tanggal dan Problem Description wajib diisi.');let photo=null;let f=$('bPhoto').files[0];if(f){let ext=f.name.split('.').pop();let path=user.id+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;let u=await db.storage.from('hmc-breakdown-photos').upload(path,f,{contentType:f.type});if(u.error)return toast('Upload foto gagal: '+u.error.message);photo=db.storage.from('hmc-breakdown-photos').getPublicUrl(path).data.publicUrl}let old=editBreakId?breakRows.find(x=>x.id===editBreakId):null;let r=editBreakId?await db.from('breakdown_reports').update({...p,photo_url:photo||old?.photo_url||null,updated_by:user.id,updated_at:new Date().toISOString()}).eq('id',editBreakId):await db.from('breakdown_reports').insert({...p,photo_url:photo,created_by:user.id,updated_by:user.id});if(r.error)return toast('Gagal Simpan Breakdown: '+r.error.message);toast('✓ Breakdown tersimpan di cloud');resetBreak();loadBreak()}

async function loadBreak(){if(!db||!user)return;let r=await db.from('breakdown_reports').select('*').order('breakdown_date').order('report_no');if(r.error)return toast('Gagal memuat breakdown: '+r.error.message);breakRows=r.data||[];renderBreak()}
function renderBreak(){let t=$('breakRows');t.innerHTML=breakRows.length?breakRows.map(r=>`<tr><td>${r.report_no}</td><td>${esc(r.machine)}</td><td>${dateFmt(r.breakdown_date)}</td><td>${r.time_from||''}</td><td>${r.time_to||''}</td><td>${duration(r.down_time_minutes)}</td><td>${esc(r.problem_description)}</td><td>${esc(r.checking_steps)}</td><td>${esc(r.root_cause)}</td><td>${esc(r.corrective_actions)}</td><td>${esc(r.spare_parts)}</td><td>${esc(r.pic)}</td><td>${esc(r.stratification)}</td><td>${r.photo_url?`<a target=\"_blank\" href=\"${esc(r.photo_url)}\"><img class=\"thumb\" src=\"${esc(r.photo_url)}\"></a>`:'-'}</td><td>${esc(r.remarks)}</td><td><button class=\"btn gray\" onclick=\"editBreak(${r.id})\">Edit</button> <button class=\"btn red\" onclick=\"deleteBreak(${r.id})\">Hapus</button></td></tr>`).join(''):'<tr><td colspan=\"16\" class=\"empty\">Belum ada data.</td></tr>'}
function editBreak(id){let r=breakRows.find(x=>x.id===id);if(!r)return;editBreakId=id;$('breakTitle').textContent='Edit Breakdown';$('breakSave').textContent='☁ Update Breakdown';$('bNo').value=r.report_no;$('bMachine').value=r.machine;$('bDate').value=r.breakdown_date;$('bFrom').value=timeInput(r.time_from);$('bTo').value=timeInput(r.time_to);$('bPic').value=r.pic||'';$('bStrat').value=r.stratification||'';$('bProblem').value=r.problem_description||'';$('bChecking').value=r.checking_steps||'';$('bCause').value=r.root_cause||'';$('bAction').value=r.corrective_actions||'';$('bParts').value=r.spare_parts||'';$('bRemarks').value=r.remarks||'';$('photoInfo').innerHTML=r.photo_url?'Foto saat ini tersedia. Upload baru jika ingin mengganti.':'';calcBreak();scrollTo({top:0,behavior:'smooth'})}
async function deleteBreak(id){if(!confirm('Hapus breakdown?'))return;let r=await db.from('breakdown_reports').delete().eq('id',id);if(r.error)return toast(r.error.message);loadBreak()}
async function loadMonitor(){
 if(!db||!user)return;
 const month=$('monitorMonth').value||new Date().toISOString().slice(0,7);$('monitorMonth').value=month;
 const [sy,sm]=month.split('-').map(Number),lastDay=new Date(sy,sm,0).getDate(),start=`${month}-01`,end=`${month}-${String(lastDay).padStart(2,'0')}`;
 const [sr,br]=await Promise.all([
  db.from('hmc_shift_entries').select('id,report_date,shift1_status,shift1_start,shift1_end,shift2_status,shift2_start,shift2_end').gte('report_date',start).lte('report_date',end).order('report_date'),
  db.from('breakdown_reports').select('id,report_no,breakdown_date,machine,problem_description,pic,photo_url,time_from,time_to,down_time_minutes,checking_steps,root_cause,corrective_actions').gte('breakdown_date',start).lte('breakdown_date',end).order('breakdown_date').order('report_no')
 ]);
 if(sr.error)return toast('Gagal monitoring shift: '+sr.error.message);if(br.error)return toast('Gagal monitoring breakdown: '+br.error.message);
 const shifts=sr.data||[],breaks=br.data||[],byShift={},byBreak={};
 shifts.forEach(x=>(byShift[x.report_date]??=[]).push(x));breaks.forEach(x=>(byBreak[x.breakdown_date]??=[]).push(x));
 let filled=0,partial=0,rows='';
 for(let d=1;d<=lastDay;d++){
  const ds=`${month}-${String(d).padStart(2,'0')}`,entries=byShift[ds]||[],bd=byBreak[ds]||[];
  const s1=entries.some(x=>x.shift1_status||x.shift1_start||x.shift1_end),s2=entries.some(x=>x.shift2_status||x.shift2_start||x.shift2_end),ok=s1&&s2,part=(s1||s2)&&!ok;
  if(ok)filled++;if(part)partial++;
  const cls=ok?'monitor-ok':part?'monitor-partial':'monitor-missing',label=ok?'✓ LENGKAP':part?'◐ SEBAGIAN':'✕ BELUM DIISI',pill=ok?'status-ok':part?'status-partial':'status-missing';
  rows+=`<tr class="${cls}"><td><b>${dateFmt(ds)}</b></td><td>${s1?'<span class="status-pill status-ok">✓ Terisi</span>':'<span class="status-pill status-missing">✕ Belum</span>'}</td><td>${s2?'<span class="status-pill status-ok">✓ Terisi</span>':'<span class="status-pill status-missing">✕ Belum</span>'}</td><td>${entries.length}</td><td><span class="status-pill ${pill}">${label}</span></td><td>${bd.length?`<b>${bd.length} kejadian</b>`:'—'}</td><td>${ok?'Laporan Shift I & II tersedia.':part?'Salah satu shift belum dilaporkan.':'Belum ditemukan laporan shift.'}</td></tr>`;
 }
 const pct=lastDay?Math.round(filled/lastDay*100):0;
 $('monTotalDays').textContent=lastDay;$('monFilledDays').textContent=filled;$('monMissingDays').textContent=lastDay-filled;$('monBreakCount').textContent=breaks.length;$('monFilledPct').textContent=`${pct}% kelengkapan`;$('monitorProgressText').textContent=pct+'%';$('monitorProgress').style.width=pct+'%';$('monActionMissing').textContent=lastDay-filled;$('monActionPartial').textContent=partial;$('monActionBreak').textContent=new Set(breaks.map(x=>x.breakdown_date)).size;$('monitorOverallBadge').className='status-pill '+(pct===100?'status-ok':pct>=75?'status-partial':'status-missing');$('monitorOverallBadge').textContent=pct===100?'✓ Lengkap':pct>=75?'◐ Perlu perhatian':'⚠ Perlu tindak lanjut';$('monitorRows').innerHTML=rows;
 $('monitorBreakRows').innerHTML=breaks.length?breaks.map(x=>{const checks=[x.breakdown_date,x.problem_description,x.pic,x.time_from,x.time_to,x.checking_steps,x.root_cause,x.corrective_actions];const n=checks.filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').length+(x.photo_url?1:0);const total=9;const complete=n===total,partial=n>=5;return `<tr><td>${x.report_no||'-'}</td><td>${dateFmt(x.breakdown_date)}</td><td>${esc(x.machine)}</td><td>${esc(x.problem_description)}</td><td>${esc(x.pic)||'-'}</td><td>${x.photo_url?'<span class="monitor-break-ok">✓ Ada</span>':'<span class="monitor-break-missing">✕ Tidak ada</span>'}</td><td><span class="${complete?'monitor-break-ok':partial?'monitor-break-partial':'monitor-break-missing'}">${complete?'✓ Lengkap':partial?'◐ '+n+'/'+total+' terisi':'✕ '+n+'/'+total+' terisi'}</span></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">Tidak ada kejadian breakdown pada periode ini.</td></tr>';
}
function calcBreak(){$('bDur').value=duration(minutes($('bFrom').value,$('bTo').value))}[1,2].forEach(n=>{['st','en'].forEach(p=>$(p+n).oninput=()=>$("du"+n).value=duration(minutes($("st"+n).value,$("en"+n).value))) });$('bFrom').oninput=$('bTo').oninput=calcBreak;

async function exportShiftExcel(){
 try {
 if(!shiftRows.length)return toast('Tidak ada data shift untuk diekspor.');
 const wb=new ExcelJS.Workbook();
 const month=$('filterMonth').value||new Date().toISOString().slice(0,7);
 const [yy,mm]=month.split('-');
 const lastDay=new Date(Number(yy),Number(mm),0).getDate();
 const monthName=new Date(Number(yy),Number(mm)-1,1).toLocaleString('id-ID',{month:'long'}).toUpperCase();
 const ws=wb.addWorksheet(`Laporan Shift ${monthName.charAt(0)+monthName.slice(1).toLowerCase()} ${yy}`);
 ws.columns=[{width:14},{width:18},{width:34},{width:18},{width:34},{width:58},{width:3},{width:31},{width:18},{width:55}];
 ws.views=[{showGridLines:false}];
 ws.mergeCells('A1:J1');ws.getCell('A1').value=`LAPORAN OPERASIONAL & MAINTENANCE HMC - ${monthName} ${yy}`;
 ws.getRow(1).height=30;
 ws.mergeCells('A2:J2');ws.getCell('A2').value='Shift I: 08:00 - 20:00 | Shift II: 20:00 - 08:00 | Status: Standby, Maintenance, Operasi, Breakdown';
 ws.getRow(2).height=24;
 ws.mergeCells('A4:A5');ws.getCell('A4').value='DATE';
 ws.mergeCells('B4:C4');ws.getCell('B4').value='SHIFT I (08:00 - 20:00)';
 ws.mergeCells('D4:E4');ws.getCell('D4').value='SHIFT II (20:00 - 08:00)';
 ws.mergeCells('F4:F5');ws.getCell('F4').value='KETERANGAN / DETAIL KEGIATAN & BREAKDOWN';
 ws.mergeCells('H4:J4');ws.getCell('H4').value=`RINGKASAN REKAPITULASI ${monthName} ${yy} (1 - ${lastDay} ${monthName})`;
 ws.getCell('B5').value='Status';ws.getCell('C5').value='Jam / Rincian';ws.getCell('D5').value='Status';ws.getCell('E5').value='Jam / Rincian';
 const head='1F4E78', dark='16324F', border={top:{style:'thin',color:{argb:'9FBAD0'}},left:{style:'thin',color:{argb:'9FBAD0'}},bottom:{style:'thin',color:{argb:'9FBAD0'}},right:{style:'thin',color:{argb:'9FBAD0'}}};
 ws.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:dark}};ws.getCell('A1').font={bold:true,size:15,color:{argb:'FFFFFF'}};ws.getCell('A1').alignment={horizontal:'center',vertical:'middle'};
 ws.getCell('A2').font={italic:true,size:10,color:{argb:'404040'}};ws.getCell('A2').alignment={horizontal:'center',vertical:'middle'};
 ['A4','B4','D4','F4','H4','B5','C5','D5','E5'].forEach(a=>{const c=ws.getCell(a);c.fill={type:'pattern',pattern:'solid',fgColor:{argb:head}};c.font={bold:true,color:{argb:'FFFFFF'},size:10};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border=border});
 ws.getRow(4).height=34;ws.getRow(5).height=30;
 function shiftDetail(st,en,dur){if(st&&en)return `${st} - ${en}${dur!=null&&dur!==''?` (${duration(dur)})`:''}`;return '-'}
 function statusFill(v){v=(v||'').toLowerCase();if(v.includes('breakdown'))return 'F4CCCC';if(v.includes('maintenance'))return 'D9EAF7';if(v.includes('operasi'))return 'E2F0D9';if(v.includes('standby'))return 'FFF2CC';return 'FFFFFF'}
 const byDate={};shiftRows.forEach(x=>{(byDate[x.report_date]??=[]).push(x)});
 const dates=Object.keys(byDate).sort();
 let r=6;
 for(const d of dates){
  for(const x of byDate[d]){
   ws.getCell(r,1).value=dateFmt(d);ws.getCell(r,2).value=x.shift1_status||'-';ws.getCell(r,3).value=shiftDetail(x.shift1_start,x.shift1_end,x.shift1_duration);ws.getCell(r,4).value=x.shift2_status||'-';ws.getCell(r,5).value=shiftDetail(x.shift2_start,x.shift2_end,x.shift2_duration);ws.getCell(r,6).value=x.detail||'-';
   for(let c=1;c<=10;c++){ws.getCell(r,c).border=border;ws.getCell(r,c).alignment={vertical:'top',wrapText:true,font:{size:9}}}
   ws.getCell(r,2).fill={type:'pattern',pattern:'solid',fgColor:{argb:statusFill(x.shift1_status)}};ws.getCell(r,4).fill={type:'pattern',pattern:'solid',fgColor:{argb:statusFill(x.shift2_status)}};ws.getCell(r,1).font={bold:true,size:9};ws.getRow(r).height=42;r++;
  }
 }
 const hasStatus=(x,word)=>[x.shift1_status,x.shift2_status].some(v=>(v||'').toLowerCase().includes(word));
 const standby=dates.filter(d=>byDate[d].length&&byDate[d].every(x=>!hasStatus(x,'maintenance')&&!hasStatus(x,'operasi')&&!hasStatus(x,'breakdown')&&[x.shift1_status,x.shift2_status].filter(Boolean).every(v=>v.toLowerCase().includes('standby'))));
 const maintenance=dates.filter(d=>byDate[d].some(x=>hasStatus(x,'maintenance')));
 const operasi=dates.filter(d=>byDate[d].some(x=>hasStatus(x,'operasi')));
 const breakdownRecords=shiftRows.filter(x=>hasStatus(x,'breakdown'));
 const breakdownCount=breakdownRecords.length;
 const fmtDateList=arr=>arr.length?arr.map(d=>`${new Date(d+'T00:00:00').getDate()} ${monthName.charAt(0)+monthName.slice(1).toLowerCase()}`).join(', '):'-';
 const breakdownDetails=breakdownRecords.map(x=>x.detail||[x.shift1_note,x.shift2_note].filter(Boolean).join('; ')).filter(Boolean);
 const summary=[
  ['Total Hari Standby Murni',`${standby.length} Hari`,fmtDateList(standby)],
  ['Total Hari Ada Maintenance',`${maintenance.length} Hari`,maintenance.length?'Maintenance rutin, service, test fungsi, repair, dan pekerjaan maintenance yang diinput':'-'],
  ['Total Hari Operasi Kapal',`${operasi.length} Hari`,operasi.length?'Data berdasarkan status Operasi yang diinput pada Shift I/II':'-'],
  ['Total Kejadian Breakdown',`${breakdownCount} Kali`,breakdownDetails.join(' | ')||'-'],
 ];
 summary.forEach((a,i)=>{const rr=5+i;ws.getCell(rr,8).value=a[0];ws.getCell(rr,9).value=a[1];ws.getCell(rr,10).value=a[2];for(let c=8;c<=10;c++){const cell=ws.getCell(rr,c);cell.border=border;cell.alignment={vertical:'top',wrapText:true,font:{size:9}};if(c===8)cell.font={bold:true,size:9}}ws.getRow(rr).height=i===4?48:42});
 const noteRow=Math.max(r+1,38);
 ws.mergeCells(`A${noteRow}:F${noteRow}`);ws.getCell(`A${noteRow}`).value='📌 CATATAN TEKNIS AKUMULASI JAM MAINTENANCE & PERBAIKAN (ENGINE HOUR LOG)';ws.getCell(`A${noteRow}`).fill={type:'pattern',pattern:'solid',fgColor:{argb:head}};ws.getCell(`A${noteRow}`).font={bold:true,color:{argb:'FFFFFF'},size:10};ws.getCell(`A${noteRow}`).alignment={vertical:'middle',wrapText:true};ws.getRow(noteRow).height=25;
 ws.mergeCells(`A${noteRow+1}:F${noteRow+5}`);ws.getCell(`A${noteRow+1}`).value=`Pencatatan Durasi Engine ON\n\n1. Engine ON: Durasi maintenance maupun operasional yang dicantumkan merupakan waktu saat engine benar-benar hidup. Akumulasi Engine ON Log hanya dihitung dari kondisi mesin hidup, termasuk functional test, warm-up, troubleshooting dengan mesin hidup, travelling/relokasi unit, dan post-repair running validation.\n\n2. Engine OFF / Static Work: Pekerjaan fisik yang dilakukan saat mesin mati tidak dihitung sebagai Engine ON, seperti dismantling/installation, welding, machining, static inspection, dan penggantian spare part. Durasi pekerjaan dapat berlangsung satu shift atau lebih, tetapi tetap dibedakan dari akumulasi Engine ON berdasarkan kondisi aktual mesin.`;ws.getCell(`A${noteRow+1}`).alignment={wrapText:true,vertical:'top',font:{size:9}};ws.getCell(`A${noteRow+1}`).border=border;
 ws.views=[{state:'frozen',ySplit:5}];ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printArea:`A1:J${noteRow+5}`};
 const buf=await wb.xlsx.writeBuffer();const a=document.createElement('a');const url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.href=url;a.download=`Laporan_Shift_HMC_${monthName}_${yy}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
 } catch(e) { console.error('Export Shift Excel error:',e); toast('Gagal membuat Excel Shift: '+(e?.message||e)); }
}

async function exportBreakExcel(){
 if(!breakRows.length)return toast('Tidak ada data breakdown untuk diekspor.');
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('BREAKDOWN REPORT');
 ws.columns=[{width:7},{width:12},{width:14},{width:10},{width:10},{width:14},{width:32},{width:32},{width:30},{width:32},{width:28},{width:18},{width:18},{width:24},{width:24}];
 ws.mergeCells('A1:O1');ws.getCell('A1').value='BREAKDOWN REPORT OF HMC';ws.getCell('A1').font={bold:true,size:16,color:{argb:'FFFFFF'}};ws.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'16324F'}};
 ws.mergeCells('A2:O2');ws.getCell('A2').value='Laporan kejadian breakdown dan tindakan perbaikan HMC';ws.addRow([]);
 const headers=['No','Machine','Date','From','To','Down Time (HRS)','Problem Description','Checking Steps','Problem Root Cause','Corrective Actions Taken','Spare Parts / Materials Consumed','PIC','Stratification','Foto/Dokumentasi','Remaks'];ws.addRow(headers);
 for(let c=1;c<=15;c++){let z=ws.getCell(4,c);z.fill={type:'pattern',pattern:'solid',fgColor:{argb:'1F4E78'}};z.font={bold:true,color:{argb:'FFFFFF'}};z.alignment={horizontal:'center',vertical:'middle',wrapText:true};}
 const border={top:{style:'thin',color:{argb:'B7C9D6'}},left:{style:'thin',color:{argb:'B7C9D6'}},bottom:{style:'thin',color:{argb:'B7C9D6'}},right:{style:'thin',color:{argb:'B7C9D6'}}};
 let r=5; for(const x of breakRows){ws.addRow([x.report_no,x.machine,dateFmt(x.breakdown_date),x.time_from||'',x.time_to||'',(x.down_time_minutes||0)/60,x.problem_description||'',x.checking_steps||'',x.root_cause||'',x.corrective_actions||'',x.spare_parts||'',x.pic||'',x.stratification||'', '',x.remarks||'']); ws.getCell(r,6).numFmt='0.00'; for(let c=1;c<=15;c++){ws.getCell(r,c).border=border;ws.getCell(r,c).alignment={vertical:'top',wrapText:true};} ws.getRow(r).height=90;
  if(x.photo_url){try{const resp=await fetch(x.photo_url);if(resp.ok){const ab=await resp.arrayBuffer();let ext='jpeg';const ct=resp.headers.get('content-type')||'';if(ct.includes('png'))ext='png';else if(ct.includes('gif'))ext='gif';const imageId=wb.addImage({buffer:ab,extension:ext});ws.addImage(imageId,{tl:{col:13.15,row:r-1},br:{col:13.95,row:r-0.05}});}}catch(e){ws.getCell(r,14).value='Foto tidak dapat disematkan';}}
  r++;
 }
 ws.views=[{state:'frozen',ySplit:4}];ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printArea:`A1:O${r-1}`};
 const buf=await wb.xlsx.writeBuffer();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download='BREAKDOWN_REPORT_HMC.xlsx';a.click();URL.revokeObjectURL(a.href)
}
window.exportShiftExcel=exportShiftExcel;
$('downloadShift').onclick=exportShiftExcel;
$('loginBtn').onclick=login;$('logoutBtn').onclick=logout;$('navShift').onclick=()=>module('shift');$('navBreak').onclick=()=>module('breakdown');$('navMonitor').onclick=()=>module('monitor');$('monitorMonth').onchange=loadMonitor;$('shiftSave').onclick=saveShift;$('shiftCancel').onclick=resetShift;$('breakSave').onclick=saveBreak;$('breakCancel').onclick=resetBreak;$('filterMonth').onchange=loadShift;$('bPhoto').onchange=()=>{let f=$('bPhoto').files[0];$('photoInfo').textContent=f?`Foto dipilih: ${f.name}`:''};$('filterMonth').value=new Date().toISOString().slice(0,7);resetShift();resetBreak();
