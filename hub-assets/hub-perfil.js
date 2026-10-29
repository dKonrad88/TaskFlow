/* hub-perfil.js — página de Perfil no layout do Hub Klain. Só UI: usa dados e funções já existentes do TaskFlow. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function eu(){var U=(typeof CURRENT_USER_ID!=='undefined'?CURRENT_USER_ID:'');var p=null;try{p=_personById(U);}catch(e){}return p||{};}
var aba='pers',filtro='todos';
function call(fn){var a=[].slice.call(arguments,1);return function(){fechar();try{if(typeof window[fn]==='function')window[fn].apply(null,a);}catch(e){console.error(e);}};}
function menuBtn(match){var m=document.getElementById('hub-user-menu');if(!m)return null;return [].slice.call(m.querySelectorAll('.hub-um-item')).filter(function(b){return match.test(b.textContent+' '+(b.getAttribute('title')||'')+' '+(b.getAttribute('onclick')||''));})[0]||null;}
function viaMenu(re,fb){return function(){fechar();var b=menuBtn(re);if(b)b.click();else if(fb&&typeof window[fb]==='function')window[fb]();};}
function card(ic,t,body){return '<div class="pf-card"><div class="pf-card-h"><i class="ti '+ic+'"></i> '+t+'</div><div class="pf-card-b">'+body+'</div></div>';}
function corHtml(){var A=window.hubAparencia,cur=A?A.get().tema:'coral',h='<div class="btn-group btn-group-sm pf-filtro">';
  [['todos','Todos',''],['claros','Claros','ti-sun'],['escuros','Escuros','ti-moon']].forEach(function(f){h+='<button type="button" class="btn btn-outline-secondary'+(filtro===f[0]?' active':'')+'" data-pf-filtro="'+f[0]+'">'+(f[2]?'<i class="ti '+f[2]+'"></i> ':'')+f[1]+'</button>';});h+='</div>';
  (A?A.TEMAS:[]).forEach(function(g){var ts=g[1].filter(function(t){return filtro==='todos'||(filtro==='escuros')===!!t[3];});if(!ts.length)return;
    h+='<div class="pf-cat">'+esc(g[0])+'</div><div class="pf-temas">';
    ts.forEach(function(t){h+='<button type="button" class="pf-tema'+(t[0]===cur?' sel':'')+'" data-pf-tema="'+t[0]+'"><span class="pf-prev" data-bs-theme="'+t[0]+'"><i></i><i></i></span><span class="pf-tn"><i class="ti '+t[2]+'"></i> '+esc(t[1])+'</span><i class="ti '+(t[3]?'ti-moon':'ti-sun')+' pf-ld"></i></button>';});
    h+='</div>';});return h;}
function fundoHtml(){var A=window.hubAparencia,cur=A?A.get().fundo:'nenhum',h='<div class="pf-fundos">';(A?A.FUNDOS:[]).forEach(function(f){h+='<label class="form-check form-check-inline"><input class="form-check-input" type="radio" name="pf-fundo" value="'+f[0]+'"'+(f[0]===cur?' checked':'')+'> <span class="form-check-label">'+esc(f[1])+'</span></label>';});return h+'</div>';}
function veuHtml(){var A=window.hubAparencia,v=A?A.get():{};var on=v.veuOn!==false,cor=v.veu||'#448887',al=v.veuAlpha!=null?v.veuAlpha:0.9;
  return '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="pf-veu-on"'+(on?' checked':'')+'><label class="form-check-label" for="pf-veu-on">Véu personalizado</label></div><div class="pf-veu"><input type="color" class="form-control form-control-color" id="pf-veu-cor" value="'+esc(cor)+'"><input type="range" class="form-range" min="0" max="1" step="0.05" id="pf-veu-al" value="'+al+'"><span class="pf-veu-v" id="pf-veu-v">'+Math.round(al*100)+'%</span></div>';}
function ferr(){var it=[['ti-robot','Assistente IA',/IA|Chat/i,'abrirChatIA'],['ti-calendar','Agenda',/Agenda|Google/i,null],['ti-cloud','Nuvem',/Nuvem|Cloud/i,'abrirNuvem'],['ti-settings','Configurações',/Config/i,'abrirConfiguracoes'],['ti-moon','Modo escuro do TaskFlow',/Escuro|Dark|toggleDark/i,'toggleDark']];
  return '<div class="pf-ferr">'+it.map(function(x,i){return '<button type="button" class="btn btn-sm btn-outline-primary" data-pf-ferr="'+i+'"><i class="ti '+x[0]+'"></i> '+x[1]+'</button>';}).join('')+'</div>';}
var FERR=[[/IA|Chat/i,'abrirChatIA'],[/Agenda|Google/i,null],[/Nuvem|Cloud/i,'abrirNuvem'],[/Config/i,'abrirConfiguracoes'],[/Escuro|Dark|toggleDark/i,'toggleDark']];
function corpo(){
  if(aba==='pers') return card('ti-palette','Cor',corHtml())+card('ti-photo','Fundo',fundoHtml())+card('ti-device-desktop-cog','Automático','<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="pf-auto"'+(window.hubAparencia&&hubAparencia.get().auto?' checked':'')+'><label class="form-check-label" for="pf-auto">Seguir o modo claro/escuro do sistema (usa Claro ou Escuro automaticamente)</label></div>')+card('ti-droplet-half-2','Véu do fundo',veuHtml())+
    card('ti-bell','Sino de notificações','<p class="pf-muted">Escolha quais avisos aparecem no sino e com que frequência.</p><button type="button" class="btn btn-sm btn-outline-primary" data-pf-go="cfg"><i class="ti ti-adjustments"></i> Ajustar notificações</button>')+
    card('ti-tools','Ferramentas',ferr());
  if(aba==='cat') return card('ti-tags','Categorias','<p class="pf-muted">Etiquetas, setores e listas usadas para organizar as tarefas.</p><button type="button" class="btn btn-sm btn-primary" data-pf-go="cfg"><i class="ti ti-settings"></i> Gerenciar nas configurações</button>');
  if(aba==='grp') { var n=0;try{n=(people||[]).length;}catch(e){} return card('ti-users-group','Grupos','<p class="pf-muted">'+n+' pessoa(s) cadastradas na equipe.</p><button type="button" class="btn btn-sm btn-primary" data-pf-go="pessoas"><i class="ti ti-users"></i> Ver equipe</button> <button type="button" class="btn btn-sm btn-outline-primary" data-pf-go="cfg"><i class="ti ti-settings"></i> Configurar</button>');}
  return card('ti-shield','Admin','<p class="pf-muted">Configurações gerais, conta na nuvem e backup dos dados.</p><button type="button" class="btn btn-sm btn-primary" data-pf-go="cfg"><i class="ti ti-settings"></i> Configurações</button> <button type="button" class="btn btn-sm btn-outline-primary" data-pf-go="nuvem"><i class="ti ti-cloud"></i> Nuvem / sincronização</button>');}
function render(){var el=document.getElementById('hub-perfil');if(!el)return;var p=eu(),nm=p.name||p.nome||'Usuário',foto=p.foto||p.photo||p.avatar,em=p.email||p.mail||'',cg=p.cargo||p.role||p.setor||p.funcao||'';
  var tabs=[['pers','ti-palette','Personalização'],['cat','ti-tags','Categorias'],['grp','ti-users-group','Grupos'],['adm','ti-shield','Admin']];
  el.innerHTML='<div class="pf-wrap"><div class="pf-head">'+(foto?'<img class="pf-foto" src="'+esc(foto)+'" alt="">':'<span class="pf-foto pf-ini">'+esc(nm.charAt(0))+'</span>')+
   '<div class="pf-info"><div class="pf-nome">'+esc(nm)+'</div>'+(em?'<div class="pf-mail">'+esc(em)+'</div>':'')+(cg?'<div class="pf-cargo">'+esc(cg)+'</div>':'')+'</div>'+
   '<div class="pf-acts"><button type="button" class="btn btn-sm btn-primary" data-pf-go="senha"><i class="ti ti-key"></i> Alterar Senha</button><button type="button" class="btn btn-sm btn-primary" data-pf-go="instalar"><i class="ti ti-download"></i> Instalar app</button><button type="button" class="btn btn-sm btn-danger" data-pf-go="sair"><i class="ti ti-logout"></i> Deslogar</button></div></div>'+
   '<ul class="nav nav-tabs pf-tabs">'+tabs.map(function(t){return '<li class="nav-item"><button type="button" class="nav-link'+(aba===t[0]?' active':'')+'" data-pf-aba="'+t[0]+'"><i class="ti '+t[1]+'"></i> '+t[2]+'</button></li>';}).join('')+'</ul>'+corpo()+'</div>';}
function veuSet(){var on=document.getElementById('pf-veu-on'),c=document.getElementById('pf-veu-cor'),a=document.getElementById('pf-veu-al');if(!c)return;var v=document.getElementById('pf-veu-v');if(v)v.textContent=Math.round(a.value*100)+'%';
  if(window.hubVeuSet)try{hubVeuSet({on:on.checked,cor:c.value,alpha:parseFloat(a.value)});}catch(e){}}
function onClick(e){var t=e.target.closest('[data-pf-aba],[data-pf-filtro],[data-pf-tema],[data-pf-go],[data-pf-ferr]');if(!t)return;
  if(t.dataset.pfAba){aba=t.dataset.pfAba;render();return;}
  if(t.dataset.pfFiltro){filtro=t.dataset.pfFiltro;render();return;}
  if(t.dataset.pfTema){window.hubTemaSet&&hubTemaSet(t.dataset.pfTema);render();return;}
  if(t.dataset.pfFerr){var f=FERR[+t.dataset.pfFerr];viaMenu(f[0],f[1])();return;}
  var g=t.dataset.pfGo;
  if(g==='cfg')call('abrirConfiguracoes')();else if(g==='nuvem'||g==='senha')call('abrirNuvem')();
  else if(g==='pessoas'){fechar();try{if(typeof setTab==='function')setTab('pessoas');}catch(e){}}
  else if(g==='instalar'){if(window.hubInstalarApp)hubInstalarApp();}
  else if(g==='sair'){if(confirm('Deseja deslogar da conta na nuvem?'))call('nuvemLogout')();}}
function abrir(){var el=document.getElementById('hub-perfil');if(!el){el=document.createElement('div');el.id='hub-perfil';el.className='task-page';document.body.appendChild(el);
  el.addEventListener('click',onClick);el.addEventListener('change',function(e){if(e.target.name==='pf-fundo'&&window.hubFundoSet){hubFundoSet(e.target.value);}if(/^pf-veu/.test(e.target.id))veuSet();if(e.target.id==='pf-auto'&&window.hubAutoSet){hubAutoSet(e.target.checked);render();}});el.addEventListener('input',function(e){if(e.target.id==='pf-veu-al')veuSet();});}
  aba='pers';render();document.body.classList.add('hub-perfil-on');el.scrollTop=0;}
function fechar(){document.body.classList.remove('hub-perfil-on');}
window.hubPerfilAbrir=abrir;window.hubPerfilFechar=fechar;
document.addEventListener('click',function(e){if(!document.body.classList.contains('hub-perfil-on'))return;if(e.target.closest('.sidebar a,.sidebar button,.sidebar .nav-item,.sidebar [onclick],.hdr-logo,.fab,#fab-btn'))fechar();},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')fechar();});
})();
