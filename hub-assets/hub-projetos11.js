/* hub-projetos11.js — Fase 11: painel do projeto igual ao Hub oficial (projetos.js):
   abas Quadro · Linha do tempo · Pessoas · Anexos · Decisões · Informações · Chat; Quadro com zonas
   (Sem etapa / Pré-classificação / Etapas), post-its, grupos N.0/N.1 (gpNumeraTarefas), cadeado de bloqueio
   por predecessoras (bloqueada / entre_fases / requisito), chip de itens; visão lista; filtros; modal
   "Editar Tarefa" com Itens; modal "Novo Projeto". Dados: os do TaskFlow (projectsPro + tasks). */
(function(){
var W=window;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function T(){return (typeof tasks!=='undefined'&&tasks)||[];}
function P(){return (typeof projectsPro!=='undefined'&&projectsPro)||[];}
function pessoa(id){try{var p=_personById(id);return p?(p.name||p.nome||''):'';}catch(e){return '';}}
function PE(){try{return (typeof people!=='undefined'&&people)||[];}catch(e){return [];}}
function resp(t){return pessoa(t.executor)||t.hubResp||'';}
function fd(d){return d?String(d).slice(8,10)+'/'+String(d).slice(5,7):'';}
function hoje(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function q(id){return "'"+String(id).replace(/'/g,"\\'")+"'";}
function salvarT(t){try{saveTask_db(t);}catch(e){try{safeSetItem(LS_TASKS,JSON.stringify(tasks));}catch(_){}}}
function salvarP(p){try{saveProjectPro_db(p);}catch(e){}}
var S={tab:'quadro',q:'',st:'todas',et:'',pe:'',dens:'lista',sem:true,pre:true,eta:true,gz:'semana',gcol:{},gq:''};
W.hubP11=S;
/* ---------- modelo ---------- */
function modelo(p){var byId={};T().forEach(function(t){byId[t.id]=t;});var usados={};
  var fases=(p.fases||[]).slice().sort(function(a,b){return (a.ordem||0)-(b.ordem||0);});
  var et=fases.map(function(f,i){var ids=[];(f.grupos||[]).forEach(function(g){(g.tarefaIds||[]).forEach(function(id){if(ids.indexOf(id)<0)ids.push(id);});});
    T().forEach(function(t){if(t.projectProId===p.id&&t.projectProFaseId===f.id&&ids.indexOf(t.id)<0)ids.push(t.id);});
    var L=ids.map(function(id){return byId[id];}).filter(function(t){return t&&!t.deleted&&t.projectProId===p.id;});
    L.sort(function(a,b){return (a.ppOrdem!=null?a.ppOrdem:1e9)-(b.ppOrdem!=null?b.ppOrdem:1e9);});
    L.forEach(function(t){usados[t.id]=1;});
    return {id:f.id,f:f,ordem:i+1,nome:String(f.nome||'Etapa').replace(/^\s*\d+[\.\)]\s*/,''),tarefas:L};});
  var sem=T().filter(function(t){return !t.deleted&&!usados[t.id]&&t.projectProId===p.id;});
  et.forEach(function(e){e.nos=numera(e.tarefas,e.ordem);});
  var all=[];et.forEach(function(e){e.nos.forEach(function(n){n.etapa=e;all.push(n);});});
  var idx={};all.forEach(function(n){idx[n.t.id]=n;});
  all.forEach(function(n){n.bloq=bloqueada(n,idx,et);});
  return {etapas:et,sem:sem.map(function(t){return {t:t,numero:'',agrupada:false,grupoId:null};}),pre:sem.filter(function(t){return t.hubPre;}),all:all,idx:idx};}
/* gpNumeraTarefas (projetos.js): âncora + membros (grupo_com) => N.0, N.1… */
function numera(L,pref){var ids={};L.forEach(function(t){ids[t.id]=1;});var mem={},pos=[];
  L.forEach(function(t){var g=t.hubGrupoCom;if(g&&ids[g]){(mem[g]=mem[g]||[]).push(t);return;}pos.push(t);});
  var nos=[];pos.forEach(function(a,i){var n=(pref?pref+'.':'')+(i+1);var m=mem[a.id]||[];
    if(!m.length){nos.push({t:a,numero:n,agrupada:false,grupoId:null});return;}
    nos.push({t:a,numero:n+'.0',agrupada:true,grupoId:a.id});m.forEach(function(f,j){nos.push({t:f,numero:n+'.'+(j+1),agrupada:true,grupoId:a.id});});});
  return nos;}
/* bloqueio: predecessoras explícitas (hubPred) ou, sem elas, a cadeia da etapa (a anterior que não está agrupada) */
function bloqueada(n,idx,et){var t=n.t;if(t.done)return null;var esp=[];
  if(t.hubPred&&t.hubPred.length){t.hubPred.forEach(function(p){var o=idx[p.id];if(o&&!o.t.done)esp.push(o.t.title);});return esp.length?esp:null;}
  if(t.hubPred)return null;
  try{if(typeof _ppEstaBloqueada==='function'&&_ppEstaBloqueada(t))return ['tarefa anterior'];}catch(e){}
  return null;}
function itens(t){return (t.subtasks||[]).map(function(s){return typeof s==='string'?{title:s,done:false}:s;});}
function chipItens(t){var I=itens(t);if(!I.length)return '';var f=I.filter(function(i){return i.done;}).length,c=f>=I.length;
  return '<button type="button" class="tk-chip tk-itens-chip'+(c?' is-completo':'')+'" title="Itens respondidos: '+f+' de '+I.length+'" onclick="event.stopPropagation();hubP11Tarefa('+q(t.id)+')"><i class="ti '+(c?'ti-list-check':'ti-list-details')+'"></i>'+f+'/'+I.length+'<span class="tk-itens-barra" style="--p:'+Math.round(f*100/I.length)+'%"></span></button>';}
function estado(n,solta){if(solta)return '';var t=n.t;if(t.done)return '<i class="ti ti-circle-check gp-estado gp-estado-feita" title="Concluída"></i>';
  if(n.bloq)return '<i class="ti ti-lock gp-estado gp-estado-bloqueada" title="'+esc('Bloqueada — aguardando: '+n.bloq.join(', '))+'"></i>';
  return '<i class="ti ti-lock-open gp-estado gp-estado-liberada" title="Liberada — pode ser feita agora"></i>';}
function dataTxt(t){return t.dataInicio?fd(t.dataInicio)+(t.date?' → '+fd(t.date):''):(t.date?fd(t.date):'');}
function desc(t){var d=(t.desc||'').replace(/^\s*\[[ xX]\]\s*/gm,'').trim();if(!d&&itens(t).length)d=itens(t).map(function(i){return i.title;}).join('\n');return d;}
function passa(n){var t=n.t;if(S.st==='abertas'&&t.done)return false;if(S.st==='concluidas'&&!t.done)return false;
  if(S.pe&&(t.executor||('txt:'+(t.hubResp||'')))!==S.pe)return false;
  if(S.q){var s=((n.numero||'')+' '+t.title+' '+resp(t)+' '+(n.etapa?n.etapa.nome:'')).toLowerCase();if(s.indexOf(S.q.toLowerCase())<0)return false;}return true;}
function nota(n,solta){var t=n.t,membro=n.agrupada&&n.grupoId!==t.id,eu=!solta&&t.executor===W.CURRENT_USER_ID&&!t.done&&!n.bloq,d=dataTxt(t),ds=desc(t);
  return '<div class="gp-postit'+(t.done?' feita':'')+(n.bloq?' bloqueada':'')+(eu?' gp-minha-vez':'')+(n.agrupada?' gp-postit-filha':'')+(membro?' gp-postit-membro':'')+(passa(n)?'':' d-none')+'" data-id="'+esc(t.id)+'" title="'+esc(t.title+' — '+(resp(t)||'Sem executor')+(n.bloq?' (aguardando a tarefa anterior)':''))+'" onclick="hubP11Tarefa('+q(t.id)+')">'+
   '<i class="ti ti-grip-horizontal gp-postit-alca" title="Arrastar"></i><div class="gp-postit-titulo" role="button" tabindex="0">'+estado(n,solta)+(solta?'':chipItens(t))+
   (n.numero?'<span class="gp-postit-num">'+n.numero+'</span> ':'')+esc(t.title)+(eu?' <span class="gp-vez-chip"><i class="ti ti-player-play"></i> Sua vez</span>':'')+'</div>'+
   (ds?'<div class="gp-postit-desc">'+esc(ds)+'</div>':'')+(solta?'':'<div class="gp-postit-rodape"><span class="gp-postit-pessoa"><i class="ti ti-user"></i> '+esc(resp(t)||'Sem executor')+'</span>'+(d?'<span class="gp-postit-data"><i class="ti ti-calendar-event"></i> '+d+'</span>':'')+'</div>')+'</div>';}
function linha(n,ant,solta){var t=n.t,r=resp(t),membro=n.agrupada&&n.grupoId!==t.id;
  var data=(!n.bloq&&(t.dataInicio||t.date))?'<span class="tk-chip rd-task-due gp-task-badge gp-opc-data">'+dataTxt(t)+'</span>':((n.bloq&&(t.dataInicio||t.date))?'<span class="tk-chip rd-task-due gp-task-badge gp-opc-data gp-task-prevista" title="Planejado — recalculado quando a tarefa anterior concluir">'+dataTxt(t)+'</span>':'<span class="gp-opc-data"></span>');
  var req=(t.hubPred||[]).some(function(p){return p.modo==='requisito';});
  return '<div class="rd-task gp-task gp-postit gp-postit-lista'+(membro?' gp-postit-membro':'')+(t.done?' rd-task-done':'')+(n.bloq?' gp-task-bloqueada':'')+(n.agrupada?' gp-task-filha':'')+(passa(n)?'':' d-none')+'" data-id="'+esc(t.id)+'">'+
   '<i class="ti ti-grip-vertical gp-task-alca" draggable="true" title="Arrastar para reordenar"></i>'+(n.numero?'<span class="gp-task-num">'+n.numero+'</span>':'')+estado(n,solta)+
   '<span class="rd-task-title js-gp-abre-tarefa gp-task-titulo" role="button" tabindex="0" onclick="hubP11Tarefa('+q(t.id)+')">'+esc(t.title)+'</span>'+chipItens(t)+
   '<span class="gp-task-opcoes">'+(solta?'':
    '<span class="rd-badge gp-task-badge gp-opc-exec'+(r?'':' rd-badge-vago')+' js-gp-troca-exec" role="button" tabindex="0" title="Clique para atribuir a tarefa" onclick="hubP11Tarefa('+q(t.id)+')">'+esc(r||'Sem executor')+'</span>'+data+
    '<span class="gp-task-duracao" title="Quantos dias esta tarefa leva"><input type="number" class="js-gp-duracao" min="1" max="3650" placeholder="dias"'+(t.hubDuracao?' value="'+esc(t.hubDuracao)+'"':'')+' onchange="hubP11Dur('+q(t.id)+',this.value)"></span>'+
    '<span class="gp-task-pred gp-opc-pred">'+(ant?'<i class="ti ti-link gp-pred-ico js-gp-encadear'+(membro?' ativo':'')+'" role="button" tabindex="0" title="'+esc(membro?'Desencadear — volta a esperar \''+ant.title+'\' concluir':'Encadear com \''+ant.title+'\' — libera junto, sem esperar ela concluir')+'" onclick="hubP11Encadear('+q(t.id)+')"></i>':'')+'</span>'+
    '<span class="gp-task-pred gp-opc-pred"><i class="ti ti-arrow-fork gp-fila-ico js-gp-nao-bloqueia" role="button" title="Liberar Fila (Tarefas após não dependem dessa para prosseguir)"></i></span>'+
    '<span class="gp-task-pred gp-opc-pred"><i class="ti ti-list-check gp-req-ico js-gp-requisitos'+(req?' ativo':'')+'" role="button" title="Pré-requisitos — tarefas que também precisam estar concluídas para esta liberar"></i></span>'+
    (!n.agrupada||!membro?'<button type="button" class="gp-task-sai-etapa gp-opc-sai js-gp-tarefa-sai-etapa" title="Tirar da etapa — volta para Sem etapa" onclick="hubP11Etapa('+q(t.id)+',\'\');hubP11Desenhar()"><i class="ti ti-corner-left-up"></i></button>':'<span class="gp-opc-sai"></span>'))+
   '<button type="button" class="gp-task-excluir gp-opc-excluir js-gp-tarefa-excluir" title="Excluir tarefa" onclick="hubP11Excluir('+q(t.id)+')"><i class="ti ti-trash"></i></button></span></div>';}
function zona(z,M){var L=S.dens==='lista';var vis=0;
  var notas=z.nos.map(function(n,i){if(passa(n))vis++;var h=L?linha(n,i>0?z.nos[i-1].t:null,z.solta):nota(n,z.solta);if(!n.agrupada)return h;
    var abre=n.grupoId===n.t.id,pr=z.nos[i+1],fecha=!pr||!pr.agrupada||pr.grupoId!==n.grupoId;
    return (abre?'<div class="gp-grupo"><div class="gp-grupo-rotulo"><i class="ti ti-link"></i></div><div class="gp-grupo-corpo">':'')+h+(fecha?'</div></div>':'');}).join('');
  var dn=z.nos.filter(function(n){return n.t.done;}).length;
  return '<section class="gp-zona gp-cor-'+z.cor+(z.extra||'')+'" data-zona-key="'+esc(z.key)+'"'+(z.solta?' data-solta="1"':'')+(S.et&&z.ordem&&S.et!==z.key?' hidden':'')+'>'+
   '<header class="gp-zona-cab">'+(z.ordem?'<span class="gp-fase-ordem" title="Ordem da etapa">'+z.ordem+'</span>':'')+(z.pre?'<i class="ti ti-stack-2 gp-pre-icone"></i>':'')+
   '<span class="gp-zona-nome" title="'+esc(z.nome)+'">'+esc(z.nome)+'</span>'+
   (z.ordem?'<span class="gp-fase-cab-acoes"><button type="button" title="Renomear etapa" onclick="hubP11RenEtapa('+q(z.key)+')"><i class="ti ti-pencil"></i></button><button type="button" title="Excluir etapa" onclick="hubP11DelEtapa('+q(z.key)+')"><i class="ti ti-trash"></i></button></span>':'')+
   '<button type="button" class="gp-zona-sel" title="Selecionar / desmarcar as notas visíveis desta área"><i class="ti ti-checks"></i></button><span class="gp-zona-qtd">'+(z.solta?vis:z.nos.length)+'</span></header>'+
   (z.solta?'<input type="text" class="form-control form-control-sm gp-zona-nova" placeholder="'+(z.pre?'+ Nova tarefa pré-classificada (Enter)':'+ Nova tarefa sem etapa (Enter)')+'" maxlength="255" onkeydown="if(event.key===\'Enter\'&&this.value.trim())hubP11NovaSolta(this.value.trim(),'+(z.pre?1:0)+')">':'')+
   '<div class="gp-zona-corpo">'+notas+'</div></section>';}
function sel(k,ops){return '<select class="form-select form-select-sm" onchange="hubP11F(\''+k+'\',this.value)">'+ops.map(function(o){return '<option value="'+esc(o[0])+'"'+(S[k]===o[0]?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>';}
function quadro(p){var M=modelo(p);var pes={};M.all.concat(M.sem).forEach(function(n){var t=n.t;if(t.executor)pes[t.executor]=pessoa(t.executor)||t.executor;else if(t.hubResp)pes['txt:'+t.hubResp]=t.hubResp;});
  var tot=M.all.length+M.sem.length,vis=M.all.concat(M.sem).filter(passa).length;
  var bar='<div class="gp-mural-barra"><div class="gp-mural-busca"><i class="ti ti-search"></i><input type="search" class="form-control form-control-sm" placeholder="Pesquisar tarefa, pessoa ou etapa" value="'+esc(S.q)+'" oninput="hubP11Busca(this.value)"></div>'+
   sel('st',[['todas','Todas'],['abertas','Abertas'],['concluidas','Concluídas']])+sel('et',[['','Todas as etapas'],['sem','Sem etapa']].concat(M.etapas.map(function(e){return [e.id,e.ordem+'. '+e.nome];})))+
   sel('pe',[['','Todas as pessoas']].concat(Object.keys(pes).sort(function(a,b){return pes[a].localeCompare(pes[b]);}).map(function(k){return [k,pes[k]];})))+
   '<div class="btn-group btn-group-sm gp-mural-dens" role="group"><button type="button" class="btn btn-outline-secondary js-gp-mural-dens'+(S.dens==='lista'?' active':'')+'" data-dens="compacto" title="Lista" onclick="hubP11F(\'dens\',\'lista\')"><i class="ti ti-list"></i></button><button type="button" class="btn btn-outline-secondary js-gp-mural-dens'+(S.dens!=='lista'?' active':'')+'" data-dens="completo" title="Cartões" onclick="hubP11F(\'dens\',\'cartoes\')"><i class="ti ti-layout-grid"></i></button></div>'+
   '<div class="btn-group btn-group-sm gp-mural-paineis" role="group"><button type="button" class="btn btn-outline-secondary js-gp-painel'+(S.sem?' active':'')+'" data-painel="sem" title="Mostrar/ocultar Sem etapa" onclick="hubP11F(\'sem\','+(!S.sem)+')"><i class="ti ti-inbox"></i> Sem etapa</button><button type="button" class="btn btn-outline-secondary js-gp-painel'+(S.pre?' active':'')+'" data-painel="pre" title="Mostrar/ocultar Pré-classificação" onclick="hubP11F(\'pre\','+(!S.pre)+')"><i class="ti ti-stack-2"></i> Pré-classificação</button><button type="button" class="btn btn-outline-secondary js-gp-painel'+(S.eta?' active':'')+'" data-painel="etapas" title="Mostrar/ocultar Etapas" onclick="hubP11F(\'eta\','+(!S.eta)+')"><i class="ti ti-layout-columns"></i> Etapas</button></div>'+
   '<input type="text" class="form-control form-control-sm gp-nova-etapa" placeholder="+ Nova etapa (Enter)" maxlength="120" onkeydown="if(event.key===\'Enter\'&&this.value.trim())hubP11NovaEtapa(this.value.trim())">'+
   '<span class="gp-mural-contagem">'+vis+' de '+tot+' tarefas</span></div>';
  var Z=[{key:'sem',nome:'Sem etapa',solta:true,cor:'neutro',extra:' gp-pilha',nos:M.sem.filter(function(n){return !n.t.hubPre;})},{key:'pre',nome:'Pré-classificação',solta:true,pre:1,cor:'pre',extra:' gp-pre',nos:M.sem.filter(function(n){return n.t.hubPre;})}];
  var et=M.etapas.map(function(e){return {key:e.id,nome:e.nome,cor:'amarelo',ordem:e.ordem,nos:e.nos};});
  return bar+'<div class="gp-quadro js-gp-mural'+(S.dens==='lista'?' gp-mural-compacto':'')+(S.sem?'':' gp-oculta-sem')+(S.pre?'':' gp-oculta-pre')+(S.eta?'':' gp-oculta-etapas')+'">'+zona(Z[0])+zona(Z[1])+'<div class="gp-etapas">'+et.map(zona).join('')+'</div></div>';}
/* ---------- Linha do tempo (Gantt) ---------- */
function addD(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function dias(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}
var MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function linhaTempo(p){var M=modelo(p),H=hoje();var px=S.gz==='dia'?36:S.gz==='mes'?5:14;
  var datas=[];M.all.forEach(function(n){var t=n.t;if(t.dataInicio)datas.push(t.dataInicio);if(t.date)datas.push(t.date);});datas.push(H);if(p.prazoInicio)datas.push(p.prazoInicio);
  datas.sort();var ini=addD(datas[0],-7),fim=addD(datas[datas.length-1],60);var w0=new Date(ini+'T12:00:00');ini=addD(ini,-((w0.getDay()+6)%7));var nd=dias(ini,fim);
  var atual=M.etapas.find(function(e){return e.nos.some(function(n){return !n.t.done;});})||M.etapas[M.etapas.length-1];
  var tot=M.all.length,ok=M.all.filter(function(n){return n.t.done;}).length,pc=tot?Math.round(ok*100/tot):0;
  var adn=atual?atual.nos.filter(function(n){return n.t.done;}).length:0;
  var cab='<div class="p11-gt-top"><div class="gp-gt-onde"><i class="ti ti-map-pin"></i> Etapa atual: <b>'+(atual?atual.ordem+'. '+esc(atual.nome)+' ('+adn+'/'+atual.nos.length+')':'—')+'</b><span class="gp-gt-progresso"><span style="width:'+pc+'%"></span></span><span class="gp-gt-pct">'+pc+'%</span></div>'+
   '<div class="p11-gt-acoes"><input class="form-control form-control-sm" placeholder="Buscar executor..." value="'+esc(S.gq)+'" oninput="hubP11GQ(this.value)"><div class="btn-group btn-group-sm">'+['dia','semana','mes'].map(function(z){return '<button class="btn'+(S.gz===z?' active':'')+'" onclick="hubP11F(\'gz\',\''+z+'\')">'+{dia:'Dia',semana:'Semana',mes:'Mês'}[z]+'</button>';}).join('')+'</div><button class="btn btn-sm" onclick="hubP11Recolher()"><i class="ti ti-fold"></i> Recolher etapas</button><button class="btn btn-sm" onclick="document.querySelector(\'.p11-gt-scroll\').scrollLeft='+Math.max(0,dias(ini,H)*px-200)+'"><i class="ti ti-calendar"></i> Hoje</button></div></div>'+
   '<div class="p11-gt-leg"><span class="lg st-todo">A Fazer</span><span class="lg st-doing">Em Andamento</span><span class="lg st-pause">Pausado</span><span class="lg st-waiting">Aguardando</span><span class="lg st-executed">Executada</span><span class="lg st-done">Concluído</span><span class="lg st-late">Atrasada</span><span class="lg st-prev">Previsão (sem data marcada)</span></div>';
  var meses='',sem='';var d=ini;var mStart=0;var last=null;
  for(var i=0;i<=nd;i++){var dd=addD(ini,i);var m=dd.slice(0,7);if(m!==last){if(last)meses+='<div class="p11-gt-mes" style="left:'+mStart*px+'px;width:'+(i-mStart)*px+'px">'+MES[+last.slice(5,7)-1]+'</div>';last=m;mStart=i;}
    if(S.gz==='dia')sem+='<div class="p11-gt-sem" style="left:'+i*px+'px;width:'+px+'px">'+dd.slice(8,10)+'</div>';
    else if(i%7===0){var e2=addD(dd,6);sem+='<div class="p11-gt-sem" style="left:'+i*px+'px;width:'+7*px+'px">'+(S.gz==='mes'?dd.slice(8,10):dd.slice(8,10)+' - '+e2.slice(8,10))+'</div>';}}
  meses+='<div class="p11-gt-mes" style="left:'+mStart*px+'px;width:'+(nd+1-mStart)*px+'px">'+MES[+last.slice(5,7)-1]+'</div>';
  var hx=dias(ini,H)*px;var rows='';var y=0;
  M.etapas.forEach(function(e){var col=!!S.gcol[e.id];var edn=e.nos.filter(function(n){return n.t.done;}).length;
    rows+='<div class="p11-gt-row p11-gt-etapa" onclick="hubP11Col('+q(e.id)+')"><span class="p11-gt-etq">'+(col?'▸':'▾')+' '+e.ordem+'. '+esc(e.nome)+' · '+edn+'/'+e.nos.length+'</span></div>';
    if(col)return;var prevFim=null;
    e.nos.forEach(function(n){var t=n.t;if(S.gq&&resp(t).toLowerCase().indexOf(S.gq.toLowerCase())<0)return;
      var a=t.dataInicio||null,b=t.date||null,prev=false;if(!a&&!b){a=prevFim||p.prazoInicio||H;b=addD(a,Math.max(1,(t.hubDuracao||2)));prev=true;}else if(!a)a=addD(b,-Math.max(1,t.hubDuracao||1));else if(!b)b=addD(a,Math.max(1,t.hubDuracao||1));
      prevFim=b;var st=t.done?'st-done':(prev?'st-prev':(b<H?'st-late':(n.bloq?'st-todo':'st-todo')));
      var L=dias(ini,a)*px,Wd=Math.max(px,dias(a,b)*px);
      rows+='<div class="p11-gt-row"><div class="p11-gt-bar '+st+'" style="left:'+L+'px;width:'+Wd+'px" title="'+esc(n.numero+' '+t.title+' — '+(resp(t)||'Sem executor')+' ('+fd(a)+' → '+fd(b)+')')+'" onclick="hubP11Tarefa('+q(t.id)+')">'+(t.done&&Wd>t.title.length*6?esc(t.title):'')+'</div>'+(t.done&&Wd>t.title.length*6?'':'<span class="p11-gt-lbl" style="left:'+(L+Wd+6)+'px">'+esc(t.title)+'</span>')+'</div>';});});
  return cab+'<div class="p11-gt-scroll"><div class="p11-gt" style="width:'+(nd+1)*px+'px"><div class="p11-gt-h1">'+meses+'</div><div class="p11-gt-h2">'+sem+'<div class="p11-gt-hojelbl" style="left:'+(hx-30)+'px">'+fd(H)+'</div></div><div class="p11-gt-body">'+rows+'<div class="p11-gt-hoje" style="left:'+hx+'px"></div></div></div></div>';}
/* ---------- abas simples ---------- */
function pessoas(p){var M=modelo(p),c={};M.all.concat(M.sem).forEach(function(n){var r=resp(n.t)||'Sem executor';c[r]=c[r]||[0,0];c[r][1]++;if(n.t.done)c[r][0]++;});
  var ks=Object.keys(c).sort(function(a,b){return a.localeCompare(b);});
  return ks.length?'<div class="p11-lista">'+ks.map(function(k){return '<div class="gp-pessoa-card"><span class="gp-pessoa-nome"><i class="ti ti-user"></i> '+esc(k)+'</span><span class="gp-pessoa-contagem">'+c[k][0]+'/'+c[k][1]+' concluídas</span></div>';}).join('')+'</div>':vazio('ti-users','Nenhuma pessoa com tarefa neste projeto.');}
function vazio(ic,t,extra){return '<div class="gp-gt-vazio p11-vazio"><i class="ti '+ic+'"></i><div>'+t+'</div>'+(extra||'')+'</div>';}
function anexos(p){var A=[];T().forEach(function(t){if(t.projectProId===p.id)(t.anexos||t.attachments||[]).forEach(function(a){A.push({a:a,t:t});});});(p.anexos||[]).forEach(function(a){A.push({a:a});});
  return A.length?'<div class="p11-lista">'+A.map(function(x){var n=x.a.nome||x.a.name||'anexo';return '<div class="gp-anexo"><i class="ti ti-paperclip"></i><div class="gp-anexo-corpo"><div class="gp-anexo-nome">'+esc(n)+'</div><div class="gp-anexo-meta">'+(x.t?'<span class="gp-anexo-origem">Tarefa: '+esc(x.t.title)+'</span>':'Projeto')+'</div></div></div>';}).join('')+'</div>':vazio('ti-paperclip','Nenhum anexo neste projeto.','<div class="text-secondary small">Anexos enviados nas tarefas aparecem aqui.</div>');}
function decisoes(p){var D=p.decisoes||[];
  var form='<div class="gp-dec-form"><div class="gp-dec-form-titulo">Registrar decisão</div><div class="gp-dec-form-sub">O que foi decidido, por quem e por quê.</div><textarea class="form-control form-control-sm" id="p11-dec" rows="2" placeholder="Decisão..."></textarea><div class="gp-dec-form-acoes"><button class="btn btn-sm btn-primary" onclick="hubP11Dec()"><i class="ti ti-check"></i> Registrar</button></div></div>';
  return form+(D.length?'<div class="p11-lista">'+D.slice().reverse().map(function(d){return '<div class="gp-dec"><div class="gp-dec-cab"><i class="ti ti-gavel"></i> <span class="gp-dec-resumo">'+esc(d.texto)+'</span></div><div class="gp-dec-meta">'+esc(d.por||'')+' · '+esc(d.em||'')+'</div></div>';}).join('')+'</div>':vazio('ti-gavel','Nenhuma decisão registrada neste projeto.'));}
var STS=[['planejamento','Planejamento'],['andamento','Em andamento'],['ativo','Em andamento (ativo)'],['pausado','Pausado'],['concluido','Concluído'],['arquivado','Arquivado']];
function info(p){var pes=PE();var op=function(v,blank){return (blank?'<option value="">'+blank+'</option>':'')+pes.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===v?' selected':'')+'>'+esc(x.name)+'</option>';}).join('');};
  var L=function(l,h){return '<div class="gp-info-linha"><div class="gp-info-label">'+l+'</div><div class="gp-info-valor">'+h+'</div></div>';};
  var ch=function(k,v){return 'hubP11Info('+q(p.id)+',\''+k+'\','+v+')';};
  var ed=(p.hubEditores||[]).map(function(n){return '<span class="tk-chip p11-chip">'+esc(n)+'</span>';}).join(' ');
  return '<div class="p11-info">'+L('Nome','<input class="gp-info-input" value="'+esc(p.nome)+'" onchange="'+ch('nome','this.value')+'">')+
   L('Status','<select class="gp-info-input" onchange="'+ch('status','this.value')+'">'+STS.map(function(s){return '<option value="'+s[0]+'"'+(p.status===s[0]?' selected':'')+'>'+s[1]+'</option>';}).join('')+'</select>')+
   L('Tipo','<select class="gp-info-input" onchange="'+ch('tipo','this.value')+'">'+[['produto','Projeto'],['processo','Processo'],['outro','Outro']].map(function(s){return '<option value="'+s[0]+'"'+(p.tipo===s[0]?' selected':'')+'>'+s[1]+'</option>';}).join('')+'</select>')+
   L('Descrição','<textarea class="gp-info-input" rows="2" onchange="'+ch('descricao','this.value')+'">'+esc(p.descricao||'')+'</textarea>')+
   L('Início','<input type="date" class="gp-info-input" value="'+esc(p.prazoInicio||'')+'" onchange="'+ch('prazoInicio','this.value||null')+'">')+
   L('Prazo','<input type="date" class="gp-info-input" value="'+esc(p.prazoFim||'')+'" onchange="'+ch('prazoFim','this.value||null')+'">')+
   L('Dono','<select class="gp-info-input" onchange="'+ch('dono','this.value')+'">'+op(p.dono)+'</select>')+
   L('Coordenador','<select class="gp-info-input" onchange="'+ch('coordenador','this.value||null')+'">'+op(p.coordenador,'Buscar pessoa...')+'</select>'+((p.hubCoordenadores||[])[0]&&!p.coordenador?'<div class="small text-secondary">'+esc(p.hubCoordenadores[0])+'</div>':''))+
   L('Coordenador 2','<select class="gp-info-input" onchange="'+ch('coordenador2','this.value||null')+'">'+op(p.coordenador2,'Buscar pessoa...')+'</select>'+((p.hubCoordenadores||[])[1]&&!p.coordenador2?'<div class="small text-secondary">'+esc(p.hubCoordenadores[1])+'</div>':''))+
   L('Editores',ed||'<span class="text-secondary">—</span>')+L('Criado por',esc(p.hubCriadoPor||pessoa(p.dono)||'—'))+L('Criado em',esc(p.criadoEm?String(p.criadoEm).slice(8,10)+'/'+String(p.criadoEm).slice(5,7)+'/'+String(p.criadoEm).slice(0,4):'—'))+'</div>';}
function chat(p){var C=p.hubChat||[];
  return '<div class="p11-chat"><div class="p11-chat-msgs">'+(C.length?C.map(function(m){return '<div class="p11-msg"><b>'+esc(m.por)+'</b> <span class="text-secondary small">'+esc(m.em)+'</span><div>'+esc(m.texto)+'</div></div>';}).join(''):'<div class="text-secondary small p-2">Nenhuma mensagem ainda.</div>')+'</div>'+
   '<div class="p11-chat-in"><textarea class="form-control form-control-sm" id="p11-chat" rows="2" placeholder="Escreva uma mensagem..." onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();hubP11Chat()}"></textarea><button class="btn btn-sm btn-primary" onclick="hubP11Chat()"><i class="ti ti-send"></i> Enviar</button></div></div>';}
/* ---------- shell ---------- */
var ABAS=[['quadro','ti-layout-kanban','Quadro'],['linha','ti-timeline','Linha do tempo'],['pessoas','ti-users','Pessoas'],['anexos','ti-paperclip','Anexos'],['decisoes','ti-gavel','Decisões'],['informacoes','ti-info-circle','Informações'],['chat','ti-messages','Chat']];
function proj(){var id=typeof activeProjectProId!=='undefined'?activeProjectProId:null;return P().find(function(p){return p.id===id;});}
function desenhar(){var tc=document.getElementById('task-container');var p=proj();if(!tc||!p)return;
  var corpo=S.tab==='linha'?linhaTempo(p):S.tab==='pessoas'?pessoas(p):S.tab==='anexos'?anexos(p):S.tab==='decisoes'?decisoes(p):S.tab==='informacoes'?info(p):S.tab==='chat'?chat(p):quadro(p);
  tc.innerHTML='<div class="p11-pj hub-oficial" data-tab="'+S.tab+'"><div class="modal-header p11-head"><h5 class="modal-title p11-tit"><i class="ti ti-file"></i> '+esc(p.nome)+'</h5><button type="button" class="btn btn-sm btn-outline-secondary p11-modelo" title="Salvar como modelo" onclick="hubP11Modelo()"><i class="ti ti-template"></i> Salvar como modelo</button><button type="button" class="p11-x" title="Fechar" aria-label="Fechar" onclick="voltarParaProjetosPro()"><i class="ti ti-x"></i></button></div><div class="modal-body p11-body">'+
   '<div class="tk-tabs p11-tabs" role="tablist">'+ABAS.map(function(a){return '<button type="button" class="tk-tab'+(S.tab===a[0]?' active':'')+'" onclick="hubPjTab(\''+a[0]+'\')"><i class="ti '+a[1]+'"></i> '+a[2]+'</button>';}).join('')+'</div>'+
   '<div class="gp-pane active p11-pane" data-gp-pane="'+S.tab+'">'+corpo+'</div></div></div>';
  document.body.classList.add('p11-on');
  var tt=document.getElementById('tab-title');if(tt)tt.style.display='none';var ts=document.getElementById('tab-sub');if(ts)ts.style.display='none';var pa=document.getElementById('pp-header-actions');if(pa)pa.style.display='none';}
W.hubP11Desenhar=desenhar;
W.hubPjTab=function(k){S.tab=k==='info'?'informacoes':k;desenhar();};
W.hubP11F=function(k,v){S[k]=v;desenhar();};
var bt;W.hubP11Busca=function(v){S.q=v;clearTimeout(bt);bt=setTimeout(function(){var el=document.activeElement;desenhar();var i=document.querySelector('.gp-mural-busca input');if(i){i.focus();i.setSelectionRange(v.length,v.length);}},250);};
W.hubP11GQ=function(v){S.gq=v;clearTimeout(bt);bt=setTimeout(function(){desenhar();var i=document.querySelector('.p11-gt-acoes input');if(i){i.focus();i.setSelectionRange(v.length,v.length);}},300);};
W.hubP11Col=function(id){S.gcol[id]=!S.gcol[id];desenhar();};
W.hubP11Recolher=function(){var p=proj();var all=(p.fases||[]).every(function(f){return S.gcol[f.id];});(p.fases||[]).forEach(function(f){S.gcol[f.id]=!all;});desenhar();};
function tk(id){return T().find(function(t){return String(t.id)===String(id);});}
W.hubP11Dur=function(id,v){var t=tk(id);if(!t)return;t.hubDuracao=v?+v:null;salvarT(t);};
W.hubP11Encadear=function(id){var t=tk(id),p=proj();if(!t||!p)return;var M=modelo(p);var n=M.idx[t.id];if(!n)return;var L=n.etapa.nos;var i=L.indexOf(n);if(i<1)return;
  if(t.hubGrupoCom){delete t.hubGrupoCom;}else{var a=L[i-1];t.hubGrupoCom=a.grupoId||a.t.id;}salvarT(t);desenhar();};
W.hubP11Excluir=function(id){var t=tk(id);if(!t)return;if(!confirm('Excluir a tarefa "'+t.title+'"?'))return;var p=proj();if(p){(p.fases||[]).forEach(function(f){(f.grupos||[]).forEach(function(g){g.tarefaIds=(g.tarefaIds||[]).filter(function(x){return x!==t.id;});});});salvarP(p);}T().forEach(function(o){if(o.hubGrupoCom===t.id){delete o.hubGrupoCom;salvarT(o);}});try{deleteTask_db(t.id);}catch(e){t.deleted=true;salvarT(t);}fecharModal();desenhar();};
W.hubP11NovaEtapa=function(nome){var p=proj();if(!p)return;p.fases=p.fases||[];var id='fase_'+Date.now();p.fases.push({id:id,nome:nome,ordem:p.fases.length+1,prazoFase:null,grupos:[{id:id+'_g',setor:'',tarefaIds:[]}]});salvarP(p);desenhar();};
W.hubP11RenEtapa=function(fid){var p=proj();var f=(p.fases||[]).find(function(x){return x.id===fid;});if(!f)return;var n=prompt('Nome da etapa',String(f.nome).replace(/^\s*\d+[\.\)]\s*/,''));if(n&&n.trim()){f.nome=n.trim();salvarP(p);desenhar();}};
W.hubP11DelEtapa=function(fid){var p=proj();var f=(p.fases||[]).find(function(x){return x.id===fid;});if(!f)return;if(!confirm('Excluir a etapa "'+f.nome+'"? As tarefas dela voltam para "Sem etapa".'))return;
  T().forEach(function(t){if(t.projectProId===p.id&&t.projectProFaseId===fid){t.projectProFaseId=null;t.projectProGrupoId=null;salvarT(t);}});p.fases=p.fases.filter(function(x){return x.id!==fid;});p.fases.forEach(function(x,i){x.ordem=i+1;});salvarP(p);desenhar();};
function novaTask(o){var t=Object.assign({id:Date.now(),title:'',done:false,prio:'media',tags:[],people:[],subtasks:[],escopo:'klain',createdAt:hoje(),kanbanCol:'todo',executor:null,date:null,hubPred:[]},o);tasks.push(t);salvarT(t);return t;}
W.hubP11NovaSolta=function(tit,pre){var p=proj();novaTask({title:tit,projectProId:p.id,projectProFaseId:null,hubPre:!!pre});desenhar();};
W.hubP11Info=function(pid,k,v){var p=P().find(function(x){return x.id===pid;});if(!p)return;p[k]=v;salvarP(p);if(k==='nome')desenhar();};
function quem(){return pessoa(W.CURRENT_USER_ID)||'Você';}
function agora(){var d=new Date();return d.toLocaleDateString('pt-BR')+' '+d.toTimeString().slice(0,5);}
W.hubP11Dec=function(){var el=document.getElementById('p11-dec');var p=proj();if(!el||!el.value.trim())return;(p.decisoes=p.decisoes||[]).push({texto:el.value.trim(),por:quem(),em:agora()});salvarP(p);desenhar();};
W.hubP11Chat=function(){var el=document.getElementById('p11-chat');var p=proj();if(!el||!el.value.trim())return;(p.hubChat=p.hubChat||[]).push({texto:el.value.trim(),por:quem(),em:agora()});salvarP(p);desenhar();};
W.hubP11Modelo=function(){try{if(typeof salvarProjetoComoModelo==='function'){salvarProjetoComoModelo(proj().id);return;}}catch(e){}if(typeof toast==='function')toast('Modelo: use o menu do projeto no TaskFlow para salvar como modelo.');};
/* ---------- modal Editar Tarefa (layout oficial) ---------- */
function fecharModal(){var m=document.getElementById('p11-modal');if(m)m.remove();}
W.hubP11Fechar=fecharModal;
W.hubP11Tarefa=function(id){var t=tk(id),p=proj()||P().find(function(x){return t&&x.id===t.projectProId;});if(!t)return;fecharModal();
  var pes=PE(),M=p?modelo(p):null;var I=itens(t);
  var op='<option value="">'+(t.hubResp&&!t.executor?esc(t.hubResp)+' (texto)':'—')+'</option>'+pes.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===t.executor?' selected':'')+'>'+esc(x.name)+'</option>';}).join('');
  var etOp='<option value="">Sem etapa</option>'+(M?M.etapas.map(function(e){return '<option value="'+esc(e.id)+'"'+(e.id===t.projectProFaseId?' selected':'')+'>'+e.ordem+'. '+esc(e.nome)+'</option>';}).join(''):'');
  var it=I.map(function(i,k){return '<div class="p11-item'+(i.done?' ok':'')+'"><i class="ti ti-grip-vertical p11-item-alca"></i><button class="p11-item-chk" onclick="hubP11Item('+q(t.id)+','+k+')" title="Marcar"><i class="ti '+(i.done?'ti-circle-check-filled':'ti-circle')+'"></i></button><div class="p11-item-c"><div class="p11-item-t">'+esc(i.title)+'</div><div class="p11-item-r"><input class="form-control form-control-sm" placeholder="" value="'+esc(i.resposta||'')+'" onchange="hubP11ItemR('+q(t.id)+','+k+',this.value)"><i class="ti ti-paperclip"></i></div></div><span class="p11-item-ac"><i class="ti ti-pencil" role="button" tabindex="0" onclick="hubP11ItemE('+q(t.id)+','+k+')"></i><i class="ti ti-trash" role="button" tabindex="0" onclick="hubP11ItemD('+q(t.id)+','+k+')"></i></span></div>';}).join('');
  var n=M&&M.idx[t.id];var C=t.hubComentarios||[];
  var h='<div id="p11-modal" class="p11-modal-bg" onclick="if(event.target===this)hubP11Fechar()"><div class="p11-modal"><div class="p11-m-main"><div class="p11-m-head"><span class="p11-m-tit"><i class="ti ti-pencil"></i> Editar Tarefa <span class="text-secondary">#'+esc(String(t.hubOrigemId||t.id))+'</span>'+(n?' <span class="gp-postit-num">'+n.numero+'</span>':'')+'</span>'+
   '<span class="p11-m-chips"><label class="p11-mchip">Início <input type="date" value="'+esc(t.dataInicio||'')+'" onchange="hubP11Set('+q(t.id)+',\'dataInicio\',this.value||null)"></label><label class="p11-mchip">Vencimento <input type="date" value="'+esc(t.date||'')+'" onchange="hubP11Set('+q(t.id)+',\'date\',this.value||null)"></label><span class="p11-mchip">'+(n&&n.bloq?'<i class="ti ti-lock"></i> Bloqueada':'<i class="ti ti-lock-open"></i> Liberada')+'</span></span></div>'+
   '<div class="p11-m-body"><div class="p11-m-esq">'+
   '<label class="p11-lb"><i class="ti ti-flag"></i> Prioridade</label><select class="form-select form-select-sm" onchange="hubP11Set('+q(t.id)+',\'prio\',this.value)">'+[['baixa','🟩 Baixa'],['media','🟨 Média'],['alta','🟧 Alta'],['urgente','🟥 Urgente']].map(function(o){return '<option value="'+o[0]+'"'+((t.prio||'media')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>'+
   '<label class="p11-lb"><i class="ti ti-user-question"></i> Solicitante</label><select class="form-select form-select-sm" onchange="hubP11Set('+q(t.id)+',\'solicitante\',this.value||null)"><option value="">Buscar pessoa ou grupo...</option>'+pes.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===t.solicitante?' selected':'')+'>'+esc(x.name)+'</option>';}).join('')+'</select>'+
   '<label class="p11-lb"><i class="ti ti-user"></i> Executor</label><select class="form-select form-select-sm" onchange="hubP11Set('+q(t.id)+',\'executor\',this.value||null)">'+op+'</select>'+
   '<label class="p11-lb"><i class="ti ti-users"></i> Em cópia</label><input class="form-control form-control-sm" placeholder="Adicionar pessoa..." disabled>'+
   '<label class="p11-lb"><i class="ti ti-layout-columns"></i> Etapa</label><select class="form-select form-select-sm" onchange="hubP11Etapa('+q(t.id)+',this.value)">'+etOp+'</select>'+
   '<label class="p11-lb"><i class="ti ti-progress"></i> Status</label><select class="form-select form-select-sm" onchange="hubP11Status('+q(t.id)+',this.value)"><option value="todo"'+(t.done?'':' selected')+'>A Fazer</option><option value="done"'+(t.done?' selected':'')+'>Concluída</option></select>'+
   (t.hubPred&&t.hubPred.length?'<label class="p11-lb"><i class="ti ti-arrow-ramp-right"></i> Predecessoras</label><div class="p11-preds">'+t.hubPred.map(function(pr){var o=tk(pr.id);return '<div class="gp-task-pred"><i class="ti '+(o&&o.done?'ti-circle-check':'ti-lock')+'"></i> '+esc(o?o.title:pr.id)+' <span class="text-secondary">['+esc(pr.modo)+']</span></div>';}).join('')+'</div>':'')+
   '</div><div class="p11-m-cen"><label class="p11-lb"><i class="ti ti-heading"></i> Título <span class="text-danger">*</span></label><input class="form-control form-control-sm" value="'+esc(t.title)+'" onchange="hubP11Set('+q(t.id)+',\'title\',this.value)">'+
   '<label class="p11-lb"><i class="ti ti-file-text"></i> Descrição <i class="ti ti-chevron-down"></i></label><textarea class="form-control form-control-sm p11-desc" rows="6" onchange="hubP11Set('+q(t.id)+',\'desc\',this.value)">'+esc(t.desc||'')+'</textarea>'+
   '<div class="p11-itens-h"><label class="p11-lb"><i class="ti ti-list-details"></i> Itens <i class="ti ti-chevron-down"></i></label><span class="tk-chip">'+I.filter(function(i){return i.done;}).length+'/'+I.length+'</span></div><div class="p11-itens">'+it+'<input class="form-control form-control-sm p11-item-novo" placeholder="+ Novo item (Enter)" onkeydown="if(event.key===\'Enter\'&&this.value.trim())hubP11ItemN('+q(t.id)+',this.value.trim())"></div></div></div>'+
   '<div class="p11-m-foot"><div><label class="p11-lb"><i class="ti ti-folder"></i> Projeto</label><select class="form-select form-select-sm" disabled><option>'+esc(p?p.nome:'—')+'</option></select></div><div><label class="p11-lb"><i class="ti ti-calendar-event"></i> Reunião</label><select class="form-select form-select-sm" disabled><option>— Nenhuma —</option></select></div><span style="flex:1"></span>'+
   '<button class="btn btn-sm btn-outline-danger" onclick="hubP11Excluir('+q(t.id)+')"><i class="ti ti-trash"></i> Excluir</button><button class="btn btn-sm btn-primary" onclick="hubP11Fechar();hubP11Desenhar()"><i class="ti ti-check"></i> Salvar alterações</button></div></div>'+
   '<div class="p11-m-com"><div class="p11-m-com-h"><i class="ti ti-messages"></i> Comentários<button class="p11-x" onclick="hubP11Fechar();hubP11Desenhar()"><i class="ti ti-x"></i></button></div><div class="p11-m-com-l">'+(C.length?C.map(function(c){return '<div class="p11-msg"><b>'+esc(c.por)+'</b> <span class="text-secondary small">'+esc(c.em)+'</span><div>'+esc(c.texto)+'</div></div>';}).join(''):'<div class="text-secondary small">Nenhum comentário ainda.</div>')+'</div>'+
   '<div class="p11-m-com-in"><textarea class="form-control form-control-sm" id="p11-com" rows="3"></textarea><div class="d-flex align-items-center"><span class="small text-secondary"><i class="ti ti-info-circle"></i> Enter envia — não precisa salvar a tarefa.</span><span style="flex:1"></span><button class="btn btn-sm btn-primary" onclick="hubP11Com('+q(t.id)+')"><i class="ti ti-send"></i> Enviar</button></div></div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
  var ta=document.getElementById('p11-com');if(ta)ta.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();hubP11Com(id);}};};
function re(id){var sc=document.querySelector('.p11-m-cen');var y=sc?sc.scrollTop:0;W.hubP11Tarefa(id);var s2=document.querySelector('.p11-m-cen');if(s2)s2.scrollTop=y;}
W.hubP11Set=function(id,k,v){var t=tk(id);if(!t)return;t[k]=v;if(k==='executor'&&v)t.hubResp=null;salvarT(t);};
W.hubP11Status=function(id,v){var t=tk(id);if(!t)return;if((v==='done')!==!!t.done){try{toggle(t.id);}catch(e){t.done=v==='done';t.doneAt=t.done?hoje():null;salvarT(t);}}re(id);};
W.hubP11Etapa=function(id,fid){var t=tk(id),p=proj();if(!t||!p)return;(p.fases||[]).forEach(function(f){(f.grupos||[]).forEach(function(g){g.tarefaIds=(g.tarefaIds||[]).filter(function(x){return x!==t.id;});});});
  var f=(p.fases||[]).find(function(x){return x.id===fid;});if(f){f.grupos=f.grupos&&f.grupos.length?f.grupos:[{id:f.id+'_g',setor:'',tarefaIds:[]}];f.grupos[0].tarefaIds.push(t.id);t.projectProFaseId=f.id;t.projectProGrupoId=f.grupos[0].id;t.ppOrdem=1e6;}else{t.projectProFaseId=null;t.projectProGrupoId=null;}
  delete t.hubGrupoCom;t.hubPre=false;salvarT(t);salvarP(p);};
function sub(t,k){t.subtasks=t.subtasks||[];var s=t.subtasks[k];if(typeof s==='string'){s=t.subtasks[k]={id:'s'+Date.now(),title:s,done:false,subsubs:[]};}return s;}
W.hubP11Item=function(id,k){var t=tk(id);var s=sub(t,k);if(!s)return;s.done=!s.done;salvarT(t);re(id);};
W.hubP11ItemR=function(id,k,v){var t=tk(id);var s=sub(t,k);if(!s)return;s.resposta=v;salvarT(t);};
W.hubP11ItemE=function(id,k){var t=tk(id);var s=sub(t,k);if(!s)return;var n=prompt('Item',s.title);if(n&&n.trim()){s.title=n.trim();salvarT(t);re(id);}};
W.hubP11ItemD=function(id,k){var t=tk(id);if(!t||!confirm('Excluir este item?'))return;t.subtasks.splice(k,1);salvarT(t);re(id);};
W.hubP11ItemN=function(id,v){var t=tk(id);(t.subtasks=t.subtasks||[]).push({id:'s'+Date.now(),title:v,done:false,subsubs:[]});salvarT(t);re(id);setTimeout(function(){var i=document.querySelector('.p11-item-novo');if(i)i.focus();},0);};
W.hubP11Com=function(id){var t=tk(id),el=document.getElementById('p11-com');if(!t||!el||!el.value.trim())return;(t.hubComentarios=t.hubComentarios||[]).push({texto:el.value.trim(),por:quem(),em:agora()});salvarT(t);re(id);};
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('p11-modal')){fecharModal();desenhar();}});
/* ---------- modal Novo Projeto (layout oficial) ---------- */
var ICON={produto:'ti-apps',processo:'ti-git-merge',outro:'ti-folder'};
W.hubP11NovoProjeto=function(){var x=document.getElementById('p11-np');if(x)x.remove();
  document.body.insertAdjacentHTML('beforeend','<div id="p11-np" class="p11-modal-bg" onclick="if(event.target===this)this.remove()"><div class="p11-np"><div class="p11-np-h"><span><i class="ti ti-apps"></i> Novo Projeto</span><button class="p11-x" onclick="document.getElementById(\'p11-np\').remove()"><i class="ti ti-x"></i></button></div><div class="p11-np-b">'+
   '<label class="p11-lb">Tipo</label><select class="form-select form-select-sm" id="p11-np-tipo"><option value="produto">Projeto</option><option value="processo">Processo</option></select>'+
   '<div class="p11-np-row"><div style="flex:0 0 120px"><label class="p11-lb">Ícone</label><select class="form-select form-select-sm" id="p11-np-ic" onchange="document.getElementById(\'p11-np-ico\').className=\'ti \'+this.value"><option value="ti-apps">Projeto</option><option value="ti-git-merge">Processo</option><option value="ti-package">Produto</option><option value="ti-flask">Pesquisa</option></select><i id="p11-np-ico" class="ti ti-apps"></i></div><div style="flex:1"><label class="p11-lb">Nome <span class="text-danger">*</span></label><input class="form-control form-control-sm" id="p11-np-nome" placeholder="Novo produto, procedimento, viabilidade..."></div></div>'+
   '<label class="p11-lb">Descrição</label><input class="form-control form-control-sm" id="p11-np-desc" placeholder="Projeto para a finalidade de...">'+
   '<div class="p11-np-row"><div style="flex:1"><label class="p11-lb">Início <span class="text-danger">*</span></label><input type="date" class="form-control form-control-sm" id="p11-np-ini" value="'+hoje()+'"></div><div style="flex:1"><label class="p11-lb">Final</label><input type="date" class="form-control form-control-sm" id="p11-np-fim"></div></div>'+
   '</div><div class="p11-np-f"><button class="btn btn-sm btn-secondary" onclick="document.getElementById(\'p11-np\').remove()">Cancelar</button><button class="btn btn-sm btn-primary" onclick="hubP11Criar()"><i class="ti ti-check"></i> Criar</button></div></div></div>');
  setTimeout(function(){var i=document.getElementById('p11-np-nome');if(i)i.focus();},30);};
W.hubP11Criar=function(){var g=function(i){return (document.getElementById(i)||{}).value||'';};var nome=g('p11-np-nome').trim();if(!nome){document.getElementById('p11-np-nome').focus();return;}if(!g('p11-np-ini')){document.getElementById('p11-np-ini').focus();return;}
  var p;try{p=_novoProjectPro({nome:nome,tipo:g('p11-np-tipo'),dono:W.CURRENT_USER_ID,prazoInicio:g('p11-np-ini'),prazoFim:g('p11-np-fim')||null,descricao:g('p11-np-desc')});}catch(e){p={id:'pp_'+Date.now(),nome:nome,tipo:g('p11-np-tipo'),dono:W.CURRENT_USER_ID,prazoInicio:g('p11-np-ini'),prazoFim:g('p11-np-fim')||null,descricao:g('p11-np-desc'),fases:[],pessoas:[]};}
  p.status='planejamento';p.modelo='hub';p.fases=p.fases||[];p.coordenador=p.coordenador||W.CURRENT_USER_ID;p.hubIcone=g('p11-np-ic');salvarP(p);document.getElementById('p11-np').remove();try{abrirProjectProView(p.id);}catch(e){}};
/* ---------- ganchos ---------- */
function hook(){
  if(typeof W.render==='function'&&!W.render._p11){var r=W.render;W.render=function(){var x=r.apply(this,arguments);try{if(typeof currentTab!=='undefined'&&currentTab==='projetos-pro'&&proj())desenhar();else document.body.classList.remove('p11-on');}catch(e){console.error(e);}return x;};W.render._p11=1;}
  if(typeof W.abrirProjectProView==='function'&&!W.abrirProjectProView._p11){var a=W.abrirProjectProView;W.abrirProjectProView=function(id){S.tab='quadro';var x=a.apply(this,arguments);try{desenhar();}catch(e){}return x;};W.abrirProjectProView._p11=1;}
  if(typeof W.abrirModalNovoProjectPro==='function'&&!W.abrirModalNovoProjectPro._p11){W._abrirModalNovoProjectProAntigo=W.abrirModalNovoProjectPro;W.abrirModalNovoProjectPro=function(){W.hubP11NovoProjeto();};W.abrirModalNovoProjectPro._p11=1;}
}
hook();W.addEventListener('load',function(){hook();setTimeout(hook,800);setTimeout(hook,2000);});
})();

/* Fase 16: elementos role=button que não são <button> respondem a Enter e Espaço como um clique. */
document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var t=e.target;if(!t||!t.matches||!t.matches('[role="button"]:not(button):not(a):not(input)'))return;if(t.isContentEditable)return;e.preventDefault();t.click();});
