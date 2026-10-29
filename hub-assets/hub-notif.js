/* hub-notif.js — sininho no layout oficial do Hub (classes .tk-notif-*). Usa os dados/funções de notificação do TaskFlow (_notifs, _notifClick, marcarTodasLidas, limparTodasNotifs, descartarNotif). */
(function(){
var CATS=[['tudo','Tudo','ti-bell',''],['atribuicoes','Tarefas','ti-checkbox','tk-notif-tarefa'],['mencoes','Comentários e menções','ti-message-circle','tk-notif-comentario'],['aguardando','Aguardando','ti-clock-pause','tk-notif-copia'],['cutucadas','Lembretes','ti-alarm','tk-notif-lembrete'],['concluidas','Concluídas','ti-circle-check','tk-notif-mural']];
var cat='tudo';
function lista(){try{return _notifs||[];}catch(e){return [];}}
function catDe(n){try{return _notifCatDe(n.tipo);}catch(e){return 'atribuicoes';}}
function rel(ts){var d=(Date.now()-new Date(ts).getTime())/1000;if(!(d>=0))return '';if(d<60)return 'agora';var m=Math.floor(d/60);if(m<60)return 'há '+m+' min';var h=Math.floor(m/60);if(h<24)return 'há '+h+' h';var dd=Math.floor(h/24);return dd===1?'ontem':'há '+dd+' dias';}
function seg(c){for(var i=0;i<CATS.length;i++)if(CATS[i][0]===c)return CATS[i];return CATS[1];}
function item(n,idx){var s=seg(catDe(n));var ic=n.icon||s[2];
  var extra='';if(n.tipo==='cutucada'&&n.cutucadaId&&typeof _cutucadas!=='undefined'){var c=_cutucadas.find(function(x){return x.id===n.cutucadaId;});if(c&&!c.respondida)extra='<div class="hub-nt-acts"><button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation();_cutPronto(\''+n.cutucadaId+'\')">Já está pronto</button><button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation();_cutFacoOpen(\''+n.cutucadaId+'\')">Faço até…</button><button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation();_cutTravadoOpen(\''+n.cutucadaId+'\')">Travado</button></div>';}
  return '<div class="tk-notif-item '+s[3]+(n.lida?'':' tk-notif-nova')+'" role="button" tabindex="0" onclick="_notifClick('+idx+')"><span class="tk-notif-icone"><i class="ti '+ic+'"></i></span><span class="tk-notif-corpo"><span class="tk-notif-texto">'+(n.texto||'')+'</span><span class="tk-notif-quando">'+rel(n.ts)+'</span>'+extra+'</span>'+(n.lida?'':'<span class="tk-notif-ponto"></span>')+'<button type="button" class="btn-close tk-notif-dispensar" title="Dispensar" onclick="descartarNotif('+idx+',event)"></button></div>';}
function render(){var p=document.getElementById('notif-panel');if(!p)return;var L=lista();
  p.classList.add('dropdown-menu','tk-notif-menu','hub-notif');
  var nl={tudo:0};L.forEach(function(n){if(!n.lida){nl.tudo++;var c=catDe(n);nl[c]=(nl[c]||0)+1;}});
  var abas=CATS.map(function(c){var k=nl[c[0]]||0;return '<button type="button" class="tk-notif-aba'+(cat===c[0]?' ativa':'')+'" title="'+c[1]+'" onclick="event.stopPropagation();hubNotifCat(\''+c[0]+'\')"><i class="ti '+c[2]+'"></i><span class="tk-notif-aba-label">'+c[1]+'</span>'+(k?'<span class="tk-notif-aba-n">'+(k>99?'99+':k)+'</span>':'')+'</button>';}).join('');
  var it=L.map(function(n,i){return {n:n,i:i};}).filter(function(o){return cat==='tudo'||catDe(o.n)===cat;}).sort(function(a,b){return new Date(b.n.ts)-new Date(a.n.ts);});
  var corpo=it.length?it.map(function(o){return item(o.n,o.i);}).join(''):'<div class="tk-notif-vazio"><i class="ti ti-bell-off"></i><span>Nenhuma notificação por aqui.</span></div>';
  p.innerHTML='<div class="tk-notif-head"><span class="tk-notif-head-titulo"><i class="ti ti-bell"></i>Notificações</span><span class="tk-notif-head-acoes"><a href="#" class="link-primary" onclick="event.preventDefault();event.stopPropagation();marcarTodasLidas()">Marcar lidas</a><a href="#" class="link-primary" onclick="event.preventDefault();event.stopPropagation();limparTodasNotifs()">Limpar</a></span></div><div class="tk-notif-abas">'+abas+'</div><div class="tk-notif-lista" id="notif-list">'+corpo+'</div>';
  try{atualizarBadgeNotif();}catch(e){}}
window.hubNotifCat=function(c){cat=c;render();};
window.renderNotifPanel=render;
})();
