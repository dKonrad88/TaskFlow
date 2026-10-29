/* hub-fase5.js — telas extras no visual do Hub (Em cópia, Agendamentos, Visitas, Escala),
   Quadro/Linha do tempo do projeto, modo janelas e "Instalar app". Só apresentação sobre os dados do TaskFlow. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dt(s){var p=String(s||'').slice(0,10).split('-');return new Date(+p[0],(+p[1]||1)-1,+p[2]||1);}
function addD(s,n){var d=dt(s);d.setDate(d.getDate()+n);return iso(d);}
function seg(s){var d=dt(s),w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d);}
function nome(id){try{var p=_personById(id);return p?(p.name||p.nome):'';}catch(e){return '';}}
var DIAS=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
var hj=function(){return iso(new Date());};
var ATUAL=null,SEM={agendamentos:null,visitas:null,escala:null},MODO={agendamentos:'semana',visitas:'semana'},DIA={};
function cont(){return document.getElementById('task-container');}
function marcar(id){document.querySelectorAll('#sidebar .sbnav-item').forEach(function(b){b.classList.toggle('active',b.dataset.hub===id);});}
function topo(ic,t,sub,acts){return '<div class="hoje-head"><div><h2 class="hoje-title"><i class="ti '+ic+'"></i>'+t+'</h2><p class="hoje-sub">'+sub+'</p></div><div class="hoje-toolbar">'+(acts||'')+'</div></div>';}
function nav(k,ini,txt){var f=addD(ini,6);var md=MODO[k];return '<div class="h5-nav"><span class="h5-range">'+(txt||(dt(ini).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' – '+dt(f).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})))+'</span><span class="h5-sp"></span>'+(md?'<div class="tk-viewswitch">'+[['dia','Dia'],['semana','Semana'],['mes','Mês']].map(function(v){return '<button class="tk-view'+(md===v[0]?' active':'')+'" onclick="hubCalModo(\''+k+'\',\''+v[0]+'\')">'+v[1]+'</button>';}).join('')+'</div>':'<div class="tk-viewswitch"><button class="tk-view active">Semana</button></div>')+'<button class="h5-btn" onclick="hubSemana(\''+k+'\',-7)"><i class="ti ti-chevron-left"></i></button><button class="h5-btn" onclick="hubSemana(\''+k+'\',0)">Hoje</button><button class="h5-btn" onclick="hubSemana(\''+k+'\',7)"><i class="ti ti-chevron-right"></i></button></div>';}
function mm(h){var p=String(h||'').split(':');return (+p[0]||0)*60+(+p[1]||0);}
function novoBtn(d,h){return 'try{novaReuniaoNaData(\''+d+'\',\''+h+'\')}catch(e){}';}
function mes(k,M,ic,t,sub){var ref=DIA[k]||hj();var d0=dt(ref);d0.setDate(1);var ini=seg(iso(d0));var mesN=d0.getMonth();
  var cab='<div class="h5-mes-h">'+['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].map(function(x){return '<div>'+x+'</div>';}).join('')+'</div><div class="h5-mes">';
  for(var i=0;i<42;i++){var d=addD(ini,i);var E=M.filter(function(m){return m.date===d;}).sort(function(a,b){return String(a.horaInicio).localeCompare(String(b.horaInicio));});
    cab+='<div class="h5-mes-c'+(dt(d).getMonth()!==mesN?' fora':'')+(d===hj()?' hoje':'')+'" onclick="if(event.target===this||event.target.classList.contains(\'h5-mes-n\')){'+novoBtn(d,'09:00')+'}"><span class="h5-mes-n">'+(+d.slice(8,10))+'</span>'+E.slice(0,3).map(function(m){return '<div class="h5-mes-ev'+(m.tipo==='visita'?' vis':'')+'" onclick="try{setTab(\'reunioes\',null)}catch(e){}">'+esc(m.horaInicio||'')+' '+esc(m.title||'')+'</div>';}).join('')+(E.length>3?'<div class="h5-mes-mais">+'+(E.length-3)+'</div>':'')+'</div>';}
  var txt=d0.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  return '<div class="hub-oficial task-page h5">'+topo(ic,t,sub,'<button class="h5-btn h5-pri" onclick="'+novoBtn(hj(),'09:00')+'"><i class="ti ti-plus"></i> Novo</button>')+'<div class="h5-card">'+nav(k,ini,txt)+cab+'</div></div></div>';}
function calendario(k,filtro,ic,t,sub){var M=((typeof meetings!=='undefined'&&meetings)||[]).filter(filtro);if(MODO[k]==='mes')return mes(k,M,ic,t,sub);
  var nd=MODO[k]==='dia'?1:7;var ini=nd===1?(DIA[k]||hj()):(SEM[k]||seg(hj()));if(nd===1)DIA[k]=ini;else SEM[k]=ini;var H0=7,H1=20,PX=48;
  var cab='<div class="h5-cal-h"><div class="h5-gut"></div>';var cols='';
  for(var i=0;i<nd;i++){var d=addD(ini,i),hoje=d===hj();cab+='<div class="h5-dh'+(hoje?' hoje':'')+'"><span>'+DIAS[dt(d).getDay()]+'</span><b>'+d.slice(8,10)+'/'+d.slice(5,7)+'</b></div>';
    var ev=M.filter(function(m){return m.date===d;}).map(function(m){var a=Math.max(mm(m.horaInicio||'08:00'),H0*60),b=Math.max(a+30,mm(m.horaFim||'')||a+60);
      return '<div class="h5-ev'+(m.tipo==='visita'?' vis':'')+'" style="top:'+((a-H0*60)/60*PX)+'px;height:'+Math.max(22,(b-a)/60*PX-2)+'px" onclick="try{setTab(\'reunioes\',null)}catch(e){}"><b>'+esc(m.title||m.titulo||'')+'</b><span>'+esc(m.horaInicio||'')+(m.horaFim?' – '+esc(m.horaFim):'')+'</span>'+(m.local||m.sala?'<span><i class="ti ti-map-pin"></i> '+esc(m.local||m.sala)+'</span>':'')+'</div>';}).join('');
    cols+='<div class="h5-col'+(hoje?' hoje':'')+'" data-d="'+d+'" onclick="hubSlot(event,this)" title="Clique num horário livre para criar">'+ev+'</div>';}
  var gut='<div class="h5-gut">';for(var h=H0;h<H1;h++)gut+='<div class="h5-hr" style="height:'+PX+'px">'+h+'h</div>';gut+='</div>';
  var vazio=M.some(function(m){return m.date>=ini&&m.date<=addD(ini,nd-1);})?'':'<div class="h5-vazio-faixa"><i class="ti ti-calendar-off"></i> Nada nesta semana.</div>';
  return '<div class="hub-oficial task-page h5">'+topo(ic,t,sub,'<button class="h5-btn h5-pri" onclick="try{novaReuniaoNaData(\''+hj()+'\',\'09:00\')}catch(e){try{setTab(\'reunioes\',null)}catch(_){}}"><i class="ti ti-plus"></i> Novo</button>')+'<div class="h5-card">'+nav(k,ini,nd===1?dt(ini).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}):null)+vazio+cab+'</div><div class="h5-cal-b" style="height:'+((H1-H0)*PX)+'px">'+gut+cols+'</div></div></div>';}
function escala(){var ini=SEM.escala||seg(hj());SEM.escala=ini;var P=((typeof people!=='undefined'&&people)||[]).filter(function(p){return !p.inativo&&!p.deleted;});
  var h='<div class="hub-oficial task-page h5">'+topo('ti-calendar-user','Escala','Quem trabalha em cada dia da semana.')+'<div class="h5-card">'+nav('escala',ini)+'<table class="tk-table h5-esc"><thead><tr><th>Pessoa</th>';
  for(var i=0;i<7;i++){var d=addD(ini,i);h+='<th class="'+(d===hj()?'hoje':'')+'">'+DIAS[dt(d).getDay()]+' '+d.slice(8,10)+'/'+d.slice(5,7)+'</th>';}
  h+='</tr></thead><tbody>';
  if(!P.length)h+='<tr><td colspan="8" class="tk-notif-vazio">Nenhuma pessoa cadastrada.</td></tr>';
  P.forEach(function(p){h+='<tr><td><b>'+esc(p.name||p.nome)+'</b><div class="tt-muted">'+esc(p.setor||'')+'</div></td>';for(var i=0;i<7;i++){var w=dt(addD(ini,i)).getDay();var fds=w===0||w===6;h+='<td><span class="tk-chip '+(fds?'st-todo':'st-doing')+' hub-st">'+(fds?'Folga':'Turno')+'</span></td>';}h+='</tr>';});
  return h+'</tbody></table><div class="h5-nota"><i class="ti ti-info-circle"></i> O TaskFlow não guarda escalas; a grade mostra a semana padrão (seg–sex) da equipe.</div></div></div>';}
function tela(id){var tc=cont();if(!tc)return;ATUAL=id;try{if(window.hubPerfilFechar)hubPerfilFechar();}catch(e){}document.body.classList.add('hub-tela');document.body.classList.remove('hub-pjv');
  if(id==='emcopia'){if(window.hubTela)hubTela('emcopia');}
  else if(id==='agendamentos')tc.innerHTML=calendario('agendamentos',function(m){return m.tipo!=='visita'&&m.status!=='cancelada';},'ti-calendar-event','Agendamentos','Reuniões e compromissos marcados, por semana.');
  else if(id==='visitas')tc.innerHTML=calendario('visitas',function(m){return m.tipo==='visita'||/visita/i.test(m.title||'');},'ti-map-pin','Visitas','Visitas agendadas, por semana.');
  else if(id==='escala')tc.innerHTML=escala();
  marcar(id);window.scrollTo(0,0);}
window.hubScreen=tela;
window.hubSemana=function(k,n){var md=MODO[k];if(md==='dia'){DIA[k]=n?addD(DIA[k]||hj(),n/7):hj();}else if(md==='mes'){var d=dt(DIA[k]||hj());d.setDate(1);d.setMonth(d.getMonth()+(n>0?1:n<0?-1:0));DIA[k]=n?iso(d):hj();}else SEM[k]=n?addD(SEM[k]||seg(hj()),n):seg(hj());tela(k);};
window.hubCalModo=function(k,m){MODO[k]=m;if(m==='dia')DIA[k]=hj();tela(k);};
window.hubSlot=function(e,col){if(e.target!==col)return;var r=col.getBoundingClientRect();var min=7*60+Math.floor((e.clientY-r.top)/48*2)*30;var h=String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');try{novaReuniaoNaData(col.dataset.d,h);}catch(err){}};
// Qualquer navegação normal do TaskFlow sai da tela extra.
function hook(){if(typeof window.render==='function'&&!window.render._h5){var r=window.render;window.render=function(){ATUAL=null;marcar('');var x=r.apply(this,arguments);if(PJ&&typeof activeProjectProId!=='undefined'&&activeProjectProId)setTimeout(function(){if(PJ)hubPjTab(PJ);},0);return x;};window.render._h5=1;}}

/* ---------- Projeto: Quadro (kanban por status) e Linha do tempo (Gantt) ---------- */
var PJ=null,ZOOM='dia';window.hubPjZoom=function(z){ZOOM=z;hubPjTab('linha');};
function pjTasks(p){var L=(typeof tasks!=='undefined'&&tasks)||[];return L.filter(function(t){return !t.deleted&&(t.projectProId===p.id||t.projectId===p.id||t.projetoId===p.id);});}
function stK(t){if(t.done)return 'done';var k=t.kanbanCol||t.status||'';if(k==='doing'||k==='andamento')return 'doing';if(k==='waiting'||k==='aguardando')return 'waiting';return 'todo';}
function quadro(p){var C=[['todo','A Fazer','st-todo'],['doing','Em andamento','st-doing'],['waiting','Aguardando','st-waiting'],['done','Concluído','st-done']];var T=pjTasks(p);
  return '<div class="h5-kb">'+C.map(function(c){var L=T.filter(function(t){return stK(t)===c[0];});return '<div class="h5-kb-col"><div class="h5-kb-h"><span class="tk-chip '+c[2]+' hub-st">'+c[1]+'</span><span class="hoje-section-count">'+L.length+'</span></div>'+
    (L.length?L.map(function(t){return '<div class="h5-kb-card" onclick="openEdit('+JSON.stringify(t.id).replace(/"/g,'&quot;')+')"><div class="h5-kb-t">'+esc(t.title)+'</div><div class="h5-kb-m">'+(t.executor?'<span><i class="ti ti-user"></i> '+esc(nome(t.executor))+'</span>':'')+(t.date?'<span><i class="ti ti-flag-3"></i> '+dt(t.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+'</span>':'')+'</div></div>';}).join(''):'<div class="h5-kb-vazio">Sem tarefas</div>')+'</div>';}).join('')+'</div>';}
function linha(p){var NUM={},ORD={};try{var M=hubMigrarProjetoOficial(p);M.etapas.forEach(function(e,i){e.tarefas.forEach(function(x,j){NUM[x.t.id]=x.num;ORD[x.t.id]=i*1e4+j;});});}catch(e){}
  var T=pjTasks(p).filter(function(t){return t.date||t.inicio||t.startDate;}).map(function(t){var a=t.inicio||t.startDate||t.date,b=t.date||a;if(b<a){var x=a;a=b;b=x;}return {t:t,a:a,b:b};});
  var F=(p.fases||[]).map(function(f){return {f:f,a:f.inicio||f.dataInicio||f.start,b:f.fim||f.dataFim||f.end||f.prazo};}).filter(function(x){return x.a&&x.b;});
  if(!T.length&&!F.length)return '<div class="h5-card"><div class="tk-notif-vazio"><i class="ti ti-timeline"></i><span>Nenhuma tarefa ou fase com datas — o gráfico fica vazio até que existam datas de início/vencimento.</span></div></div>';
  var all=T.concat(F),min=all.reduce(function(m,x){return x.a<m?x.a:m;},all[0].a),max=all.reduce(function(m,x){return x.b>m?x.b:m;},all[0].b);min=seg(min);max=addD(seg(max),6);
  if(ZOOM==='mes'){var a0=dt(min);a0.setDate(1);min=iso(a0);var b0=dt(max);b0.setMonth(b0.getMonth()+1,0);max=iso(b0);}
  var n=Math.round((dt(max)-dt(min))/864e5)+1,W=ZOOM==='dia'?28:ZOOM==='semana'?12:5;var cab='';
  if(ZOOM==='dia'){for(var i=0;i<n;i++){var d=addD(min,i);cab+='<div class="h5-g-d'+(d===hj()?' hoje':'')+((dt(d).getDay()%6===0)?' fds':'')+'" style="width:'+W+'px">'+d.slice(8,10)+'</div>';}}
  else if(ZOOM==='semana'){for(var i=0;i<n;i+=7){var d=addD(min,i);cab+='<div class="h5-g-d" style="width:'+(Math.min(7,n-i)*W)+'px">'+d.slice(8,10)+'/'+d.slice(5,7)+'</div>';}}
  else{var i=0;while(i<n){var d=dt(addD(min,i)),fim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()-d.getDate()+1;var q=Math.min(fim,n-i);cab+='<div class="h5-g-d" style="width:'+(q*W)+'px">'+d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})+'</div>';i+=q;}}
  function bar(lbl,a,b,cls,click){var o=Math.round((dt(a)-dt(min))/864e5),l=Math.round((dt(b)-dt(a))/864e5)+1;return '<div class="h5-g-r"><div class="h5-g-l" title="'+esc(lbl)+'">'+esc(lbl)+'</div><div class="h5-g-tr" style="width:'+(n*W)+'px"><div class="h5-g-b '+cls+'" style="left:'+(o*W)+'px;width:'+(l*W-4)+'px"'+(click?' onclick="'+click+'"':'')+'></div></div></div>';}
  var hojeO=Math.round((dt(hj())-dt(min))/864e5);
  var PT=pjTasks(p),dn=PT.filter(function(t){return t.done;}).length,pc=PT.length?Math.round(dn/PT.length*100):0;var prazo=p.prazo||p.dataFim||p.fim||'';
  var hdr='<div class="h5-g-top"><div class="h5-g-prog"><div class="h5-g-pbar"><i style="width:'+pc+'%"></i></div><b>'+pc+'%</b><span>'+dn+' de '+PT.length+' tarefas concluídas</span>'+(prazo?'<span><i class="ti ti-flag-3"></i> Prazo '+dt(prazo).toLocaleDateString('pt-BR')+'</span>':'')+'</div><div class="tk-viewswitch">'+[['dia','Dia'],['semana','Semana'],['mes','Mês']].map(function(z){return '<button class="tk-view'+(ZOOM===z[0]?' active':'')+'" onclick="hubPjZoom(\''+z[0]+'\')">'+z[1]+'</button>';}).join('')+'</div></div>';
  return '<div class="h5-card h5-g">'+hdr+'<div class="h5-g-leg"><span><i class="h5-lg fase"></i>Fase</span><span><i class="h5-lg todo"></i>A fazer</span><span><i class="h5-lg doing"></i>Em andamento</span><span><i class="h5-lg waiting"></i>Aguardando</span><span><i class="h5-lg done"></i>Concluído</span></div><div class="h5-g-sc"><div class="h5-g-r h5-g-hd"><div class="h5-g-l">'+dt(min).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})+'</div><div class="h5-g-tr" style="width:'+(n*W)+'px">'+cab+'</div></div>'+
    F.map(function(x){return bar(x.f.nome||x.f.name||'Fase',x.a,x.b,'fase');}).join('')+T.sort(function(a,b){return (ORD[a.t.id]==null?1e9:ORD[a.t.id])-(ORD[b.t.id]==null?1e9:ORD[b.t.id]);}).map(function(x){return bar((NUM[x.t.id]?NUM[x.t.id]+' ':'')+x.t.title,x.a,x.b,stK(x.t),'openEdit('+JSON.stringify(x.t.id).replace(/"/g,'&quot;')+')');}).join('')+
    (hojeO>=0&&hojeO<n?'<div class="h5-g-hoje" style="left:calc(220px + '+(hojeO*W+W/2)+'px)"></div>':'')+'</div></div>';}
window.hubPjTab=function(k){PJ=k;var tc=cont();if(!tc)return;var p=(projectsPro||[]).find(function(x){return x.id===activeProjectProId;});if(!p)return;var top=tc.querySelector('.hub-pjv-top');if(!top)return;
  [].slice.call(tc.children).forEach(function(c){if(c!==top&&!c.classList.contains('h5-pj'))c.style.display='none';});
  var box=tc.querySelector('.h5-pj');if(!box){box=document.createElement('div');box.className='h5-pj hub-oficial task-page';tc.appendChild(box);}
  box.innerHTML=k==='decisoes'?'<div class="h5-card"><div class="tk-notif-vazio"><i class="ti ti-gavel"></i><span>Nenhuma decisão registrada neste projeto.</span><button class="h5-btn" onclick="try{setProjectProTab(\'anotacoes\')}catch(e){}"><i class="ti ti-messages"></i> Registrar no chat do projeto</button></div></div>':k==='quadro'?(window.hubProjetoOficialHTML?hubProjetoOficialHTML(p):quadro(p)):linha(p);
  top.querySelectorAll('.tk-tab').forEach(function(b){b.classList.toggle('active',b.dataset.h5===k);});};
function pjHook(){if(typeof window.setProjectProTab==='function'&&!window.setProjectProTab._h5){var o=window.setProjectProTab;window.setProjectProTab=function(){PJ=null;return o.apply(this,arguments);};window.setProjectProTab._h5=1;}
  if(typeof window.abrirProjectProView==='function'&&!window.abrirProjectProView._h5){var a=window.abrirProjectProView;window.abrirProjectProView=function(){PJ='quadro';var x=a.apply(this,arguments);setTimeout(function(){if(PJ)hubPjTab(PJ);},30);return x;};window.abrirProjectProView._h5=1;}}

/* ---------- Modo janelas: o conteúdo vira uma janela flutuante (arrastável/redimensionável) ---------- */
window.hubJanelas=function(){var on=document.body.classList.toggle('hub-janelas');var m=document.querySelector('.main');if(!m)return;
  var bar=document.getElementById('hub-jan-bar');
  if(on){if(!bar){bar=document.createElement('div');bar.id='hub-jan-bar';bar.className='hub-jan-bar';bar.innerHTML='<span><i class="ti ti-app-window"></i> <b id="hub-jan-t">TaskFlow</b></span><button onclick="hubJanelas()" title="Sair do modo janelas"><i class="ti ti-x"></i></button>';m.insertBefore(bar,m.firstChild);
      var sx,sy,ox,oy;bar.onmousedown=function(e){if(e.target.closest('button'))return;sx=e.clientX;sy=e.clientY;ox=m.offsetLeft;oy=m.offsetTop;function mv(ev){m.style.left=(ox+ev.clientX-sx)+'px';m.style.top=(oy+ev.clientY-sy)+'px';}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);};}
    var t=document.querySelector('.hoje-title,.page-title,h2');document.getElementById('hub-jan-t').textContent=t?t.textContent.trim():'TaskFlow';}
  else{if(bar)bar.remove();m.style.left=m.style.top='';}
  var b=document.getElementById('hub-jan-btn');if(b)b.classList.toggle('on',on);};

/* ---------- Instalar app (PWA) ---------- */
var _pwa=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();_pwa=e;});
window.hubInstalarApp=function(){if(_pwa){_pwa.prompt();_pwa=null;return;}
  var msg='Para instalar: no Chrome/Edge use o ícone de instalar na barra de endereço (ou Menu ⋮ → "Instalar app" / "Criar atalho"). No celular: Compartilhar → "Adicionar à tela inicial".';
  if(typeof toast==='function')toast(msg);else alert(msg);};
function init(){hook();pjHook();}
init();window.addEventListener('load',function(){init();setTimeout(init,600);});
})();
