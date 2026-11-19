'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'₦'+Number(n).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2500)};
/* ---- IndexedDB ---- */
const open=()=>new Promise((ok,no)=>{const r=indexedDB.open('yanbiyu',1);r.onupgradeneeded=()=>r.result.createObjectStore('invoices',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const run=async(mode,fn)=>{const d=await open();return new Promise((ok,no)=>{const t=d.transaction('invoices',mode),q=fn(t.objectStore('invoices'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
const getAll=()=>run('readonly',s=>s.getAll()).then(a=>a.sort((x,y)=>y.created-x.created));
const putInv=i=>run('readwrite',s=>s.put(i)),delInv=id=>run('readwrite',s=>s.delete(id));
/* ---- navigation ---- */
let current=null;
function show(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id===v));$$('nav button[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===(v==='view'?'hist':v)));scrollTo(0,0);
 if(v==='dash')renderDash();if(v==='hist')renderHist();if(v==='new'&&!$('#iNo').value)resetForm()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-view],[data-go]');if(b)show(b.dataset.view||b.dataset.go)});
/* ---- invoice form ---- */
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n};
async function nextNo(){const a=await getAll();let m=num(localStorage.ybSeq);a.forEach(i=>m=Math.max(m,num(String(i.number).split('-').pop())));return 'YB-'+new Date().getFullYear()+'-'+String(m+1).padStart(4,'0')}
function addRow(d='',q='',p=''){const tr=document.createElement('tr');
 tr.innerHTML='<td><input class="d" maxlength="120" placeholder="e.g. Bedsheet"></td><td><input class="q" type="number" min="0" step="any" inputmode="decimal"></td><td><input class="p" type="number" min="0" step="any" inputmode="decimal"></td><td class="amt">₦0.00</td><td><button class="danger rm" type="button">Remove</button></td>';
 tr.querySelector('.d').value=d;tr.querySelector('.q').value=q;tr.querySelector('.p').value=p;$('#items tbody').append(tr);calc()}
function rows(){return $$('#items tbody tr').map(tr=>({desc:tr.querySelector('.d').value.trim(),qty:num(tr.querySelector('.q').value),price:num(tr.querySelector('.p').value),tr}))}
function calc(){let sub=0;rows().forEach(r=>{const a=r.qty*r.price;sub+=a;r.tr.querySelector('.amt').textContent=fmt(a)});
 const d=Math.min(Math.max(num($('#disc').value),0),sub);$('#tSub').textContent=fmt(sub);$('#tDisc').textContent=fmt(d);$('#tGrand').textContent=fmt(sub-d);return{sub,d}}
async function resetForm(){$('#cName').value='';$('#cPhone').value='';$('#disc').value=0;$('#iDate').value=today();$('#iNo').value=await nextNo();$('#items tbody').innerHTML='';addRow();$('#err').textContent=''}
$('#addRow').onclick=()=>addRow();$('#reset').onclick=resetForm;
$('#items').addEventListener('input',calc);$('#disc').addEventListener('input',calc);
$('#items').addEventListener('click',e=>{if(e.target.classList.contains('rm')){e.target.closest('tr').remove();if(!$$('#items tbody tr').length)addRow();calc()}});
$('#save').onclick=async()=>{const err=m=>{$('#err').textContent=m;return 0};
 const name=$('#cName').value.trim();if(!name)return err('Please enter the customer name.');
 const date=$('#iDate').value;if(!date)return err('Please choose an invoice date.');
 const items=[];for(const r of rows()){if(!r.desc&&!r.qty&&!r.price)continue;
  if(!r.desc)return err('Every item needs a description.');if(!(r.qty>0))return err('Quantity must be greater than zero for "'+r.desc+'".');
  if(r.price<0||!isFinite(r.price))return err('Unit price cannot be negative.');items.push({desc:r.desc,qty:r.qty,price:r.price})}
 if(!items.length)return err('Add at least one item before saving.');
 const sub=items.reduce((s,i)=>s+i.qty*i.price,0),dRaw=num($('#disc').value);
 if(dRaw<0)return err('Discount cannot be negative.');if(dRaw>sub)return err('Discount cannot be more than the subtotal.');
 const inv={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),number:$('#iNo').value,date,name,phone:$('#cPhone').value.trim(),items,subtotal:sub,discount:dRaw,total:sub-dRaw,created:Date.now()};
 await putInv(inv);localStorage.ybSeq=num(inv.number.split('-').pop());$('#iNo').value='';toast('Invoice saved');openInv(inv)};
/* ---- invoice sheet ---- */
const dLong=d=>{const [y,m,dd]=d.split('-');return new Date(y,m-1,dd).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
function sheet(i){return `<div class="sheet" id="sheet"><div class="hd"><h1>YAN BIYU GLOBAL CONCEPT</h1><p>Premium Household Goods – Quality You Trust.</p></div><div class="bd">
<div class="meta"><div><h2>INVOICE</h2><b>Billed to:</b><br>${esc(i.name)}${i.phone?'<br>Tel: '+esc(i.phone):''}</div><div style="text-align:right"><b>Invoice No:</b> ${esc(i.number)}<br><b>Date:</b> ${esc(dLong(i.date))}</div></div>
<table><thead><tr><th>Item Description</th><th>Qty</th><th>Unit Price (₦)</th><th>Amount (₦)</th></tr></thead><tbody>${i.items.map(x=>`<tr><td>${esc(x.desc)}</td><td>${x.qty}</td><td>${fmt(x.price)}</td><td>${fmt(x.qty*x.price)}</td></tr>`).join('')}</tbody></table>
<div class="tot"><div><span>Subtotal</span><span>${fmt(i.subtotal)}</span></div>${i.discount>0?`<div><span>Discount</span><span>- ${fmt(i.discount)}</span></div>`:''}<div class="g"><span>Grand Total</span><span>${fmt(i.total)}</span></div></div></div>
<div class="ft">Thank you for your patronage!</div></div>`}
function openInv(i){current=i;$('#sheetBox').innerHTML=sheet(i);show('view')}
$('#bPrint').onclick=()=>print();
/* ---- offline PDF (hand-built, no libraries) ---- */
function makePdf(i){const E=t=>String(t).replace(/[^\x20-\x7e]/g,'?').replace(/([\\()])/g,'\\$1'),M=n=>'NGN '+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const pages=[];let c,y;const W=(s,b)=>s*(b?.58:.52);
 const T=(x,yy,t,s=10,b=0,col='0 0 0',r=0)=>{t=E(t);if(r)x-=t.length*W(s,b);c+=`${col} rg BT /F${b?2:1} ${s} Tf ${x.toFixed(1)} ${yy} Td (${t}) Tj ET\n`};
 const page=()=>{c='0.043 0.122 0.247 rg 0 742 595 100 re f 0.788 0.635 0.153 rg 0 738 595 4 re f\n';T(40,800,'YAN BIYU GLOBAL CONCEPT',22,1,'0.788 0.635 0.153');T(40,775,'Premium Household Goods - Quality You Trust.',10,0,'1 1 1');
  T(40,705,'INVOICE',16,1,'0.043 0.122 0.247');T(40,688,'Billed to: '+i.name,11);if(i.phone)T(40,674,'Tel: '+i.phone,10);T(555,705,'Invoice No: '+i.number,10,1,'0 0 0',1);T(555,690,'Date: '+i.date,10,0,'0 0 0',1);
  c+='0.043 0.122 0.247 rg 40 640 515 20 re f\n';T(46,646,'Item Description',10,1,'1 1 1');T(340,646,'Qty',10,1,'1 1 1',1);T(440,646,'Unit Price',10,1,'1 1 1',1);T(550,646,'Amount',10,1,'1 1 1',1);y=625;pages.push(null)};
 const end=()=>{T(297,40,'Thank you for your patronage!',11,1,'0.043 0.122 0.247');pages[pages.length-1]=c};
 page();
 i.items.forEach(x=>{const ls=[];let s=E(x.desc);while(s.length>46){let k=s.lastIndexOf(' ',46);if(k<10)k=46;ls.push(s.slice(0,k));s=s.slice(k).trim()}ls.push(s);
  if(y-ls.length*13<110){end();page()}
  T(46,y,ls[0]);T(340,y,String(x.qty),10,0,'0 0 0',1);T(440,y,M(x.price),10,0,'0 0 0',1);T(550,y,M(x.qty*x.price),10,0,'0 0 0',1);ls.slice(1).forEach((l,n)=>T(46,y-13*(n+1),l));
  y-=ls.length*13+4;c+=`0.85 0.87 0.9 RG 40 ${y+9} m 555 ${y+9} l S\n`});
 if(y<130){end();page()}
 y-=10;T(400,y,'Subtotal',11);T(550,y,M(i.subtotal),11,0,'0 0 0',1);if(i.discount>0){y-=18;T(400,y,'Discount',11);T(550,y,'- '+M(i.discount),11,0,'0 0 0',1)}
 y-=10;c+=`0.788 0.635 0.153 rg 380 ${y} 175 2 re f\n`;y-=18;T(400,y,'Grand Total',12,1,'0.043 0.122 0.247');T(550,y,M(i.total),12,1,'0.043 0.122 0.247',1);end();
 const o=[];o[1]='<</Type/Catalog/Pages 2 0 R>>';o[3]='<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>';o[4]='<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>';const kids=[];
 pages.forEach((p,n)=>{const a=5+n*2;kids.push(a+' 0 R');o[a]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ${a+1} 0 R>>`;o[a+1]=`<</Length ${p.length}>>\nstream\n${p}\nendstream`});
 o[2]=`<</Type/Pages/Kids[${kids.join(' ')}]/Count ${kids.length}>>`;
 let s='%PDF-1.4\n';const off=[];for(let n=1;n<o.length;n++){off[n]=s.length;s+=`${n} 0 obj\n${o[n]}\nendobj\n`}
 const xr=s.length;s+=`xref\n0 ${o.length}\n0000000000 65535 f \n`+off.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length}/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF`;
 return new Blob([Uint8Array.from(s,ch=>ch.charCodeAt(0))],{type:'application/pdf'})}
const save=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3e3)};
$('#bPdf').onclick=()=>{save(makePdf(current),current.number+'.pdf');toast('PDF downloaded')};
$('#bShare').onclick=async()=>{const f=new File([makePdf(current)],current.number+'.pdf',{type:'application/pdf'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Invoice '+current.number,text:'Invoice '+current.number+' from Yan Biyu Global Concept'})}
 else{save(f,f.name);toast('Sharing not supported here – PDF downloaded instead')}}catch(e){if(e.name!=='AbortError'){save(f,f.name);toast('Could not share – PDF downloaded instead')}}};
/* ---- dashboard & history ---- */
const list=(a,actions)=>a.length?`<div class="scroll"><table><thead><tr><th>No.</th><th>Date</th><th>Customer</th><th>Total</th><th></th></tr></thead><tbody>${a.map(i=>`<tr><td>${esc(i.number)}</td><td>${esc(i.date)}</td><td>${esc(i.name)}</td><td>${fmt(i.total)}</td><td style="white-space:nowrap"><button data-open="${i.id}">View</button> ${actions?`<button data-print="${i.id}">Print</button> <button class="danger" data-del="${i.id}">Delete</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p>No invoices yet.</p>';
async function renderDash(){const a=await getAll();$('#dCount').textContent=a.length;$('#dSales').textContent=fmt(a.reduce((s,i)=>s+i.total,0));const mo=today().slice(0,7);$('#dMonth').textContent=fmt(a.filter(i=>i.date.startsWith(mo)).reduce((s,i)=>s+i.total,0));$('#dRecent').innerHTML=list(a.slice(0,5),0)}
async function renderHist(){const q=$('#q').value.trim().toLowerCase(),f=$('#fDate').value;const a=(await getAll()).filter(i=>(!q||i.name.toLowerCase().includes(q)||i.number.toLowerCase().includes(q))&&(!f||i.date===f));$('#hList').innerHTML=list(a,1)}
$('#q').oninput=$('#fDate').onchange=renderHist;$('#clearF').onclick=()=>{$('#q').value=$('#fDate').value='';renderHist()};
document.addEventListener('click',async e=>{const b=e.target.closest('[data-open],[data-print],[data-del]');if(!b)return;const id=b.dataset.open||b.dataset.print||b.dataset.del;const inv=(await getAll()).find(i=>i.id===id);if(!inv)return;
 if(b.dataset.del){if(confirm('Delete invoice '+inv.number+' for '+inv.name+'?\nThis cannot be undone. Export a backup first if unsure.')){await delInv(id);toast('Invoice deleted');renderHist();renderDash()}}
 else{openInv(inv);if(b.dataset.print)setTimeout(()=>print(),150)}});
/* ---- backup ---- */
$('#bExp').onclick=async()=>{const a=await getAll();save(new Blob([JSON.stringify({app:'yanbiyu',version:1,exported:new Date().toISOString(),invoices:a},null,1)],{type:'application/json'}),'yanbiyu-backup-'+today()+'.json');$('#bMsg').textContent=a.length+' invoice(s) exported.'};
$('#bImp').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!=='yanbiyu'||!Array.isArray(d.invoices))throw 0;let n=0;
 for(const i of d.invoices){if(i&&typeof i.id==='string'&&typeof i.number==='string'&&typeof i.name==='string'&&/^\d{4}-\d\d-\d\d$/.test(i.date)&&Array.isArray(i.items)&&i.items.every(x=>typeof x.desc==='string'&&x.qty>0&&x.price>=0)){
  const sub=i.items.reduce((s,x)=>s+x.qty*x.price,0),dc=Math.min(Math.max(num(i.discount),0),sub);await putInv({id:i.id,number:i.number,date:i.date,name:i.name,phone:String(i.phone||''),items:i.items.map(x=>({desc:x.desc,qty:+x.qty,price:+x.price})),subtotal:sub,discount:dc,total:sub-dc,created:num(i.created)||Date.now()});n++}}
 $('#bMsg').textContent='Restored '+n+' invoice(s).'}catch{$('#bMsg').textContent='That file is not a valid Yan Biyu backup.'}e.target.value=''};
/* ---- PWA ---- */
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').hidden=false});
$('#install').onclick=async()=>{if(dp){dp.prompt();dp=null;$('#install').hidden=true}};
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
show('dash');
