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
/* Setor do projeto (nov/2026): lista = ÁREAS da sidebar. Sem setor gravado → sugere pelo setor mais comum
   em fase.grupos[].setor (só exibição, nada é gravado); senão cai em "Sem setor". */
var SETORES=['Comercial','Compras','Financeiro','Manutenção','Marketing','PCP','Qualidade','RH'];
window.HUB_SETORES=SETORES;
function norm(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function canon(x){var n=norm(x);if(!n)return '';if(n==='producao'||n==='pcp')return 'PCP';for(var i=0;i<SETORES.length;i++)if(norm(SETORES[i])===n)return SETORES[i];return '';}
window.hubSetorOpcoes=function(v){v=canon(v)||v||'';var h='<option value="">— Sem setor —</option>'+SETORES.map(function(s){return '<option value="'+esc(s)+'"'+(s===v?' selected':'')+'>'+esc(s)+'</option>';}).join('');if(v&&SETORES.indexOf(v)<0)h+='<option value="'+esc(v)+'" selected>'+esc(v)+'</option>';return h;};
function sugerido(p){var c={};(p.fases||[]).forEach(function(f){(f.grupos||[]).forEach(function(g){var s=canon(g.setor);if(s)c[s]=(c[s]||0)+((g.tarefaIds||[]).length||1);});});var b='',m=0;for(var k in c)if(c[k]>m){m=c[k];b=k;}return b;}
function setorDe(p){var s=p.setor?(canon(p.setor)||String(p.setor)):'';if(s)return [s,false];var g=sugerido(p);return g?[g,true]:['Sem setor',false];}
var LSK='hub_projetos_setor_chip';
function chipAtual(){try{return localStorage.getItem(LSK)||'Todos';}catch(e){return 'Todos';}}
window.hubSetorAtual=function(){var c=chipAtual();return (c==='Todos'||c==='Sem setor')?'':c;};
window.hubProjSetorChip=function(c){try{localStorage.setItem(LSK,c);}catch(e){}lista();};
var COLS=[['A Fazer',['planejamento'],'var(--text3)'],['Em andamento',['ativo','andamento'],'var(--bs-primary,var(--blue-mid))'],['Pausado',['pausado'],'var(--amber,#f59e0b)'],['Finalizado',['concluido'],'var(--success,#22c55e)']];
function lista(){var tc=document.getElementById('task-container');if(!tc)return;
  var L=(projectsPro||[]).filter(function(p){return p.status!=='arquivado';}).map(function(p){var s=setorDe(p);return {p:p,s:s[0],sug:s[1]};});
  document.body.classList.add('hub-tela');
  var cont={};L.forEach(function(x){cont[x.s]=(cont[x.s]||0)+1;});
  var ordem=SETORES.slice();Object.keys(cont).forEach(function(k){if(ordem.indexOf(k)<0&&k!=='Sem setor')ordem.push(k);});ordem.push('Sem setor');
  var ch=chipAtual();if(ch!=='Todos'&&ordem.indexOf(ch)<0)ch='Todos';
  var chips='<div class="p7s-chips">'+[['Todos',L.length]].concat(ordem.filter(function(k){return k!=='Sem setor'||cont[k];}).map(function(k){return [k,cont[k]||0];})).map(function(c){var q=JSON.stringify(c[0]).replace(/"/g,'&quot;');return '<button class="p7s-chip'+(c[0]===ch?' on':'')+(c[1]?'':' zero')+'" onclick="hubProjSetorChip('+q+')">'+esc(c[0])+' <span>('+c[1]+')</span></button>';}).join('')+'</div>';
  var V=L.filter(function(x){return ch==='Todos'||x.s===ch;});
  var cols=COLS.map(function(c){var it=V.filter(function(x){return c[1].indexOf(x.p.status||'planejamento')>=0||(c[0]==='A Fazer'&&!ST[x.p.status]);});
    var corpo='';ordem.forEach(function(s){var g=it.filter(function(x){return x.s===s;});if(!g.length)return;corpo+='<div class="p7s-sub">'+esc(s.toUpperCase())+(g.some(function(x){return x.sug;})?' <em title="Setor sugerido pelos grupos das fases — defina no projeto">sugerido</em>':'')+'</div>'+g.map(function(x){return card(x.p);}).join('');});
    return '<div class="p7s-col"><div class="p7s-ch"><span class="p7s-dot" style="background:'+c[2]+'"></span>'+c[0].toUpperCase()+' <span class="p7s-n">'+it.length+'</span></div>'+(corpo||'<div class="p7s-vazio">Nenhum projeto</div>')+'</div>';}).join('');
  tc.innerHTML='<div class="hub-oficial task-page p7"><div class="hoje-head"><div><h2 class="hoje-title"><i class="ti ti-folders"></i>Projetos</h2><p class="hoje-sub">Por setor e status.</p></div><div class="hoje-toolbar"><button class="p7-novo" onclick="try{abrirModalNovoProjectPro()}catch(e){criarProjectPro()}"><i class="ti ti-plus"></i> Novo projeto</button></div></div>'+
   (L.length?chips+'<div class="p7s-cols">'+cols+'</div>':'<div class="h6s-vazio"><i class="ti ti-folders"></i><span>Nenhum projeto.</span></div>')+'</div>';}
function hook(){
  if(typeof window.render==='function'&&!window.render._p7){var r=window.render;window.render=function(){var x=r.apply(this,arguments);try{if(typeof currentTab!=='undefined'&&currentTab==='projetos-pro'&&!activeProjectProId&&!(typeof sidebarPersonId!=='undefined'&&sidebarPersonId))lista();}catch(e){console.error(e);}return x;};window.render._p7=1;}
  if(typeof window.abrirProjectProView==='function'&&!window.abrirProjectProView._p7){var a=window.abrirProjectProView;window.abrirProjectProView=function(id){var x=a.apply(this,arguments);try{if(window.hubPjTab)hubPjTab('quadro');}catch(e){}return x;};window.abrirProjectProView._p7=1;}
}
hook();window.addEventListener('load',function(){setTimeout(function(){hook();try{if(currentTab==='projetos-pro'&&!activeProjectProId)lista();}catch(e){}},750);});
})();
