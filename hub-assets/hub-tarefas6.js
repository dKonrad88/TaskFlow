/* hub-tarefas6.js — Organizar, Histórico, Rotinas e Notas no layout oficial do Hub (dados do TaskFlow). */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function U(){return typeof CURRENT_USER_ID!=='undefined'?CURRENT_USER_ID:'';}
function TT(){return ((typeof tasks!=='undefined'&&tasks)||[]).filter(function(t){return !t.deleted;});}
function hj(){return typeof today!=='undefined'?today:new Date().toISOString().slice(0,10);}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function busca(){return '<div class="hub-busca-pag"><i class="ti ti-search"></i><input placeholder="Buscar nesta página." oninput="hubTelaBusca(this.value);hub6Busca(this.value)"></div>';}
function head(ic,t,sub,extra){return '<div class="hoje-head"><div><h2 class="hoje-title"><i class="ti '+ic+'"></i>'+t+'</h2><p class="hoje-sub">'+sub+'</p></div><div class="hoje-toolbar">'+busca()+(extra||'')+'</div></div>';}
function vs(){return '<div class="tk-viewswitch"><button class="tk-view active"><i class="ti ti-list"></i> Lista</button><button class="tk-view" onclick="try{setAllView(\'kanban\')}catch(e){}"><i class="ti ti-layout-grid"></i> Cartões</button></div>';}
window.hub6Busca=function(q){q=(q||'').toLowerCase();document.querySelectorAll('.h6s-card').forEach(function(c){c.style.display=c.textContent.toLowerCase().indexOf(q)>=0?'':'none';});};
var HF='todas',RV='calendario';
function organizar(){var L=TT().filter(function(t){return !t.done&&!t.executor&&!t.someday&&!t.projectProId;});
  var qa='<div class="h6s-qa"><input id="hub-qa-org" placeholder="Nova tarefa rápida — pressione Enter para salvar" onkeydown="if(event.key===\'Enter\'){event.preventDefault();try{quickAddTask(\'hub-qa-org\',{date:null})}catch(e){}}"><button onclick="try{quickAddTask(\'hub-qa-org\',{date:null})}catch(e){}"><i class="ti ti-plus"></i> Adicionar</button></div>';
  var c=L.length?hubSecao('sec-today','ti-inbox','A organizar',L):'<div class="h6s-vazio"><i class="ti ti-checks"></i><span>Nenhuma tarefa para organizar. Adicione uma acima.</span></div>';
  return head('ti-list-details','Organizar','Tarefas que ainda não têm responsável — defina quem faz e quando.',vs())+qa+c;}
function historico(){var D=TT().filter(function(t){return t.done;});var u=U();
  var C=[['todas','ti-layout-grid','Todas',D],['exec','ti-user-check','Executadas por mim',D.filter(function(t){return t.executor===u;})],['solic','ti-send','Solicitadas por mim',D.filter(function(t){return t.solicitante===u&&t.executor!==u;})]];
  var cur=C.filter(function(c){return c[0]===HF;})[0]||C[0];
  var bar='<div class="tk-filterbar">'+C.map(function(c){return '<button class="tk-filter'+(c[0]===HF?' active':'')+'" onclick="hub6Hist(\''+c[0]+'\')"><i class="ti '+c[1]+'"></i> '+c[2]+' <span class="tk-filter-count">'+c[3].length+'</span></button>';}).join('')+'</div>';
  var L=cur[3].slice().sort(function(a,b){return String(b.doneAt||b.date||'').localeCompare(String(a.doneAt||a.date||''));});
  return head('ti-history','Histórico','Tudo o que já foi concluído.',vs())+bar+(L.length?hubSecao('sec-success','ti-checks','Concluídas',L):'<div class="h6s-vazio"><i class="ti ti-history"></i><span>Nada concluído ainda.</span></div>');}
window.hub6Hist=function(f){HF=f;desenhar();};
window.hub6Rot=function(v){RV=v;desenhar();};
var REC={diaria:'Diária',uteis:'Dias úteis',semanal:'Semanal',quinzenal:'Quinzenal',mensal:'Mensal',anual:'Anual'};
function rnome(r){return r.title||r.titulo||r.nome||r.name||'Rotina';}
function rcard(r,d){var nx='';try{nx=nextOccurrence(r)||'';}catch(e){}var id=JSON.stringify(r.id).replace(/"/g,'&quot;');var p=r.prio||'media';
  return '<div class="h6s-card h6s-rot prio-'+esc(p)+'" onclick="try{openEditRotina('+id+')}catch(e){}"><div class="h6s-rot-t">'+esc(rnome(r))+'</div><div class="h6s-rot-m"><span><i class="ti ti-repeat"></i> '+esc(REC[r.rec||r.recorrencia||'diaria']||r.rec||'')+'</span>'+(nx?'<span><i class="ti ti-calendar"></i> '+nx.slice(8,10)+'/'+nx.slice(5,7)+'</span>':'')+'</div></div>';}
function telaRotinas(){var R=(typeof rotinas!=='undefined'&&rotinas)||[];var A=R.filter(function(r){return r.active!==false;});
  var tg='<div class="tk-viewswitch">'+[['calendario','ti-calendar','Calendário'],['periodicidade','ti-repeat','Periodicidade'],['lista','ti-list','Lista']].map(function(v){return '<button class="tk-view'+(RV===v[0]?' active':'')+'" onclick="hub6Rot(\''+v[0]+'\')"><i class="ti '+v[1]+'"></i> '+v[2]+'</button>';}).join('')+'</div><button class="h5-btn h5-pri" onclick="try{openRotinaModal()}catch(e){}"><i class="ti ti-plus"></i> Nova rotina</button>';
  var body;
  if(!A.length) body='<div class="h6s-vazio"><i class="ti ti-repeat"></i><span>Nenhuma rotina ativa.</span></div>';
  else if(RV==='calendario'){var d=new Date(hj()+'T00:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));var N=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    body='<div class="h6s-semana">'+N.map(function(n,i){var x=new Date(d);x.setDate(d.getDate()+i);var L=A.filter(function(r){try{return matchesRecorrencia(r,x);}catch(e){return false;}});var hoje=iso(x)===hj();
      return '<div class="h6s-dia'+(hoje?' hoje':'')+'"><div class="h6s-dia-h">'+n.toUpperCase()+(hoje?' <span class="h6s-hoje">HOJE</span>':'')+'</div>'+(L.length?L.map(function(r){return rcard(r);}).join(''):'<div class="h6s-dia-v">—</div>')+'</div>';}).join('')+'</div>';}
  else if(RV==='periodicidade'){var g={};A.forEach(function(r){var k=REC[r.rec||r.recorrencia||'diaria']||'Outras';(g[k]=g[k]||[]).push(r);});
    body='<div class="h6s-semana">'+Object.keys(g).map(function(k){return '<div class="h6s-dia"><div class="h6s-dia-h">'+esc(k).toUpperCase()+' <span class="hoje-section-count">'+g[k].length+'</span></div>'+g[k].map(function(r){return rcard(r);}).join('')+'</div>';}).join('')+'</div>';}
  else body='<div class="tk-table-wrap"><table class="tk-table"><thead><tr><th>Rotina</th><th>Periodicidade</th><th>Próxima</th><th>Responsável</th></tr></thead><tbody>'+A.map(function(r){var nx='';try{nx=nextOccurrence(r)||'';}catch(e){}var id=JSON.stringify(r.id).replace(/"/g,'&quot;');var pn='';try{var pp=_personById(r.executor||r.responsavel);pn=pp?(pp.name||pp.nome):'';}catch(e){}return '<tr class="tk-trow h6s-card" onclick="try{openEditRotina('+id+')}catch(e){}"><td class="tt-title">'+esc(rnome(r))+'</td><td>'+esc(REC[r.rec||r.recorrencia||'diaria']||'')+'</td><td>'+(nx?nx.slice(8,10)+'/'+nx.slice(5,7):'—')+'</td><td>'+esc(pn||'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
  return head('ti-repeat','Rotinas','Tarefas que se repetem — cada ocorrência vira uma tarefa no dia.',tg)+body;}
var NC={none:'#fff3a8',blue:'#cfe3ff',teal:'#c9f0ec',green:'#d3f0c8',amber:'#ffe0a8',red:'#ffd0dc',purple:'#e5d6ff',gray:'#e6e6e6'};
function notas(){var N=((typeof notes!=='undefined'&&notes)||[]).slice().sort(function(a,b){return (b.pinned?1:0)-(a.pinned?1:0)||String(b.created||'').localeCompare(String(a.created||''));});
  var add='<button class="h5-btn h5-pri" onclick="try{addNote()}catch(e){}"><i class="ti ti-plus"></i> Nova nota</button>';
  var body=N.length?'<div class="h6s-notas">'+N.map(function(n){var id=JSON.stringify(n.id).replace(/"/g,'&quot;');var tx=String(n.body||n.texto||'').replace(/<[^>]+>/g,' ').trim();var dt=n.created?String(n.created).slice(0,10):'';
    return '<div class="h6s-card h6s-nota" style="background:'+(NC[n.color||'none']||NC.none)+'" onclick="try{openNoteModal('+id+')}catch(e){}"><div class="h6s-nota-t">'+(n.pinned?'<i class="ti ti-pin-filled"></i> ':'')+esc(n.title||'Sem título')+'</div><div class="h6s-nota-b">'+esc(tx.slice(0,220))+'</div><div class="h6s-nota-f"><span>'+(dt?dt.slice(8,10)+'/'+dt.slice(5,7):'')+'</span><span><button title="Converter em tarefa" onclick="event.stopPropagation();try{converterNotaEmTarefa('+id+')}catch(e){}"><i class="ti ti-checkbox"></i></button><button title="Excluir" onclick="event.stopPropagation();try{deleteNoteRow('+id+')}catch(e){}"><i class="ti ti-trash"></i></button></span></div></div>';}).join('')+'</div>':'<div class="h6s-vazio"><i class="ti ti-notes"></i><span>Nenhuma nota ainda.</span></div>';
  return head('ti-notes','Notas','Anotações rápidas, ideias e lembretes.',add)+body;}
var TELAS={entrada:organizar,concluidas:historico,rotinas:telaRotinas,anotacoes:notas};
function desenhar(){var tc=document.getElementById('task-container');if(!tc)return false;var ct=typeof currentTab!=='undefined'?currentTab:'';var f=TELAS[ct];if(!f)return false;
  if(typeof sidebarPersonId!=='undefined'&&sidebarPersonId)return false;if(typeof hubView!=='undefined'&&hubView&&hubView!=='taskflow')return false;
  document.body.classList.add('hub-tela');tc.innerHTML='<style>'+(window.hubCfgCss?hubCfgCss():'')+'</style><div class="hub-oficial task-page h6s">'+f()+'</div>';return true;}
window.hub6Desenhar=desenhar;
function hook(){if(typeof window.render==='function'&&!window.render._h6t){var r=window.render;window.render=function(){var x=r.apply(this,arguments);try{desenhar();}catch(e){console.error(e);}return x;};window.render._h6t=1;}}
hook();window.addEventListener('load',function(){hook();setTimeout(function(){hook();desenhar();},700);});
})();
