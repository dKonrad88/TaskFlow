/* Hub Klain — fase 3: estrutura oficial dos modais de tarefa e do projeto em tela cheia.
   Só reorganiza elementos existentes (mesmos ids e handlers); nenhuma lógica é alterada. */
(function(){
'use strict';
function q(s,r){return (r||document).querySelector(s);}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function campo(id){var x=document.getElementById(id);return x?x.closest('.modal-field'):null;}

/* ---- Modal Editar Tarefa: [metadados | título+descrição+itens] + painel Comentários ---- */
function modalEditar(){var m=q('#edit-modal .modal-2col');if(!m||m._hub)return;m._hub=1;m.classList.add('hub-tmodal');
  var body=q('.modal-2col-body',m),L=q('.modal-col-left',m),R=q('.modal-col-right',m);if(!body||!L||!R)return;
  body.insertBefore(R,L); // metadados à esquerda, como no oficial
  var cl=document.getElementById('comment-list');var bloco=cl?cl.parentElement:null;
  var div=bloco&&bloco.previousElementSibling&&bloco.previousElementSibling.classList.contains('td-section-divider')?bloco.previousElementSibling:null;
  var aside=el('aside','hub-tm-coment','<div class="hub-tm-coment-head"><i class="ti ti-messages"></i> Comentários</div>');
  var corpo=el('div','hub-tm-coment-body');aside.appendChild(corpo);
  if(bloco){corpo.appendChild(bloco);} if(div)div.style.display='none';
  m.appendChild(aside);
  var hdr=q('.modal-header',m);if(hdr){hdr.classList.add('hub-tm-head');var t=el('div','hub-tm-titulo','<i class="ti ti-pencil"></i> Editar Tarefa');hdr.insertBefore(t,hdr.firstChild);}
}
/* ---- Modal Nova Tarefa: mesma grade de 3 colunas ---- */
function modalNova(){var m=q('#task-modal .modal');if(!m||m._hub)return;m._hub=1;m.classList.add('hub-tmodal','hub-tmodal-nova');
  var hdr=q('.modal-header',m),foot=q('.modal-footer',m);
  var grid=el('div','hub-tm-grid'),esq=el('div','hub-tm-esq'),meio=el('div','hub-tm-meio'),base=el('div','hub-tm-base');
  ['inp-prio','sel-solicitante','sel-executor','inp-date'].forEach(function(id){var f=campo(id);if(f)esq.appendChild(f);});
  ['sel-proj','sel-fase-wrap','sel-meeting'].forEach(function(id){var x=document.getElementById(id);var f=x?(x.classList.contains('modal-field')?x:x.closest('.modal-field')):null;if(f)base.appendChild(f);});
  Array.prototype.slice.call(m.children).forEach(function(c){if(c!==hdr&&c!==foot)meio.appendChild(c);});
  var aside=el('aside','hub-tm-coment','<div class="hub-tm-coment-head"><i class="ti ti-messages"></i> Comentários</div><div class="hub-tm-coment-vazio"><i class="ti ti-message-off"></i><div>Comentários ficam liberados quando a tarefa é salva.</div></div>');
  grid.appendChild(esq);grid.appendChild(meio);grid.appendChild(aside);
  m.insertBefore(grid,foot||null);if(foot){var fw=el('div','hub-tm-rodape');m.insertBefore(fw,foot);fw.appendChild(base);fw.appendChild(foot);}
}
/* ---- Projeto aberto: tela cheia com barra de título e abas oficiais ---- */
var ABAS=[['h5:quadro','ti-layout-kanban','Quadro'],['h5:linha','ti-timeline','Linha do tempo'],['pessoas','ti-users','Pessoas'],['anexos','ti-paperclip','Anexos'],['h5:decisoes','ti-gavel','Decisões'],['info','ti-info-circle','Informações'],['anotacoes','ti-messages','Chat'],['fases','ti-stairs','Etapas (editar)'],['analise','ti-chart-bar','Análise'],['tarefas','ti-list-check','Tarefas']];
function projeto(){if(typeof activeProjectProId==='undefined'||!activeProjectProId)return;if(typeof currentTab==='undefined'||(currentTab!=='projetos-pro'&&currentTab!=='projetos'))return;
  var tc=document.getElementById('task-container');if(!tc||q('.hub-pjv-top',tc))return;
  var p=(projectsPro||[]).find(function(x){return x.id===activeProjectProId;});if(!p)return;
  document.body.classList.add('hub-pjv');
  // esconde a barra de abas original (continua no DOM)
  var bs=tc.querySelectorAll('[onclick^="setProjectProTab("]');var cont={};bs.forEach(function(b){var pai=b.parentElement;cont[pai&&pai.dataset?(pai._hk=pai._hk||Math.random()):0]=pai;});
  Object.keys(cont).forEach(function(k){var pai=cont[k];if(pai&&pai.querySelectorAll('[onclick^="setProjectProTab("]').length>=5)pai.classList.add('hub-hide-nav');});
  var tab=(typeof activeProjectProTab!=='undefined')?activeProjectProTab:'visao';
  var top=el('div','hub-pjv-top','<div class="hub-pjv-bar"><div class="hub-pjv-nome"><i class="ti ti-file"></i> '+String(p.nome||p.name||'').replace(/[<>&]/g,'')+'</div><div class="hub-pjv-acts"><button class="hub-btn-outline" onclick="try{setProjectProTab(\'editar\')}catch(e){}"><i class="ti ti-pencil"></i> Editar projeto</button><button class="hub-pjv-x" title="Fechar" onclick="voltarParaProjetosPro()"><i class="ti ti-x"></i></button></div></div>'+
    '<div class="tk-tabs hub-pjv-tabs">'+ABAS.map(function(a){var h5=a[0].indexOf('h5:')===0;return '<button class="tk-tab'+(!h5&&a[0]===tab?' active':'')+'"'+(h5?' data-h5="'+a[0].slice(3)+'" onclick="hubPjTab(\''+a[0].slice(3)+'\')"':' onclick="setProjectProTab(\''+a[0]+'\')"')+'><i class="ti '+a[1]+'"></i> '+a[2]+'</button>';}).join('')+'</div>');
  tc.insertBefore(top,tc.firstChild);}
function envolver(){
  if(typeof window.render==='function'&&!window.render._hub3){var r=window.render;window.render=function(){document.body.classList.remove('hub-pjv');var x=r.apply(this,arguments);try{projeto();}catch(e){}return x;};window.render._hub3=1;}
}
function init(){envolver();modalEditar();modalNova();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('load',function(){init();setTimeout(init,500);});
})();
