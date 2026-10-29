/* hub-projeto6.js — projeto no modelo oficial do Hub: ETAPAS com tarefas numeradas (1.1, 1.2…), itens de checklist (1.1.1…),
   responsável por tarefa, Quadro por etapa e lista. A conversão é feita em memória a partir de fases>grupos(setor)>tarefaIds;
   NADA do original é apagado/alterado (os campos antigos ficam como estão) e nada é gravado por este arquivo. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nome(id){try{var p=_personById(id);return p?(p.name||p.nome):'';}catch(e){return '';}}
function T(){return (typeof tasks!=='undefined'&&tasks)||[];}
/* Converte (não destrutivo) o projeto do TaskFlow para o formato oficial de etapas. */
function migrar(p){var byId={};T().forEach(function(t){byId[t.id]=t;});var usados={};
  var fases=(p.fases||[]).slice().sort(function(a,b){return (a.ordem||0)-(b.ordem||0);});
  var etapas=fases.map(function(f,i){var ids=[];(f.grupos||[]).forEach(function(g){(g.tarefaIds||[]).forEach(function(id){if(ids.indexOf(id)<0)ids.push(id);});});
    T().forEach(function(t){if(t.projectProId===p.id&&t.projectProFaseId===f.id&&ids.indexOf(t.id)<0)ids.push(t.id);});
    var L=ids.map(function(id){return byId[id];}).filter(function(t){return t&&!t.deleted;});
    L.sort(function(a,b){var x=a.ppOrdem!=null?a.ppOrdem:1e9,y=b.ppOrdem!=null?b.ppOrdem:1e9;return x-y;});
    L.forEach(function(t){usados[t.id]=1;});
    var setor={};(f.grupos||[]).forEach(function(g){(g.tarefaIds||[]).forEach(function(id){setor[id]=g.setor||'';});});
    return {id:f.id,num:i+1,nome:String(f.nome||'Etapa').replace(/^\s*\d+[\.\)]\s*/,''),prazo:f.prazoFase||null,tarefas:L.map(function(t,j){return {num:(i+1)+'.'+(j+1),t:t,setor:setor[t.id]||t.setorManual||''};})};});
  var sem=T().filter(function(t){return !t.deleted&&!usados[t.id]&&(t.projectProId===p.id||t.projectId===p.id);}).map(function(t,j){return {num:'0.'+(j+1),t:t,setor:t.setorManual||''};});
  return {v:1,etapas:etapas,semEtapa:sem};}
window.hubMigrarProjetoOficial=migrar;
var F={q:'',st:'todas',et:'todas',pe:'todas',vis:'quadro',sem:true};
window.hubPjF=function(k,v){F[k]=v;if(window.hubPjTab)hubPjTab('quadro');};
function passa(x){var t=x.t;if(F.st==='abertas'&&t.done)return false;if(F.st==='concluidas'&&!t.done)return false;if(F.pe!=='todas'&&t.executor!==F.pe)return false;
  if(F.q){var s=(x.num+' '+t.title+' '+nome(t.executor)+' '+x.setor).toLowerCase();if(s.indexOf(F.q.toLowerCase())<0)return false;}return true;}
function itens(t){return (t.subtasks||[]).map(function(s){return typeof s==='string'?{text:s,done:false}:{text:s.text||s.title||s.nome||'',done:!!(s.done||s.feito)};});}
function card(x){var t=x.t,I=itens(t),ok=I.filter(function(i){return i.done;}).length,h=(typeof today!=='undefined'?today:''),late=!t.done&&t.date&&t.date<h;var id=JSON.stringify(t.id).replace(/"/g,'&quot;');
  return '<div class="p6-card'+(t.done?' done':'')+'" onclick="openEdit('+id+')"><div class="p6-card-top"><button class="p6-chk'+(t.done?' on':'')+'" title="Concluir" onclick="event.stopPropagation();toggle('+id+')"><i class="ti '+(t.done?'ti-check':'ti-circle')+'"></i></button><span class="p6-num">'+x.num+'</span><span class="p6-tit">'+esc(t.title)+'</span></div>'+
   (I.length?'<div class="p6-itens">'+I.slice(0,4).map(function(it,k){return '<div class="p6-item'+(it.done?' ok':'')+'"><i class="ti '+(it.done?'ti-square-check':'ti-square')+'"></i><span class="p6-num">'+x.num+'.'+(k+1)+'</span> '+esc(it.text)+'</div>';}).join('')+(I.length>4?'<div class="p6-item mais">+'+(I.length-4)+' itens</div>':'')+'</div>':'')+
   '<div class="p6-meta">'+(t.executor?'<span class="p6-resp"><span class="p6-av">'+esc((nome(t.executor)||'?').charAt(0))+'</span>'+esc(nome(t.executor))+'</span>':'<span class="p6-resp tt-muted">Sem responsável</span>')+(I.length?'<span><i class="ti ti-checklist"></i> '+ok+'/'+I.length+'</span>':'')+(t.date?'<span class="'+(late?'text-danger':'')+'"><i class="ti ti-calendar"></i> '+t.date.slice(8,10)+'/'+t.date.slice(5,7)+'</span>':'')+(x.setor?'<span class="p6-setor">'+esc(x.setor)+'</span>':'')+'</div></div>';}
function render(p){var M=migrar(p);p.hubOficial=M; // só em memória
  var todas=M.semEtapa.concat.apply(M.semEtapa,M.etapas.map(function(e){return e.tarefas;}));var vis=todas.filter(passa).length;
  var pes={};todas.forEach(function(x){if(x.t.executor)pes[x.t.executor]=1;});
  var sel=function(k,ops){return '<select class="p6-sel" onchange="hubPjF(\''+k+'\',this.value)">'+ops.map(function(o){return '<option value="'+esc(o[0])+'"'+(F[k]===o[0]?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>';};
  var bar='<div class="p6-bar"><div class="p6-busca"><i class="ti ti-search"></i><input placeholder="Pesquisar tarefa, pessoa ou etapa" value="'+esc(F.q)+'" onchange="hubPjF(\'q\',this.value)"></div>'+
    sel('st',[['todas','Todas'],['abertas','Abertas'],['concluidas','Concluídas']])+sel('et',[['todas','Todas as etapas']].concat(M.etapas.map(function(e){return [e.id,e.num+'. '+e.nome];})))+sel('pe',[['todas','Todas as pessoas']].concat(Object.keys(pes).map(function(id){return [id,nome(id)];})))+
    '<div class="p6-tg"><button class="'+(F.vis==='lista'?'on':'')+'" title="Lista" onclick="hubPjF(\'vis\',\'lista\')"><i class="ti ti-list"></i></button><button class="'+(F.vis==='quadro'?'on':'')+'" title="Quadro" onclick="hubPjF(\'vis\',\'quadro\')"><i class="ti ti-layout-kanban"></i></button></div>'+
    '<div class="p6-tg"><button class="'+(F.sem?'on':'')+'" onclick="hubPjF(\'sem\','+(!F.sem)+')"><i class="ti ti-inbox"></i> Sem etapa</button><button class="on"><i class="ti ti-stack-2"></i> Etapas</button></div>'+
    '<button class="p6-nova" onclick="try{setProjectProTab(\'fases\')}catch(e){}"><i class="ti ti-plus"></i> Nova etapa</button><span class="p6-cont">'+vis+' de '+todas.length+' tarefas</span></div>';
  var cols=[];if(F.sem)cols.push({num:'',nome:'Sem etapa',tarefas:M.semEtapa,id:'_sem'});M.etapas.forEach(function(e){if(F.et==='todas'||F.et===e.id)cols.push(e);});
  var corpo;
  if(F.vis==='lista'){corpo='<div class="p6-lista">'+cols.map(function(e){var L=e.tarefas.filter(passa);var dn=e.tarefas.filter(function(x){return x.t.done;}).length;
      return '<div class="p6-lg"><div class="p6-lg-h"><span class="p6-num">'+(e.num||'—')+'</span> '+esc(e.nome)+'<span class="p6-cnt">'+dn+'/'+e.tarefas.length+'</span></div>'+(L.length?'<table class="tk-table p6-tab"><thead><tr><th></th><th>Nº</th><th>Tarefa</th><th>Responsável</th><th>Itens</th><th>Prazo</th><th>Setor</th></tr></thead><tbody>'+L.map(function(x){var t=x.t,I=itens(t),id=JSON.stringify(t.id).replace(/"/g,'&quot;');return '<tr class="tk-trow'+(t.done?' tk-done':'')+'" onclick="openEdit('+id+')"><td onclick="event.stopPropagation();toggle('+id+')"><button class="p6-chk'+(t.done?' on':'')+'"><i class="ti '+(t.done?'ti-check':'ti-circle')+'"></i></button></td><td class="p6-num">'+x.num+'</td><td>'+esc(t.title)+'</td><td>'+esc(nome(t.executor)||'—')+'</td><td>'+(I.length?I.filter(function(i){return i.done;}).length+'/'+I.length:'—')+'</td><td>'+(t.date?t.date.slice(8,10)+'/'+t.date.slice(5,7):'—')+'</td><td>'+esc(x.setor||'—')+'</td></tr>';}).join('')+'</tbody></table>':'<div class="p6-vz">Nenhuma tarefa.</div>')+'</div>';}).join('')+'</div>';}
  else corpo='<div class="p6-board">'+cols.map(function(e){var L=e.tarefas.filter(passa);var dn=e.tarefas.filter(function(x){return x.t.done;}).length;
      return '<div class="p6-col"><div class="p6-col-h"><span>'+(e.num?'<span class="p6-num">'+e.num+'.</span> ':'')+esc(e.nome)+'</span><span class="p6-col-r"><i class="ti ti-checks"></i><span class="p6-cnt">'+dn+'/'+e.tarefas.length+'</span></span></div><div class="p6-col-b">'+L.map(card).join('')+'<div class="p6-add" onclick="try{setProjectProTab(\'tarefas\')}catch(e){}">+ Nova tarefa'+(e.num?' na etapa':' sem etapa')+'</div></div></div>';}).join('')+'</div>';
  return bar+corpo;}
window.hubProjetoOficialHTML=render;
})();
