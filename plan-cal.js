state.plans = state.plans || { months: {}, years: {}, marks: {} };
state.plans.months = state.plans.months || {};
state.plans.years = state.plans.years || {};
state.plans.marks = state.plans.marks || {};
let viewMonth = (function(){const d=new Date(); if(d.getDate()>=20) d.setMonth(d.getMonth()+1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
let viewYear = String(new Date().getFullYear());
let calMonth = today().slice(0,7);
let calSelected = today();
function ymLabel(ym){if(!ym)return ''; const p=ym.split('-'); return p[0]+' 年 '+Number(p[1])+' 月';}
function shiftYm(ym,n){const p=ym.split('-').map(Number); const d=new Date(p[0],p[1]-1+n,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function mplan(ym){state.plans.months[ym]=state.plans.months[ym]||{theme:'',items:[]}; return state.plans.months[ym];}
function yplan(y){y=String(y); state.plans.years[y]=state.plans.years[y]||{theme:'',items:[]}; return state.plans.years[y];}
function jFaces(date){const j=(state.journals||[]).find(x=>x.date===date); if(!j||!j.faces) return []; return D.filter(d=>j.faces[d.id]&&(j.faces[d.id].touched||j.faces[d.id].text)).map(d=>d.id);}
function hits(ym,dom){return (state.journals||[]).filter(j=>j.date&&j.date.slice(0,7)===ym&&j.faces&&j.faces[dom]&&(j.faces[dom].touched||j.faces[dom].text)).map(j=>j.date);}
function prog(it,ym){return Array.from(new Set((it.progress||[]).concat(hits(ym,it.domain))));}
function fillHomePlan(){
  const box=$('home-month-plan'); if(!box) return;
  const now=today().slice(0,7); const mp=mplan(now);
  if($('home-month-label')) $('home-month-label').textContent=ymLabel(now);
  box.innerHTML = (mp.items||[]).length
    ? (mp.theme?`<div class="muted" style="margin-bottom:8px">${esc(mp.theme)}</div>`:'')+(mp.items.slice(0,6).map(it=>{ const d=by(it.domain)||{name:it.domain,color:'#c4a574'}; const n=prog(it,now).length; return `<div class="item"><i class="dot" style="background:${d.color};margin-top:6px"></i><div class="grow"><b>${d.name}</b> ${esc(it.text)}<div class="faint">${it.status==='done'?'完成':n?'已推進 '+n+' 日':'未開始'}</div></div></div>`; }).join(''))
    : '<div class="empty">呢個月未有規劃。去規劃頁按八面加。</div>';
  const hp=$('home-people');
  if(hp) hp.innerHTML=(state.people||[]).length?(state.people.slice(0,4).map(p=>`<div class="item"><div class="grow"><b>${esc(p.name)}</b> <span class="pill">${esc(p.relation||'')}</span></div></div>`).join('')):'<div class="empty">未加人。</div>';
  const hi=$('home-inner');
  if(hi) hi.innerHTML=state.inner&&state.inner.manifesto?esc(state.inner.manifesto).slice(0,120):(state.inner&&state.inner.values?'價值：'+esc(state.inner.values):'仲未寫宣言。');
}
function fillJournalPlans(){
  const box=$('journal-plans'); if(!box) return;
  const date=$('journal-date').value||today(); const ym=date.slice(0,7); const mp=mplan(ym);
  const yearItems=(yplan(date.slice(0,4)).items||[]).filter(it=>it.status!=='done');
  if(!(mp.items||[]).length && !yearItems.length){ box.innerHTML=`<div class="empty">${ymLabel(ym)}未有規劃。</div>`; return; }
  box.innerHTML=(mp.items||[]).map(it=>{ const d=by(it.domain)||{name:it.domain,color:'#c4a574'}; const n=prog(it,ym).length; const ck=(it.progress||[]).includes(date); return `<div class="item"><input type="checkbox" data-advance-plan="${it.id}" ${ck?'checked':''} /><div class="grow"><b style="color:${d.color}">${d.name}</b> ${esc(it.text)} <span class="status-pill ${it.status||'todo'}">${it.status==='done'?'完成':n?'已 '+n+' 日':'未開始'}</span></div></div>`; }).join('')+yearItems.slice(0,3).map(it=>{ const d=by(it.domain)||{name:it.domain,color:'#c4a574'}; return `<div class="item"><div class="grow"><span class="pill">年規</span> <b style="color:${d.color}">${d.name}</b> ${esc(it.text)}</div></div>`; }).join('');
}
function applyChecks(date){
  const mp=mplan(date.slice(0,7));
  document.querySelectorAll('[data-advance-plan]').forEach(cb=>{ const it=mp.items.find(x=>x.id===cb.dataset.advancePlan); if(!it) return; it.progress=it.progress||[]; if(cb.checked){ if(!it.progress.includes(date)) it.progress.push(date); if(it.status!=='done') it.status='doing'; } else it.progress=it.progress.filter(x=>x!==date); });
}
function renderPlan(){
  if($('plan-month') && !$('plan-month').value) $('plan-month').value=viewMonth;
  if($('plan-year') && !$('plan-year').value) $('plan-year').value=viewYear;
  viewMonth=$('plan-month').value||viewMonth; viewYear=String($('plan-year').value||viewYear);
  const mp=mplan(viewMonth), yp=yplan(viewYear);
  $('plan-month-title').textContent=ymLabel(viewMonth);
  $('plan-year-title').textContent=viewYear+' 年';
  $('plan-month-theme').value=mp.theme||'';
  $('plan-year-theme').value=yp.theme||'';
  $('plan-month-list').innerHTML=D.map(d=>{ const items=(mp.items||[]).filter(it=>it.domain===d.id); return `<div class="plan-domain"><h3 style="color:${d.color}">${d.name}</h3>${items.map(it=>`<div class="item"><div class="grow">${esc(it.text)} <span class="status-pill ${it.status||'todo'}">${it.status==='done'?'完成':it.status==='doing'?'進行':'未開始'}</span><div class="faint">${it.date||'未定日'} · 推進 ${prog(it,viewMonth).length} 日</div></div><button class="btn ghost" data-plan-status="${it.id}">${it.status==='done'?'設返未完成':'完成'}</button><button class="icon-btn" data-del-month-item="${it.id}">刪</button></div>`).join('')||'<div class="faint">未有項目。</div>'}<div class="row" style="margin-top:8px"><input data-new-month="${d.id}" type="text" placeholder="加一件 ${d.name}" /><input data-new-month-date="${d.id}" type="date" style="max-width:150px" /><button class="btn" data-add-month="${d.id}">加入</button></div></div>`; }).join('');
  $('plan-year-list').innerHTML=D.map(d=>{ const items=(yp.items||[]).filter(it=>it.domain===d.id); return `<div class="plan-domain"><h3 style="color:${d.color}">${d.name}</h3>${items.map(it=>`<div class="item"><div class="grow">${esc(it.text)} <span class="status-pill ${it.status||'todo'}">${it.status==='done'?'完成':'未完成'}</span></div><button class="btn ghost" data-year-status="${it.id}">${it.status==='done'?'設返未完成':'完成'}</button><button class="icon-btn" data-del-year-item="${it.id}">刪</button></div>`).join('')||'<div class="faint">未有年目標。</div>'}<div class="row" style="margin-top:8px"><input data-new-year="${d.id}" type="text" placeholder="今年 ${d.name}" /><button class="btn" data-add-year="${d.id}">加入</button></div></div>`; }).join('');
}
function renderCalDay(date){
  calSelected=date;
  document.querySelectorAll('.cal-cell[data-cal-day]').forEach(c=>c.classList.toggle('on',c.dataset.calDay===date));
  $('cal-day-title').textContent=date;
  const done=jFaces(date); const j=(state.journals||[]).find(x=>x.date===date);
  const mp=mplan(date.slice(0,7));
  const dayItems=(mp.items||[]).filter(it=>it.date===date||(it.progress||[]).includes(date));
  const marks=state.plans.marks[date]||{};
  const paint=D.map(d=>`<button type="button" class="chip${marks[d.id]?' active':''}" data-paint="${d.id}" data-paint-date="${date}">${d.name}</button>`).join('');
  const doneHtml=done.length?done.map(id=>{const d=by(id); const t=j&&j.faces&&j.faces[id]?j.faces[id].text:''; return `<div class="item"><i class="dot" style="background:${d.color};margin-top:6px"></i><div class="grow"><b>${d.name}</b><div>${esc(t||'有記低')}</div></div></div>`;}).join(''):'<div class="empty">呢日未有日記。</div>';
  const planHtml=dayItems.length?('<div class="muted" style="margin:12px 0 6px">規劃</div>'+dayItems.map(it=>`<div class="item"><div class="grow"><b>${by(it.domain).name}</b> ${esc(it.text)}</div></div>`).join('')):'';
  $('cal-day-body').innerHTML=`${doneHtml}${planHtml}<label class="field">將會做（抹低打算）</label><div class="energy wrap">${paint}</div><div class="row" style="margin-top:12px"><button class="btn primary" id="cal-open-journal">寫／睇呢日日記</button></div>`;
  $('cal-open-journal').onclick=()=>{ $('journal-date').value=date; go('checkin'); };
}
function renderCalendar(){
  if($('cal-month') && !$('cal-month').value) $('cal-month').value=calMonth;
  calMonth=$('cal-month').value||calMonth;
  $('cal-title').textContent=ymLabel(calMonth);
  $('cal-legend').innerHTML=D.map(d=>`<span><i style="background:${d.color}"></i>${d.name}</span>`).join('')+'<span>實心＝做過 · 空心＝將會做</span>';
  const [yy,mm]=calMonth.split('-').map(Number);
  const startDow=(new Date(yy,mm-1,1).getDay()+6)%7;
  const daysIn=new Date(yy,mm,0).getDate();
  const prevDays=new Date(yy,mm-1,0).getDate();
  const cells=["一","二","三","四","五","六","日"].map(n=>`<div class="cal-dow">${n}</div>`);
  for(let i=0;i<startDow;i++) cells.push(`<div class="cal-cell out"><div class="num">${prevDays-startDow+i+1}</div></div>`);
  const mp=mplan(calMonth);
  for(let day=1;day<=daysIn;day++){
    const date=calMonth+'-'+String(day).padStart(2,'0');
    const done=jFaces(date); const planned={};
    (mp.items||[]).forEach(it=>{ if(it.date===date) planned[it.domain]=true; });
    Object.keys(state.plans.marks[date]||{}).forEach(k=>{ if(state.plans.marks[date][k]) planned[k]=true; });
    const dots=D.map(d=>{ const isDone=done.includes(d.id), isPlan=!!planned[d.id]; if(!isDone&&!isPlan) return ''; return `<i class="${isDone?'done':''}" style="color:${d.color}"></i>`; }).join('');
    cells.push(`<div class="cal-cell${date===today()?' today':''}${date===calSelected?' on':''}" data-cal-day="${date}"><div class="num">${day}</div><div class="cal-dots">${dots}</div></div>`);
  }
  $('cal-grid').innerHTML=cells.join('');
  renderCalDay(calSelected && calSelected.slice(0,7)===calMonth ? calSelected : calMonth+'-01');
}
const _go = go;
go = function(p){ _go(p); if(p==='home') fillHomePlan(); if(p==='checkin') fillJournalPlans(); if(p==='plan') renderPlan(); if(p==='calendar') renderCalendar(); };
const _home = home;
home = function(){ _home(); fillHomePlan(); };
const oldSave = $('save-checkin').onclick;
$('save-checkin').onclick = function(){ const date = ($('journal-date')&&$('journal-date').value)||today(); applyChecks(date); if(oldSave) oldSave(); fillJournalPlans(); };
$('plan-month').onchange=()=>{viewMonth=$('plan-month').value; renderPlan();};
$('plan-year').onchange=()=>{viewYear=$('plan-year').value; renderPlan();};
$('plan-month-prev').onclick=()=>{viewMonth=shiftYm(viewMonth,-1);$('plan-month').value=viewMonth;renderPlan();};
$('plan-month-next').onclick=()=>{viewMonth=shiftYm(viewMonth,1);$('plan-month').value=viewMonth;renderPlan();};
$('plan-year-prev').onclick=()=>{viewYear=String(Number(viewYear)-1);$('plan-year').value=viewYear;renderPlan();};
$('plan-year-next').onclick=()=>{viewYear=String(Number(viewYear)+1);$('plan-year').value=viewYear;renderPlan();};
$('plan-month-theme').onchange=()=>{mplan(viewMonth).theme=$('plan-month-theme').value.trim(); save();};
$('plan-year-theme').onchange=()=>{yplan(viewYear).theme=$('plan-year-theme').value.trim(); save();};
$('page-plan').addEventListener('click',e=>{
  const addM=e.target.closest('[data-add-month]');
  if(addM){const id=addM.dataset.addMonth; const t=document.querySelector('[data-new-month="'+id+'"]'); const dt=document.querySelector('[data-new-month-date="'+id+'"]'); if(t&&t.value.trim()){mplan(viewMonth).items.push({id:uid(),domain:id,text:t.value.trim(),status:'todo',date:(dt&&dt.value)||'',progress:[]}); t.value=''; if(dt)dt.value=''; save(); renderPlan();} return;}
  const addY=e.target.closest('[data-add-year]');
  if(addY){const id=addY.dataset.addYear; const t=document.querySelector('[data-new-year="'+id+'"]'); if(t&&t.value.trim()){yplan(viewYear).items.push({id:uid(),domain:id,text:t.value.trim(),status:'todo',progress:[]}); t.value=''; save(); renderPlan();} return;}
  const delM=e.target.closest('[data-del-month-item]');
  if(delM){const mp=mplan(viewMonth); mp.items=mp.items.filter(x=>x.id!==delM.dataset.delMonthItem); save(); renderPlan(); return;}
  const delY=e.target.closest('[data-del-year-item]');
  if(delY){const yp=yplan(viewYear); yp.items=yp.items.filter(x=>x.id!==delY.dataset.delYearItem); save(); renderPlan(); return;}
  const stM=e.target.closest('[data-plan-status]');
  if(stM){const it=mplan(viewMonth).items.find(x=>x.id===stM.dataset.planStatus); if(it) it.status=it.status==='done'?'todo':'done'; save(); renderPlan(); return;}
  const stY=e.target.closest('[data-year-status]');
  if(stY){const it=yplan(viewYear).items.find(x=>x.id===stY.dataset.yearStatus); if(it) it.status=it.status==='done'?'todo':'done'; save(); renderPlan(); return;}
});
$('cal-month').onchange=()=>{calMonth=$('cal-month').value; renderCalendar();};
$('cal-prev').onclick=()=>{calMonth=shiftYm(calMonth,-1);$('cal-month').value=calMonth;renderCalendar();};
$('cal-next').onclick=()=>{calMonth=shiftYm(calMonth,1);$('cal-month').value=calMonth;renderCalendar();};
$('page-calendar').addEventListener('click',e=>{
  const cell=e.target.closest('[data-cal-day]'); if(cell){renderCalDay(cell.dataset.calDay); return;}
  const paint=e.target.closest('[data-paint]');
  if(paint){const date=paint.dataset.paintDate,id=paint.dataset.paint; state.plans.marks[date]=state.plans.marks[date]||{}; state.plans.marks[date][id]=!state.plans.marks[date][id]; save(); renderCalendar(); renderCalDay(date);}
});
fillHomePlan();
