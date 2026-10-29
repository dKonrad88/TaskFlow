/* hub-reun10.js — Fase 10: telas de Reuniões (Minha Agenda, Minhas Reuniões, Agendamentos, Visitas)
   com o layout/estética do Hub oficial (.ag-*). Só apresentação sobre os dados do TaskFlow (meetings). */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dt(s){var p=String(s||'').slice(0,10).split('-');return new Date(+p[0],(+p[1]||1)-1,+p[2]||1);}
function addD(s,n){var d=dt(s);d.setDate(d.getDate()+n);return iso(d);}
function seg(s){var d=dt(s),w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d);}
function hj(){return iso(new Date());}
function mm(h){var p=String(h||'').split(':');return (+p[0]||0)*60+(+p[1]||0);}
function dm(s){return s.slice(8,10)+'/'+s.slice(5,7);}
function nome(id){try{var p=_personById(id);return p?(p.name||p.nome||''):'';}catch(e){return '';}}
var WD=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
var ST={};function st(k){return ST[k]||(ST[k]={modo:'semana',ref:hj(),q:'',sala:''});}
function M(){return ((typeof meetings!=='undefined'&&meetings)||[]).filter(function(m){return m&&m.date&&m.status!=='cancelada'&&!m.deleted;});}
function isVis(m){return m.tipo==='visita'||/visita/i.test(m.title||'');}
function salas(){var s={};M().forEach(function(m){var x=m.sala||m.local;if(x&&!isVis(m))s[x]=1;});return Object.keys(s).sort();}
var CFG={
 agenda:{ic:'ti-calendar-time',t:'Agenda',sub:'Compromissos, reuniões e tarefas com lembrete.',modos:['semana','mes','lista'],f:function(m){return true;},buscaTopo:true},
 reunioes:{ic:'ti-speakerphone',t:'Reuniões',sub:'Reuniões marcadas para você.',modos:['semana','mes'],f:function(m){return !isVis(m)&&m.tipo!=='compromisso';}},
 agendamentos:{ic:'ti-message-circle-search',t:'Agendamento de Reuniões',sub:'Confira as reuniões agendadas para a sala selecionada',modos:['semana','mes'],f:function(m){var s=st('agendamentos').sala;return !isVis(m)&&m.tipo!=='compromisso'&&(!s||(m.sala||m.local)===s);},pessoa:true},
 visitas:{ic:'ti-map-2',t:'Visitas',sub:'Todas as visitas à empresa — as suas e as dos demais.',modos:['semana','mes','lista'],f:isVis}
};
function cls(m){return isVis(m)?'ag-ev-visita':(m.tipo==='compromisso'?'ag-ev-compromisso':'ag-ev-reuniao');}
function serie(m){return (m.recorrente||m.recorrencia||m.serieId)?'<i class="ti ti-repeat ag-serie-ico"></i> ':'';}
function sub2(k,m){if(CFG[k].pessoa){var n=nome(m.organizador||m.criador||m.owner||(m.participantes||[])[0]);return n?'<span class="ag-event-sala"><i class="ti ti-user"></i> '+esc(n)+'</span>':'';}var s=m.sala||m.local;return s?'<span class="ag-event-sala"><i class="ti ti-map-pin"></i> '+esc(s)+'</span>':'';}
function abrir(id){return "event.stopPropagation();hubAgAbrir('"+String(id).replace(/'/g,"\\'")+"')";}
function horario(m){return esc(m.horaInicio||'')+(m.horaFim?' – '+esc(m.horaFim):'');}
function topoDir(k){var s=st(k);
  if(k==='agenda')return '<div class="tk-search"><i class="ti ti-search tk-search-ico"></i><input class="tk-search-input" placeholder="Buscar nesta página." value="'+esc(s.q)+'" oninput="hubAgBusca(\'agenda\',this.value)"></div><button class="tk-filtro-btn" title="Filtrar" onclick="hubAgModo(\'agenda\',\'lista\')"><i class="ti ti-filter"></i></button>';
  if(k==='agendamentos'){var S=salas();return '<div class="ag10-sala"><label>Sala</label><select class="ag10-sel" onchange="hubAgSala(this.value)"><option value="">Todas as salas</option>'+S.map(function(x){return '<option'+(x===s.sala?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select></div>';}
  if(k==='visitas')return '<button class="ag10-ghost" disabled title="Locais"><i class="ti ti-map-pin"></i> Locais</button><button class="ag10-pri" onclick="try{novaReuniaoNaData(\''+hj()+'\',\'09:00\')}catch(e){}"><i class="ti ti-plus"></i> Nova Visita</button>';
  return '';}
function barra(k,label){var s=st(k),c=CFG[k];var L={semana:'Semana',mes:'Mês',lista:'Lista'};
  return '<div class="ag-barra"><div class="ag-range-bar"><span class="ag-range-label">'+label+'</span></div>'+
   (c.buscaTopo?'':'<div class="tk-search"><i class="ti ti-search tk-search-ico"></i><input class="tk-search-input" placeholder="Buscar nesta página." value="'+esc(s.q)+'" oninput="hubAgBusca(\''+k+'\',this.value)"></div>')+
   '<div class="ag-switch">'+c.modos.map(function(x){return '<button class="ag-switch-btn'+(s.modo===x?' is-active':'')+'" onclick="hubAgModo(\''+k+'\',\''+x+'\')">'+L[x]+'</button>';}).join('')+'</div>'+
   '<div class="ag-nav"><button class="ag-nav-btn" onclick="hubAgNav(\''+k+'\',-1)" title="Anterior"><i class="ti ti-chevron-left"></i></button><button class="ag-nav-hoje" onclick="hubAgNav(\''+k+'\',0)">Hoje</button><button class="ag-nav-btn" onclick="hubAgNav(\''+k+'\',1)" title="Próximo"><i class="ti ti-chevron-right"></i></button></div></div>';}
function semana(k,E){var ini=seg(st(k).ref),fim=addD(ini,6);var W=E.filter(function(m){return m.date>=ini&&m.date<=fim;});
  var h0=8,h1=18;W.forEach(function(m){var a=Math.floor(mm(m.horaInicio||'08:00')/60),b=Math.ceil((mm(m.horaFim||'')||mm(m.horaInicio||'08:00')+60)/60);h0=Math.min(h0,a);h1=Math.max(h1,b);});
  h0=Math.max(0,h0);h1=Math.min(24,h1);var tot=(h1-h0)*60;
  var g='<div class="ag-grid" style="--ag-total-min:'+tot+'"><div class="ag-hours"><div class="ag-corner"></div>';
  for(var h=h0;h<h1;h++)g+='<div class="ag-hour" style="--ag-h:'+((h-h0)*60)+'">'+String(h).padStart(2,'0')+'h</div>';g+='</div>';
  for(var i=0;i<7;i++){var d=addD(ini,i),hoje=d===hj();
    g+='<div class="ag-day'+(hoje?' is-today':'')+'"><div class="ag-day-head"><span class="ag-day-label">'+WD[dt(d).getDay()]+'</span><span class="ag-day-num">'+dm(d)+'</span></div><div class="ag-day-body" data-d="'+d+'" data-h0="'+h0+'" onclick="hubAgSlot(event,this)">';
    for(var s=0;s<h1-h0;s++)g+='<div class="ag-slot" style="--ag-h:'+(s*60)+'"></div>';
    var D=W.filter(function(m){return m.date===d;}).sort(function(a,b){return mm(a.horaInicio)-mm(b.horaInicio);});
    var col=[];D.forEach(function(m){var a=mm(m.horaInicio||'08:00'),b=Math.max(a+30,mm(m.horaFim||'')||a+60);m._a=a;m._b=b;var c=0;while(col[c]&&col[c]>a)c++;col[c]=b;m._c=c;});
    D.forEach(function(m){var n=1;D.forEach(function(o){if(o._a<m._b&&o._b>m._a)n=Math.max(n,o._c+1);});
      g+='<div class="ag-event '+cls(m)+'" style="--ag-top:'+(m._a-h0*60)+';--ag-dur:'+(m._b-m._a)+';--ag-col:'+m._c+';--ag-cols:'+n+'" data-q="'+esc((m.title||'').toLowerCase())+'" onclick="'+abrir(m.id)+'"><span class="ag-event-title">'+serie(m)+esc(m.title||m.titulo||'(sem título)')+'</span><span class="ag-event-time">'+horario(m)+'</span>'+sub2(k,m)+'</div>';});
    g+='</div></div>';}
  return {html:g+'</div>',label:dm(ini)+' – '+dm(fim)};}
function mes(k,E){var r=dt(st(k).ref);r.setDate(1);var mN=r.getMonth(),ini=seg(iso(r));
  var g='<div class="ag-month">'+['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].map(function(x){return '<div class="ag-month-wd">'+x+'</div>';}).join('');
  for(var i=0;i<42;i++){var d=addD(ini,i);var D=E.filter(function(m){return m.date===d;}).sort(function(a,b){return mm(a.horaInicio)-mm(b.horaInicio);});
    g+='<div class="ag-cell'+(dt(d).getMonth()!==mN?' ag-cell-out':'')+(d===hj()?' is-today':'')+'" onclick="try{novaReuniaoNaData(\''+d+'\',\'09:00\')}catch(e){}"><span class="ag-cell-num">'+(+d.slice(8,10))+'</span><div class="ag-cell-events">'+
     D.slice(0,3).map(function(m){return '<div class="ag-pill '+cls(m)+'" data-q="'+esc((m.title||'').toLowerCase())+'" onclick="'+abrir(m.id)+'"><span class="ag-pill-time">'+esc(m.horaInicio||'')+'</span><span class="ag-pill-title">'+esc(m.title||'')+'</span></div>';}).join('')+
     (D.length>3?'<div class="ag-pill-more">+'+(D.length-3)+' mais</div>':'')+'</div></div>';}
  var t=r.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return {html:g+'</div>',label:t.charAt(0).toUpperCase()+t.slice(1)};}
function lista(k,E){var ini=seg(st(k).ref),fim=addD(ini,6);var W=E.filter(function(m){return m.date>=ini&&m.date<=fim;}).sort(function(a,b){return (a.date+a.horaInicio).localeCompare(b.date+b.horaInicio);});
  var g='<div class="ag-list ag-list-standalone">';var dias={};W.forEach(function(m){(dias[m.date]=dias[m.date]||[]).push(m);});
  Object.keys(dias).forEach(function(d){g+='<div class="ag-list-day"><div class="ag-list-head'+(d===hj()?' is-today':'')+'">'+dt(d).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})+'</div>'+
    dias[d].map(function(m){var s=m.sala||m.local;return '<div class="ag-list-item '+cls(m)+'" data-reuniao="1" data-q="'+esc((m.title||'').toLowerCase())+'" onclick="'+abrir(m.id)+'"><span class="ag-list-time">'+horario(m)+'</span><div class="ag-list-main"><span class="ag-list-title">'+serie(m)+esc(m.title||'')+'</span>'+(s?'<span class="ag-list-sala"><i class="ti ti-map-pin"></i> '+esc(s)+'</span>':'')+'</div></div>';}).join('')+'</div>';});
  if(!W.length)g+='<div class="ag10-vazio"><i class="ti ti-calendar-off"></i><div>Nada marcado neste período.</div></div>';
  return {html:g+'</div>',label:dm(ini)+' – '+dm(fim)};}
function desenhar(k){var tc=document.getElementById('task-container');if(!tc)return;var c=CFG[k],s=st(k);var E=M().filter(c.f);
  var r=s.modo==='mes'?mes(k,E):s.modo==='lista'?lista(k,E):semana(k,E);
  tc.innerHTML='<div class="hub-oficial task-page ag-page ag10" data-ag="'+k+'"><div class="hoje-head"><div><h2 class="hoje-title"><i class="ti '+c.ic+'"></i>'+c.t+'</h2><p class="hoje-sub">'+c.sub+'</p></div><div class="hoje-toolbar">'+topoDir(k)+'</div></div>'+barra(k,r.label)+r.html+'</div>';
  document.body.classList.add('hub-tela');aplicaBusca(k);
  document.querySelectorAll('#sidebar .sbnav-item').forEach(function(b){var on=b.dataset.hub===k||(k==='agenda'&&/sidebarNavigate\('agenda'\)/.test(b.getAttribute('onclick')||''))||(k==='reunioes'&&/sidebarNavigate\('reunioes'\)/.test(b.getAttribute('onclick')||''));b.classList.toggle('active',on);});}
function aplicaBusca(k){var q=(st(k).q||'').toLowerCase().trim();document.querySelectorAll('.ag10 [data-q]').forEach(function(e){e.classList.toggle('ag-nomatch',!!q&&e.getAttribute('data-q').indexOf(q)<0);});}
window.hubAgDesenhar=desenhar;
window.hubAgBusca=function(k,v){st(k).q=v;aplicaBusca(k);};
window.hubAgModo=function(k,m){st(k).modo=m;desenhar(k);};
window.hubAgSala=function(v){st('agendamentos').sala=v;desenhar('agendamentos');};
window.hubAgNav=function(k,n){var s=st(k);if(!n){s.ref=hj();}else if(s.modo==='mes'){var d=dt(s.ref);d.setDate(1);d.setMonth(d.getMonth()+n);s.ref=iso(d);}else s.ref=addD(s.ref,7*n);desenhar(k);};
window.hubAgSlot=function(ev,el){if(ev.target!==el&&!ev.target.classList.contains('ag-slot'))return;var r=el.getBoundingClientRect();var tot=el.scrollHeight||r.height;var h0=+el.dataset.h0;var ms=Math.floor(((ev.clientY-r.top)/r.height)*(el.querySelectorAll('.ag-slot').length*60)/30)*30+h0*60;var h=String(Math.floor(ms/60)).padStart(2,'0')+':'+String(ms%60).padStart(2,'0');try{novaReuniaoNaData(el.dataset.d,h);}catch(e){}};
window.hubAgAbrir=function(id){var m=M().find(function(x){return String(x.id)===String(id);});if(!m)return;try{setTab('reunioes',null);}catch(e){}try{openReuniaoView(m.id);}catch(e){}};
function hook(){
  if(typeof window.render==='function'&&!window.render._r10){var r=window.render;window.render=function(){var x=r.apply(this,arguments);try{if(typeof currentTab!=='undefined'&&(typeof sidebarPersonId==='undefined'||!sidebarPersonId)&&(typeof hubView==='undefined'||hubView==='taskflow')){if(currentTab==='agenda')desenhar('agenda');else if(currentTab==='reunioes'&&!window._activeReuniaoId)desenhar('reunioes');}}catch(e){console.error(e);}return x;};window.render._r10=1;}
  if(typeof window.hubScreen==='function'&&!window.hubScreen._r10){var o=window.hubScreen;window.hubScreen=function(id){if(id==='agendamentos'||id==='visitas'){try{o.apply(this,arguments);}catch(e){}desenhar(id);return;}return o.apply(this,arguments);};window.hubScreen._r10=1;}
}
hook();window.addEventListener('load',function(){hook();setTimeout(hook,500);setTimeout(hook,2000);});
})();
