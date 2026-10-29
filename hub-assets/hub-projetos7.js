/* hub-projetos7.js — lista de Projetos igual ao Hub oficial + projeto abre no Quadro. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var ST={ativo:['EM ANDAMENTO','p7-st-and'],andamento:['EM ANDAMENTO','p7-st-and'],planejamento:['PLANEJAMENTO','p7-st-pla'],pausado:['PAUSADO','p7-st-pau'],concluido:['CONCLUÍDO','p7-st-con']};
function br(d){return d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(2,4):'';}
function card(p){var T=(tasks||[]).filter(function(t){return t.projectProId===p.id&&!t.deleted;});var ok=T.filter(function(t){return t.done;}).length;var pc=T.length?Math.round(ok*100/T.length):0;
  var U=typeof CURRENT_USER_ID!=='undefined'?CURRENT_USER_ID:'';var meu=T.filter(function(t){return !t.done&&t.executor===U;}).length;
  var st=ST[p.status]||ST.planejamento;var id=JSON.stringify(p.id).replace(/"/g,'&quot;');
  return '<div class="p7-card" onclick="abrirProjectProView('+id+')"><div class="p7-h"><span class="p7-ic"><i class="ti '+(p.tipo==='processo'?'ti-git-merge':'ti-file')+'"></i></span><span class="p7-n">'+esc(p.nome||p.name||'Projeto')+'</span></div>'+
   (meu?'<span class="p7-voce"><i class="ti ti-circle-dot"></i> '+meu+' para você</span>':'')+'<span class="p7-st '+st[1]+'">'+st[0]+'</span>'+
   '<div class="p7-bar"><div style="width:'+pc+'%"></div></div><div class="p7-c">'+ok+'/'+T.length+' tarefas · '+pc+'%</div>'+(p.prazoFim?'<div class="p7-pz"><i class="ti ti-calendar"></i> Prazo '+br(p.prazoFim)+'</div>':'')+'</div>';}
function lista(){var tc=document.getElementById('task-container');if(!tc)return;
  var L=(projectsPro||[]).filter(function(p){return p.status!=='arquivado'&&p.status!=='concluido';});
  document.body.classList.add('hub-tela');
  tc.innerHTML='<div class="hub-oficial task-page p7"><div class="hoje-head"><div><h2 class="hoje-title"><i class="ti ti-folders"></i>Projetos</h2><p class="hoje-sub">Projetos em andamento.</p></div><div class="hoje-toolbar"><button class="p7-novo" onclick="try{abrirModalNovoProjectPro()}catch(e){criarProjectPro()}"><i class="ti ti-plus"></i> Novo projeto</button></div></div>'+
   (L.length?'<div class="p7-grid">'+L.map(card).join('')+'</div>':'<div class="h6s-vazio"><i class="ti ti-folders"></i><span>Nenhum projeto em andamento.</span></div>')+'</div>';}
function hook(){
  if(typeof window.render==='function'&&!window.render._p7){var r=window.render;window.render=function(){var x=r.apply(this,arguments);try{if(typeof currentTab!=='undefined'&&currentTab==='projetos-pro'&&!activeProjectProId&&!(typeof sidebarPersonId!=='undefined'&&sidebarPersonId))lista();}catch(e){console.error(e);}return x;};window.render._p7=1;}
  if(typeof window.abrirProjectProView==='function'&&!window.abrirProjectProView._p7){var a=window.abrirProjectProView;window.abrirProjectProView=function(id){var x=a.apply(this,arguments);try{if(window.hubPjTab)hubPjTab('quadro');}catch(e){}return x;};window.abrirProjectProView._p7=1;}
}
hook();window.addEventListener('load',function(){setTimeout(function(){hook();try{if(currentTab==='projetos-pro'&&!activeProjectProId)lista();}catch(e){}},750);});
})();
