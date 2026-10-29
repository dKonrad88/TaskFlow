/* Hub Klain — telas no visual oficial. Só apresentação: usa os dados/funções do TaskFlow
   (tasks, meetings, toggle, openEdit, setTab…) sem alterar lógica nem chaves de localStorage. */
(function(){
'use strict';
var FILTRO={'minhas-tarefas':'hoje','solicitadas':'todas'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function hojeISO(){var d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
function addD(iso,n){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function nome(id){try{var p=(typeof _personById==='function')?_personById(id):((typeof people!=='undefined'&&people)||[]).find(function(x){return x.id===id});return p?(p.name||p.nome||'—'):'—';}catch(e){return '—';}}
function fmtD(iso){if(!iso)return '—';var h=hojeISO();if(iso===h)return 'Hoje';if(iso===addD(h,1))return 'Amanhã';if(iso===addD(h,-1))return 'Ontem';var p=iso.split('-');return p[2]+'/'+p[1];}
function diasEntre(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}
function semana(iso){var d=new Date(iso+'T12:00:00');var w=(d.getDay()+6)%7;var seg=addD(iso,-w);return [seg,addD(seg,6)];}
var PRIO={urgente:'Urgente',alta:'Alta',media:'Média',baixa:'Baixa'};
function status(t){if(t.done)return['st-done','Concluído'];var k=t.kanbanCol||t.status||'';if(k==='doing'||k==='andamento')return['st-doing','Em andamento'];if(k==='waiting'||k==='aguardando')return['st-waiting','Aguardando'];return['st-todo','A Fazer'];}

function base(tab){var U=window.CURRENT_USER_ID||CURRENT_USER_ID;var L=(window.tasks||tasks||[]).filter(function(t){return !t.deleted&&!t.cancelled;});
  if(tab==='emcopia')return L.filter(function(t){var c=[].concat(t.seguidores||[],t.people||[],t.cc||[],t.copia||[]).map(function(x){return x&&x.id||x;});return c.indexOf(U)>=0&&t.executor!==U&&t.solicitante!==U;});
  if(tab==='solicitadas')return L.filter(function(t){return t.solicitante===U&&t.executor!==U;});
  return L.filter(function(t){return t.executor===U;});}
var CHIPS=[['todas','ti-layout-grid','Todas'],['meudia','ti-sun','Meu dia'],['atrasadas','ti-alert-triangle','Atrasadas'],['hoje','ti-sun-high','Hoje'],['amanha','ti-calendar-plus','Amanhã'],['semana','ti-calendar-week','Essa semana'],['prox','ti-calendar-share','Próxima semana'],['semprazo','ti-calendar-off','Sem Prazo'],['seminicio','ti-calendar-question','Sem Início'],['pessoais','ti-lock','Pessoais'],['notif','ti-bell','Notificações']];
function passa(f,t){var h=hojeISO(),d=t.date||'';var ab=!t.done;var sw=semana(h),ps=[addD(sw[0],7),addD(sw[1],7)];
  switch(f){case'todas':return true;case'meudia':return ab&&(t.meuDia||t.foco||(d&&d<=h));case'atrasadas':return ab&&d&&d<h;case'hoje':return d===h;case'amanha':return d===addD(h,1);
  case'semana':return d&&d>=sw[0]&&d<=sw[1];case'prox':return d&&d>=ps[0]&&d<=ps[1];case'semprazo':return ab&&!d;case'seminicio':return ab&&!t.inicio&&!t.startDate;case'pessoais':return !!(t.pessoal||t.privada||t.escopo==='pessoal');case'notif':return !!(t.notif||t._notif);}return true;}

function compromissos(){var h=hojeISO();var M=((typeof meetings!=='undefined'&&meetings)||[]).filter(function(m){return m.date===h&&m.status!=='encerrada';});
  M.sort(function(a,b){return String(a.horaInicio||'').localeCompare(String(b.horaInicio||''));});
  if(!M.length)return '';
  return '<div class="hj-agenda hub-hj"><div class="hj-agenda-titulo" onclick="this.parentNode.classList.toggle(\'is-collapsed\')"><i class="ti ti-chevron-down hj-agenda-chevron"></i><i class="ti ti-calendar-event"></i> Compromissos e reuniões de hoje</div><div class="hj-agenda-lista">'+
  M.map(function(m){var reun=(m.tipo||'reuniao')!=='compromisso';return '<div class="hj-card '+(reun?'ag-ev-reuniao':'')+'" onclick="try{setTab(\'reunioes\',null)}catch(e){}"><div class="hj-card-topo"><span class="hj-card-hora">'+esc(m.horaInicio||'')+(m.horaFim?' – '+esc(m.horaFim):'')+'</span></div><div class="hj-card-tit">'+(reun?'<i class="ti ti-repeat"></i> ':'')+esc(m.title||'')+'</div>'+(m.sala?'<div class="hj-card-meta"><i class="ti ti-map-pin"></i> '+esc(m.sala)+'</div>':'')+'</div>';}).join('')+'</div></div>';}

function linha(t){var h=hojeISO();var st=status(t);var p=t.prio||'media';var late=!t.done&&t.date&&t.date<h;
  var ve=t.date?(t.done?'—':(late?diasEntre(t.date,h)+' d atrás':(t.date===h?'Hoje':diasEntre(h,t.date)+' d'))):'—';
  var cri=t.createdAt?Math.max(0,diasEntre(String(t.createdAt).slice(0,10),h))+' d':'—';
  return '<tr class="tk-trow'+(t.done?' tk-done':'')+'" onclick="openEdit('+JSON.stringify(t.id).replace(/"/g,'&quot;')+')">'+
  '<td class="tt-check" onclick="event.stopPropagation();toggle('+JSON.stringify(t.id).replace(/"/g,'&quot;')+')"><button class="tk-check-btn '+(t.done?'tk-check-btn--done':'tk-check-btn--open')+'" title="Concluir"><i class="ti '+(t.done?'ti-checks':'ti-circle')+'"></i></button></td>'+
  '<td class="tt-fav"><i class="ti ti-pin tt-muted"></i></td>'+
  '<td class="tt-muted hub-tt-id">'+esc(String(t.id).slice(-5))+'</td>'+
  '<td class="tt-title">'+esc(t.title)+'</td>'+
  '<td class="tt-prio"><span class="tk-chip tk-prio prio-'+esc(p)+'"><i class="ti ti-flag"></i> '+(PRIO[p]||esc(p))+'</span></td>'+
  '<td class="tt-status"><span class="tk-chip '+st[0]+' hub-st">'+st[1]+'</span></td>'+
  '<td class="tt-solicitante">'+esc(nome(t.solicitante))+'</td><td class="tt-executor">'+esc(nome(t.executor))+'</td>'+
  '<td><span class="tk-date"><i class="ti ti-calendar"></i>'+fmtD(t.inicio||t.startDate||'')+'</span></td>'+
  '<td><span class="tk-date'+(late?' tk-date-late':'')+'"><i class="ti ti-flag-3"></i>'+fmtD(t.date)+'</span></td>'+
  '<td class="tt-muted">—</td><td>'+cri+'</td><td'+(late?' class="text-danger"':'')+'>'+ve+'</td></tr>';}
function tabela(L){return '<div class="tk-table-wrap"><table class="tk-table"><thead><tr><th class="tt-th-check"></th><th></th><th>ID</th><th class="tt-th-titulo">Tarefa</th><th class="tt-th-prio">Prioridade</th><th>Status</th><th class="tt-th-solicitante">Solicitante</th><th class="tt-th-executor">Executor</th><th class="tt-th-data">Início</th><th class="tt-th-data">Vencimento</th><th>Aviso</th><th>Criado há</th><th>Vence em</th></tr></thead><tbody>'+L.map(linha).join('')+'</tbody></table></div>';}
function secao(cls,ico,tit,L){if(!L.length)return '';return '<div class="hoje-section '+cls+'"><div class="hoje-section-header" onclick="this.parentNode.classList.toggle(\'is-collapsed\')"><i class="ti ti-chevron-down hoje-section-chevron"></i><i class="ti '+ico+'"></i><span class="hoje-section-title">'+tit+'</span><span class="hoje-section-count">'+L.length+'</span></div><div class="hoje-section-body">'+tabela(L)+'</div></div>';}

var CFGK='hub_tabela_cfg';function cfg(){try{return Object.assign({agrupar:'vencimento',ordenar:'vencimento',ocultas:[]},JSON.parse(localStorage.getItem(CFGK)||'{}'));}catch(e){return {agrupar:'vencimento',ordenar:'vencimento',ocultas:[]};}}
var PRN={urgente:0,alta:1,media:2,baixa:3};
function ordenar(L,o){var k={vencimento:function(t){return t.date||'9999';},prioridade:function(t){return PRN[t.prio||'media'];},titulo:function(t){return (t.title||'').toLowerCase();},status:function(t){return status(t)[1];},criacao:function(t){return String(t.createdAt||'');},inicio:function(t){return t.inicio||t.startDate||'9999';}}[o]||function(t){return t.date||'9999';};
  return L.slice().sort(function(a,b){var x=k(a),y=k(b);return x<y?-1:x>y?1:0;});}
function grupos(L,g,h){if(g==='nenhum')return [['sec-today','ti-list','Todas',L]];
  if(g==='vencimento'){var at=L.filter(function(t){return !t.done&&t.date&&t.date<h;});return [['sec-danger','ti-alert-triangle','Atrasadas',at],['sec-today','ti-calendar-check','Em dia',L.filter(function(t){return at.indexOf(t)<0&&!t.done;})],['sec-success','ti-checks','Concluídas',L.filter(function(t){return t.done;})]];}
  var f={prioridade:function(t){return PRIO[t.prio||'media']||t.prio;},status:function(t){return status(t)[1];},solicitante:function(t){return nome(t.solicitante);},executor:function(t){return nome(t.executor);},inicio:function(t){return fmtD(t.inicio||t.startDate||'')||'Sem início';},categoria:function(t){return t.categoria||t.category||t.setor||'Sem categoria';}}[g]||function(){return 'Todas';};
  var m={},o=[];L.forEach(function(t){var k=f(t)||'—';if(!m[k]){m[k]=[];o.push(k);}m[k].push(t);});return o.map(function(k){return ['sec-today','ti-folder',esc(k),m[k]];});}
var COLS=[[3,'ID'],[5,'Prioridade'],[6,'Status'],[7,'Solicitante'],[8,'Executor'],[9,'Início'],[10,'Vencimento'],[11,'Aviso'],[12,'Criado há'],[13,'Vence em']];
function colCss(c){return c.ocultas.map(function(n){return '.hub-oficial .tk-table tr>:nth-child('+n+'){display:none}';}).join('');}
window.hubCfgMenu=function(ev,tab){ev.stopPropagation();var old=document.getElementById('hub-cfg-menu');if(old){old.remove();return;}var c=cfg();
  var G=[['vencimento','Vencimento'],['prioridade','Prioridade'],['status','Status'],['solicitante','Solicitante'],['executor','Executor'],['inicio','Dia de início'],['categoria','Categoria'],['nenhum','Nenhum']];
  var O=[['vencimento','Vencimento'],['prioridade','Prioridade'],['titulo','Título (A-Z)'],['status','Status'],['inicio','Início'],['criacao','Criação']];
  function col(t,L,k){return '<div class="hub-cfg-col"><div class="hub-cfg-h">'+t+'</div>'+L.map(function(x){return '<button class="hub-cfg-i'+(c[k]===x[0]?' on':'')+'" onclick="hubCfgSet(\''+tab+'\',\''+k+'\',\''+x[0]+'\')"><i class="ti ti-check"></i>'+x[1]+'</button>';}).join('')+'</div>';}
  var cols='<div class="hub-cfg-col"><div class="hub-cfg-h">Colunas</div>'+COLS.map(function(x){return '<button class="hub-cfg-i'+(c.ocultas.indexOf(x[0])<0?' on':'')+'" onclick="hubCfgSet(\''+tab+'\',\'col\','+x[0]+')"><i class="ti ti-check"></i>'+x[1]+'</button>';}).join('')+'</div>';
  var m=document.createElement('div');m.id='hub-cfg-menu';m.className='hub-cfg-menu';m.innerHTML='<div class="hub-cfg-cols">'+col('Agrupar por',G,'agrupar')+col('Ordenar por',O,'ordenar')+cols+'</div><div class="hub-cfg-foot"><button class="hub-cfg-i" onclick="hubCfgSet(\''+tab+'\',\'reset\')"><i class="ti ti-restore"></i>Restaurar padrão</button></div>';
  m.onclick=function(e){e.stopPropagation();};document.body.appendChild(m);var b=ev.currentTarget.getBoundingClientRect();m.style.top=(b.bottom+6)+'px';m.style.right=Math.max(8,innerWidth-b.right)+'px';
  setTimeout(function(){document.addEventListener('click',function f(){m.remove();document.removeEventListener('click',f);});},0);};
window.hubCfgSet=function(tab,k,v){var c=cfg();if(k==='col'){var i=c.ocultas.indexOf(v);if(i<0)c.ocultas.push(v);else c.ocultas.splice(i,1);}else if(k==='reset')c={agrupar:'vencimento',ordenar:'vencimento',ocultas:[]};else c[k]=v;
  try{localStorage.setItem(CFGK,JSON.stringify(c));}catch(e){}var m=document.getElementById('hub-cfg-menu');if(m)m.remove();tela(tab);var b=document.querySelector('.hub-oficial .tk-filtro-btn');if(b)hubCfgMenu({stopPropagation:function(){},currentTarget:b},tab);};
window.hubTela=function(tab){tela(tab);};
function tela(tab){var tc=document.getElementById('task-container');if(!tc)return;document.body.classList.add('hub-tela');
  var B=base(tab),f=FILTRO[tab]||'todas';var h=hojeISO();
  var L=B.filter(function(t){return passa(f,t);});
  var bar='<div class="tk-filterbar">'+CHIPS.map(function(c){var n=B.filter(function(t){return passa(c[0],t);}).length;return '<button class="tk-filter'+(c[0]===f?' active':'')+'" onclick="hubTelaFiltro(\''+tab+'\',\''+c[0]+'\')"><i class="ti '+c[1]+'"></i> '+c[2]+' <span class="tk-filter-count"'+(n?'':' data-zero="1"')+'>'+n+'</span></button>';}).join('')+'</div>';
  var C=cfg();L=ordenar(L,C.ordenar);
  var titulo=tab==='emcopia'?['ti-copy','Em cópia','Tarefas de outras pessoas que você acompanha.']:tab==='solicitadas'?['ti-send','Solicitadas','Pedidos feitos por você a outras pessoas.']:['ti-list-check','Minhas Tarefas','Suas tarefas, por prazo.'];
  var head='<div class="hoje-head"><div><h2 class="hoje-title"><i class="ti '+titulo[0]+'"></i>'+titulo[1]+'</h2><p class="hoje-sub">'+titulo[2]+'</p></div><div class="hoje-toolbar"><div class="hub-busca-pag"><i class="ti ti-search"></i><input placeholder="Buscar nesta página." oninput="hubTelaBusca(this.value)"></div><div class="tk-viewswitch"><button class="tk-view active"><i class="ti ti-list"></i> Lista</button><button class="tk-view" onclick="try{setAllView(\'kanban\')}catch(e){}"><i class="ti ti-layout-grid"></i> Cartões</button></div><button class="tk-filtro-btn" title="Agrupar / ordenar / colunas" onclick="hubCfgMenu(event,\''+tab+'\')"><i class="ti ti-adjustments-horizontal"></i></button></div></div>';
  var corpo=grupos(L,C.agrupar,h).map(function(g){return secao(g[0],g[1],g[2],g[3]);}).join('');
  if(!corpo)corpo='<div class="hub-vazio"><i class="ti ti-mood-smile"></i> Nada por aqui.</div>';
  tc.innerHTML='<style>'+colCss(C)+'</style><div class="hub-oficial task-page">'+head+(tab==='minhas-tarefas'?compromissos():'')+bar+corpo+'</div>';}

/* Projetos: lista em cards como no Hub oficial (abre o projeto pela função original). */
function projetos(){var tc=document.getElementById('task-container');if(!tc)return false;var L=(typeof projectsPro!=='undefined'&&projectsPro)||[];if(!L.length)return false;
  document.body.classList.add('hub-tela');
  var ST=(typeof PP_STATUS!=='undefined')?PP_STATUS:{};
  var cards=L.filter(function(p){return p.status!=='arquivado';}).map(function(p){var g={pct:0,total:0,feitas:0};try{g=_calcularProgressoProjeto(p);}catch(e){}
    var st=(ST[p.status]||ST.planejamento||{label:p.status||''});var badge=p.status==='ativo'||p.status==='andamento'?'bg-primary':'bg-secondary';
    var id=JSON.stringify(p.id).replace(/"/g,'&quot;');
    return '<div class="hub-pj-card" onclick="abrirProjectProView('+id+')"><div class="hub-pj-head"><span class="hub-pj-ico"><i class="ti ti-file"></i></span><div class="hub-pj-nome">'+esc(p.nome||p.name||'')+'</div></div>'+
      '<span class="hub-pj-badge '+badge+'">'+esc(String(st.label||'').toUpperCase())+'</span>'+
      '<div class="hub-pj-bar"><div style="width:'+(g.pct||0)+'%"></div></div><div class="hub-pj-meta">'+(g.feitas||0)+'/'+(g.total||0)+' tarefas · '+(g.pct||0)+'%</div>'+
      (p.deadline?'<div class="hub-pj-meta"><i class="ti ti-calendar"></i> Prazo '+esc(fmtD(p.deadline))+'</div>':'')+'</div>';}).join('');
  tc.innerHTML='<div class="hub-oficial task-page"><div class="hoje-head"><div><h2 class="hoje-title"><i class="ti ti-folders"></i>Projetos</h2><p class="hoje-sub">Projetos ativos e em planejamento.</p></div><div class="hoje-toolbar"><button class="hub-btn-primary" onclick="try{fabAction(\'projeto\')}catch(e){}"><i class="ti ti-plus"></i> Novo projeto</button></div></div><div class="hub-pj-grid">'+cards+'</div></div>';return true;}
window.hubTelaFiltro=function(tab,f){FILTRO[tab]=f;tela(tab);};
window.hubTelaBusca=function(q){q=(q||'').toLowerCase();document.querySelectorAll('.hub-oficial .tk-trow').forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?'':'none';});};

function envolver(){
  if(typeof window.renderPersonView==='function'&&!window.renderPersonView._hub){var o=window.renderPersonView;
    window.renderPersonView=function(pid,opts){if(window.currentTab==='minhas-tarefas'||(typeof currentTab!=='undefined'&&currentTab==='minhas-tarefas'&&opts&&opts.executorOnly)){return tela('minhas-tarefas');}document.body.classList.remove('hub-tela');return o.apply(this,arguments);};window.renderPersonView._hub=1;}
  if(typeof window.renderSolicitadas==='function'&&!window.renderSolicitadas._hub){window.renderSolicitadas=function(){return tela('solicitadas');};window.renderSolicitadas._hub=1;}
  if(typeof window.renderProjetosPro==='function'&&!window.renderProjetosPro._hub){var op=window.renderProjetosPro;window.renderProjetosPro=function(){if(typeof activeProjectProId!=='undefined'&&!activeProjectProId&&projetos())return;return op.apply(this,arguments);};window.renderProjetosPro._hub=1;}
  if(typeof window.render==='function'&&!window.render._hub){var r=window.render;window.render=function(){document.body.classList.remove('hub-tela');var x=r.apply(this,arguments);try{if(typeof currentTab!=='undefined'&&(currentTab==='minhas-tarefas'||currentTab==='solicitadas'||((currentTab==='projetos-pro'||currentTab==='projetos')&&!activeProjectProId&&projectsPro.length))&&(typeof hubView==='undefined'||hubView==='taskflow')&&!sidebarPersonId)document.body.classList.add('hub-tela');}catch(e){}return x;};window.render._hub=1;}
}
/* Navbar oficial: logo + "HUB Klain" à esquerda; busca, foto, nome e sino à direita.
   Botões extras do TaskFlow vão para o menu do usuário (nada é removido). */
function navbar(){var h=document.querySelector('.hdr');if(!h||h._hub)return;h._hub=1;h.classList.add('app-navbar-klain');
  var sp=h.querySelector('.hdr-logo span');if(sp){sp.textContent='HUB Klain';sp.className='hub-brand-txt';sp.removeAttribute('style');}
  var r=h.querySelector('.hdr-right');if(!r)return;
  var si=document.getElementById('search-input-topbar');if(si)si.placeholder='Buscar tarefas...';
  var menu=document.createElement('div');menu.className='hub-user-menu';menu.id='hub-user-menu';
  Array.prototype.slice.call(r.children).forEach(function(el){if(el.classList.contains('search-wrap')||el.id==='notif-btn'||el.classList.contains('notif-wrap'))return;
    if(el.tagName==='DIV'&&!el.children.length){el.style.display='none';return;}
    if(el.id==='modo-chip')return; // controlado pelo app
    var lbl=el.getAttribute('title')||el.textContent.trim();el.classList.add('hub-um-item');if(!el.querySelector('.hub-um-lbl')){var s=document.createElement('span');s.className='hub-um-lbl';s.textContent=lbl;el.appendChild(s);}menu.appendChild(el);});
  var mc=document.getElementById('modo-chip');if(mc)mc.classList.add('hub-hide-nav');
  var u=document.createElement('button');u.className='app-navbar-user hub-user';u.type='button';
  var U=window.CURRENT_USER_ID||(typeof CURRENT_USER_ID!=='undefined'?CURRENT_USER_ID:'');var p=null;try{p=_personById(U);}catch(e){}
  var nm=p&&(p.name||p.nome)||'Usuário';var foto=p&&(p.foto||p.photo||p.avatar);
  u.innerHTML=(foto?'<img class="hub-user-foto" src="'+esc(foto)+'" alt="">':'<span class="hub-user-foto hub-user-ini">'+esc(nm.charAt(0))+'</span>')+'<span class="hub-user-nome">'+esc(nm)+'</span>';
  u.onclick=function(e){e.stopPropagation();if(window.hubPerfilAbrir)hubPerfilAbrir();else menu.classList.toggle('open');};document.addEventListener('click',function(){menu.classList.remove('open');});
  var nb=document.getElementById('notif-btn');r.insertBefore(u,nb||null);r.appendChild(menu);
  var aj=document.createElement('button');aj.className='hub-um-item';aj.innerHTML='<i class="ti ti-palette"></i><span class="hub-um-lbl">Aparência</span>';aj.onclick=function(){window.hubTemaAbrir&&hubTemaAbrir();};menu.appendChild(aj);}
function userUpd(){var u=document.querySelector('.hub-user');if(!u)return;var p=null;try{p=_personById(CURRENT_USER_ID);}catch(e){}if(!p)return;var nm=p.name||p.nome;var foto=p.foto||p.photo||p.avatar;u.innerHTML=(foto?'<img class="hub-user-foto" src="'+esc(foto)+'" alt="">':'<span class="hub-user-foto hub-user-ini">'+esc(nm.charAt(0))+'</span>')+'<span class="hub-user-nome">'+esc(nm)+'</span>';}
function fab(){var m=document.getElementById('fab-menu');if(!m||m._hub)return;m._hub=1;m.classList.add('hub-fab-menu');
  if(!m.querySelector('.hub-fab-tit')){var t=document.createElement('div');t.className='hub-fab-tit';t.innerHTML='<i class="ti ti-plus"></i> Adicionar';m.insertBefore(t,m.firstChild);}
  m.querySelectorAll('.fab-menu-item').forEach(function(it){it.childNodes.forEach(function(n){if(n.nodeType===3&&/\S/.test(n.nodeValue)){var v=n.nodeValue.replace(/^\s*(Nova|Novo)\s+/,' ');n.nodeValue=v.replace(/^\s*(\S)/,function(a,c){return ' '+c.toUpperCase();});}});});}
function init(){envolver();navbar();fab();userUpd();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){init();setTimeout(init,600);});else{init();setTimeout(init,600);}
window.addEventListener('load',function(){init();try{if(typeof currentTab!=='undefined'&&(currentTab==='minhas-tarefas'||currentTab==='solicitadas'))render();}catch(e){}});
})();
