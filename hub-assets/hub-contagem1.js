/* ══ COMERCIAL › MARCAS PRÓPRIAS › CONTAGEM (hub-contagem1) ══
   Aba "Contagem" ao lado de Clientes / SKUs (aprovada pelo Diego em 13/11/2026, Opção 1).
   · Estoque de embalagens por cliente: Etiqueta (un), Filme (kg — filme = bobina) e Caixa (un).
   · Agrupada por cliente/marca no título do Terceiros: "{código} — {marca} ({cliente}) — {cidade}".
   · Colunas: Cód. produto, Produto, Tipo, Situação, Mínimo, Estoque atual (negrito), 5 semanas
     anteriores (mais nova primeiro), Cobertura (semanas de consumo médio), Observações, ações.
     Em telas < 1600px: só 3 semanas e Observações vira dica (title) ao lado do produto.
   · Regras: vermelho (célula inteira) quando a contagem está NO mínimo ou abaixo — no estoque atual
     e no histórico. "Perto de acabar" = até X% acima do mínimo (X editável no funil, padrão 20%,
     gravado em taskflow_contagem.pct): fundo âmbar só no estoque atual.
   · Contagens agrupadas por semana (segunda a domingo); a coluna mostra a data da contagem.
     "Sem contagem recente" = item sem contagem na semana mais recente.
   · Indicadores no topo (Todos / A comprar / Perto de acabar / OK / Sem contagem recente) são
     filtros rápidos. Funil: Tipo, Cliente, ocultar "Sai de linha" e o % de perto de acabar.
   · "Lançar contagem" abre formulário por cliente e grava no localStorage. "Importar planilha" é
     stub (toast "em breve").
   · Fonte única: Terceiros (hub-terceiros15) lê CTG.emb(codigoProduto) para as colunas Embalagens.
   · Dados no localStorage (chave taskflow_contagem), via safeSetItem. ⚠️ DADOS FICTÍCIOS.
   · Regra P0: render não grava; só ações gravam. */
(function(){
  'use strict';
  var LS_KEY='taskflow_contagem';
  var TIPOS=['Etiqueta','Filme','Caixa'];
  var UNID={Etiqueta:'un',Filme:'kg',Caixa:'un'};
  var DB=null;
  var S={ind:'todos', busca:'', fOpen:false, f:{tipos:{Etiqueta:1,Filme:1,Caixa:1}, mid:'', semSaiLinha:false}, sort:{k:'',d:1}};

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function fmt(n){ return (n==null||n==='')?'':Number(n).toLocaleString('pt-BR'); }
  function toastMsg(m){ try{ if(typeof toast==='function') toast(m); }catch(e){} }
  function lsSet(k,v){ return (typeof safeSetItem==='function') ? safeSetItem(k,v) : (localStorage.setItem(k,v),true); }
  function uid(){ return 'ct'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function dBR(iso){ var p=String(iso).split('-'); return p[2]+'/'+p[1]; }
  function dBRf(iso){ var p=String(iso).split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  function hojeISO(){ var d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
  function semana(iso){ // segunda-feira da semana
    var d=new Date(iso+'T12:00:00'); var w=(d.getDay()+6)%7; d.setDate(d.getDate()-w);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  // ── Seed fictício (marcas iguais às do Terceiros) ──
  function seed(){
    var M=[['m71','71','Norte Doce','2201','Império dos Cereais','Caxias do Sul/RS'],
      ['m18','18','Serra Alimentos','3301','Vale dos Vinhedos Comércio','Bento Gonçalves/RS'],
      ['m42','42','Atlântico Snacks','4402','Costa Norte Alimentos','Itajaí/SC'],
      ['m33','33','Campo Verde','5503','Pedra Alta & Cia','Passo Fundo/RS'],
      ['m8','8','Porto Doce','4073','Atacado Rio Grande Alimentos','Porto Alegre/RS']];
    var D=['2026-11-12','2026-11-05','2026-10-29','2026-10-22','2026-10-15','2026-10-08'];
    var R=[
     ['m71','20281','Pipoca Doce Tradicional 30g','Etiqueta',8000,[6200,9400,12800,15900,18600,21300],'Ativo','Pedido de reposição enviado 10/11'],
     ['m71','20281','Pipoca Doce Tradicional 30g','Caixa',600,[1850,2100,2420,2690,2950,3200],'Ativo',''],
     ['m71','20284','Pipoca Doce Tradicional 80g','Etiqueta',6000,[7050,8300,9600,11100,12400,13900],'Ativo',''],
     ['m71','20284','Pipoca Doce Tradicional 80g','Caixa',500,[540,690,820,960,1100,1240],'Ativo',''],
     ['m71','20290','Pipoca Salgada 100g','Filme',250,[410,470,530,590,650,700],'Ativo','Filme 320 mm'],
     ['m71','20290','Pipoca Salgada 100g','Caixa',400,[1320,1400,1480,1550,1630,1700],'Ativo',''],
     ['m71','20291','Pipoca Doce Caramelo 50g','Filme',200,[180,240,300,350,410,460],'Ativo',''],
     ['m71','20291','Pipoca Doce Caramelo 50g','Caixa',300,[960,1010,1080,1120,1190,1240],'Ativo',''],
     ['m18','18703','Pão de Mel com Choc. ao Leite 250g','Etiqueta',5000,[14200,15800,17300,4100,6300,8200],'Ativo','Chegou lote novo 24/10'],
     ['m18','18703','Pão de Mel com Choc. ao Leite 250g','Filme',300,[690,760,820,890,950,1010],'Ativo',''],
     ['m18','18703','Pão de Mel com Choc. ao Leite 250g','Caixa',400,[460,560,650,740,820,900],'Ativo',''],
     ['m18','18708','Pão de Mel com Choc. Branco 250g','Etiqueta',5000,[5800,6900,7700,8600,9500,10300],'Ativo',''],
     ['m18','18708','Pão de Mel com Choc. Branco 250g','Filme',300,[520,580,640,700,760,820],'Ativo',''],
     ['m18','18708','Pão de Mel com Choc. Branco 250g','Caixa',400,[1180,1260,1350,1420,1500,1580],'Ativo',''],
     ['m42','22479','Salgadinho Palitinho sabor Original 50g','Filme',220,[null,null,380,430,480,520],'Ativo','Conferir no galpão 2'],
     ['m42','22479','Salgadinho Palitinho sabor Original 50g','Caixa',500,[null,null,2300,2450,2600,2740],'Ativo',''],
     ['m42','22480','Salgadinho Palitinho sabor Queijo 50g','Filme',220,[205,250,300,340,390,430],'Ativo',''],
     ['m42','22480','Salgadinho Palitinho sabor Queijo 50g','Caixa',500,[1640,1720,1810,1900,1980,2060],'Ativo',''],
     ['m42','22481','Salgadinho Palitinho sabor Bacon 50g','Filme',220,[255,300,350,400,440,490],'Ativo',''],
     ['m42','22481','Salgadinho Palitinho sabor Bacon 50g','Caixa',500,[480,610,720,830,950,1060],'Ativo',''],
     ['m33','13201','Pão de Mel com Choc. ao Leite 200g','Etiqueta',4000,[11800,12500,13300,14100,14900,15600],'Ativo',''],
     ['m33','13201','Pão de Mel com Choc. ao Leite 200g','Filme',250,[600,640,690,730,780,820],'Ativo',''],
     ['m33','13201','Pão de Mel com Choc. ao Leite 200g','Caixa',350,[920,980,1040,1090,1150,1210],'Ativo',''],
     ['m8','10805','Salgadão sabor Bacon 100g','Filme',250,[290,350,400,460,510,560],'Ativo',''],
     ['m8','10805','Salgadão sabor Bacon 100g','Caixa',450,[1480,1560,1640,1710,1790,1860],'Ativo',''],
     ['m8','11709','Biscoito de Amendoim 250g','Etiqueta',5000,[4200,5600,6900,8100,9400,10600],'Ativo','Arte nova a partir de dez/26'],
     ['m8','11709','Biscoito de Amendoim 250g','Caixa',400,[null,null,null,980,1050,1110],'Sai de linha','Última produção 30/10'],
     ['m8','10812','Salgadão sabor Churrasco 100g','Filme',250,[810,870,920,980,1030,1090],'Ativo',''],
     ['m8','10812','Salgadão sabor Churrasco 100g','Caixa',450,[1250,1330,1400,1480,1550,1620],'Ativo','']];
    var it=R.map(function(r,i){ var c={}; r[5].forEach(function(v,j){ if(v!=null) c[D[j]]=v; });
      return {id:'cti'+(i+1), mid:r[0], cod:r[1], prod:r[2], tipo:r[3], min:r[4], c:c, sit:r[6], obs:r[7]}; });
    return {v:1, pct:20, marcas:M.map(function(m){ return {id:m[0],codigo:m[1],nome:m[2],cliCod:m[3],cliente:m[4],cidade:m[5]}; }), itens:it};
  }
  function load(){
    if(DB) return DB;
    var d=null; try{ d=JSON.parse(localStorage.getItem(LS_KEY)||'null'); }catch(e){ d=null; }
    if(!d || !Array.isArray(d.itens) || !Array.isArray(d.marcas)) d=seed();
    if(!(d.pct>=0)) d.pct=20;
    DB=d; return DB;
  }
  function save(){ lsSet(LS_KEY, JSON.stringify(DB)); }
  function marca(mid){ return load().marcas.find(function(m){ return m.id===mid; })||{id:mid,codigo:'',nome:'',cliente:'',cliCod:'',cidade:''}; }

  // ── Semanas e cálculo ──
  function semanas(){ // [{k:segunda, d:data mais recente contada na semana}] mais nova primeiro
    var W={};
    load().itens.forEach(function(it){ Object.keys(it.c||{}).forEach(function(iso){ var k=semana(iso); if(!W[k]||iso>W[k]) W[k]=iso; }); });
    return Object.keys(W).sort().reverse().map(function(k){ return {k:k,d:W[k]}; });
  }
  function valSemana(it, k){ // última contagem do item dentro da semana k
    var best=null, bd='';
    Object.keys(it.c||{}).forEach(function(iso){ if(semana(iso)===k && iso>bd){ bd=iso; best=it.c[iso]; } });
    return best==null?null:{v:best,d:bd};
  }
  function atual(it){ var ks=Object.keys(it.c||{}).sort(); if(!ks.length) return null; var d=ks[ks.length-1]; return {v:it.c[d], d:d}; }
  function pct(){ return Number(load().pct)||0; }
  function status(it){
    var a=atual(it); if(!a) return 'sem';
    if(a.v<=it.min) return 'comprar';
    if(a.v<=it.min*(1+pct()/100)) return 'perto';
    return 'ok';
  }
  function recente(it, W){ W=W||semanas(); return !!(W.length && valSemana(it, W[0].k)); }
  function cobertura(it){
    var ks=Object.keys(it.c||{}).sort().reverse().slice(0,5);
    if(ks.length<3) return null;
    var d=[]; for(var i=0;i<ks.length-1;i++){ var x=it.c[ks[i+1]]-it.c[ks[i]]; if(x>0) d.push(x); }
    if(!d.length) return null;
    var m=d.reduce(function(a,b){return a+b;},0)/d.length; if(m<=0) return null;
    return it.c[ks[0]]/m;
  }
  function cobTxt(w){ if(w==null) return '—'; return (w>=2?Math.round(w):(Math.round(w*10)/10).toString().replace('.',','))+' sem'; }

  // ── Filtros ──
  function baseFiltrados(){
    var q=norm(S.busca), f=S.f;
    return load().itens.filter(function(it){
      if(!f.tipos[it.tipo]) return false;
      if(f.mid && it.mid!==f.mid) return false;
      if(f.semSaiLinha && it.sit==='Sai de linha') return false;
      if(q){ var m=marca(it.mid); if(norm(it.cod+' '+it.prod+' '+it.tipo+' '+m.codigo+' '+m.nome+' '+m.cliente).indexOf(q)<0) return false; }
      return true;
    });
  }
  function nFiltros(){ var f=S.f; return (TIPOS.some(function(t){return !f.tipos[t];})?1:0)+(f.mid?1:0)+(f.semSaiLinha?1:0); }
  function passaInd(it, W){
    var st=status(it);
    if(S.ind==='todos') return true;
    if(S.ind==='sem') return !recente(it, W);
    return st===S.ind;
  }

  // ── HTML ──
  function acaoHTML(){
    return '<span class="mp-head-acts" style="display:flex;gap:8px">'
      +'<button class="mp-btn gho" onclick="CTG.importar()"><i class="ti ti-file-spreadsheet"></i><span>Importar planilha</span></button>'
      +'<button class="mp-btn pri" onclick="CTG.lancar()"><i class="ti ti-clipboard-plus"></i><span>Lançar contagem</span></button></span>';
  }
  function tabHTML(on){
    return '<button class="mp-tab'+(on?' on':'')+'" data-tab="contagem" onclick="MP.setTab(\'contagem\')"><i class="ti ti-clipboard-list"></i>Contagem<span class="n">'+load().itens.length+'</span></button>';
  }
  function toolsHTML(){
    var busca=(typeof _cpBuscaCampo==='function')?_cpBuscaCampo(S.busca,'CTG.buscaEl','ctg-busca','Buscar produto, código ou cliente...')
      :'<input class="mp-in" id="ctg-busca" placeholder="Buscar produto, código ou cliente..." value="'+esc(S.busca)+'" oninput="CTG.buscaEl(this)">';
    var on=nFiltros()>0;
    var btn=(typeof _cpIcoBtn==='function')?_cpIcoBtn('CTG.toggleFiltro()','Filtros','filter',on,'')
      :'<button class="mp-btn gho sm'+(on?' on':'')+'" title="Filtros" onclick="CTG.toggleFiltro()"><i class="ti ti-filter"></i></button>';
    return busca+'<span class="cp-pop-wrap" id="ctg-fwrap" style="position:relative;display:inline-flex">'+btn+(S.fOpen?popHTML():'')+'</span>';
  }
  function popHTML(){
    var f=S.f;
    var tipos=TIPOS.map(function(t){ return '<label class="ctg-chk"><input type="checkbox"'+(f.tipos[t]?' checked':'')+' onchange="CTG.tipo(\''+t+'\',this.checked)"> '+t+' <span class="un">'+UNID[t]+'</span></label>'; }).join('');
    var cli='<select class="mp-fsel" onchange="CTG.cliente(this.value)"><option value="">Todos os clientes</option>'
      +load().marcas.map(function(m){ return '<option value="'+esc(m.id)+'"'+(f.mid===m.id?' selected':'')+'>'+esc(m.codigo+' — '+m.nome)+'</option>'; }).join('')+'</select>';
    return '<div class="cp-pop mp-fpop ctg-pop">'+(nFiltros()?'<div class="mp-fpop-h"><u onclick="CTG.limpar()">Limpar</u></div>':'')
      +'<div class="mp-fgrp"><b>Tipo</b>'+tipos+'</div>'
      +'<div class="mp-fgrp"><b>Cliente</b>'+cli+'</div>'
      +'<div class="mp-fgrp"><b>Situação</b><label class="ctg-chk"><input type="checkbox"'+(f.semSaiLinha?' checked':'')+' onchange="CTG.saiLinha(this.checked)"> Ocultar itens que saem de linha</label></div>'
      +'<div class="mp-fgrp"><b>Perto de acabar</b><label class="ctg-pct">Até <input type="number" min="0" max="500" step="1" id="ctg-pct" value="'+pct()+'" onchange="CTG.setPct(this.value)" onkeydown="if(event.key===\'Enter\')this.blur()"> % acima do mínimo</label></div>'
      +'</div>';
  }
  function indHTML(base, W){
    var c={todos:base.length,comprar:0,perto:0,ok:0,sem:0};
    base.forEach(function(it){ var s=status(it); if(c[s]!=null&&s!=='sem') c[s]++; if(!recente(it,W)) c.sem++; });
    var cards=[['todos','Todos','itens contados',''],['comprar','A comprar','no mínimo ou abaixo','red'],
      ['perto','Perto de acabar','até '+pct()+'% acima do mínimo','amb'],['ok','OK','acima de '+pct()+'% do mínimo',''],
      ['sem','Sem contagem recente','sem contagem na última semana','']];
    return '<div class="ctg-ind">'+cards.map(function(k){
      return '<button type="button" class="ctg-card '+k[3]+(S.ind===k[0]?' on':'')+'" onclick="CTG.ind(\''+k[0]+'\')"><span class="l">'+k[1]+'</span><span class="v">'+c[k[0]]+'</span><span class="h">'+k[2]+'</span></button>';
    }).join('')+'</div>';
  }
  var SORT_ACC={cod:function(it){return it.cod;}, prod:function(it){return norm(it.prod);}, tipo:function(it){return it.tipo;},
    min:function(it){return it.min;}, atual:function(it){var a=atual(it);return a?a.v:-1;}, cob:function(it){var w=cobertura(it);return w==null?1e9:w;}};
  function th(k, lab, cls, sub){
    var on=S.sort.k===k, ic=on?(S.sort.d<0?'ti-arrow-down':'ti-arrow-up'):'ti-arrows-sort';
    return '<th class="so'+(on?' on':'')+(cls?' '+cls:'')+'" onclick="CTG.sort(\''+k+'\')">'+lab+'<i class="ti '+ic+'"></i>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</th>';
  }
  function bodyHTML(){
    var W=semanas(), base=baseFiltrados();
    var L=base.filter(function(it){ return passaInd(it,W); });
    var hist=W.slice(1,6);
    var h='<thead><tr>'+th('cod','Cód. produto')+th('prod','Produto')+th('tipo','Tipo')+'<th>Situação</th>'+th('min','Mínimo','n fl')
      +th('atual','Estoque atual','n at',W.length?'contagem '+dBR(W[0].d):'');
    hist.forEach(function(w,i){ h+='<th class="n w'+(i+1)+'">'+dBR(w.d)+'</th>'; });
    for(var z=hist.length;z<5;z++) h+='<th class="n w'+(z+1)+'"></th>';
    h+=th('cob','Cobertura','n fl','consumo médio')+'<th class="ob">Observações</th><th></th></tr></thead>';
    var body='';
    var sk=S.sort.k, acc=SORT_ACC[sk];
    load().marcas.forEach(function(m){
      var rs=L.filter(function(it){ return it.mid===m.id; });
      if(!rs.length) return;
      if(acc) rs=rs.slice().sort(function(a,b){ var x=acc(a), y=acc(b); return (x<y?-1:x>y?1:0)*S.sort.d; });
      body+='<tr class="ctg-g"><td colspan="14"><span class="gn">'+esc(m.codigo+' — '+m.nome)+'</span><span class="gc">('+esc(m.cliCod+' — '+m.cliente)+') — '+esc(m.cidade)+'</span><span class="cnt">'+rs.length+'</span>'
        +'<button type="button" class="ctg-glk" onclick="CTG.lancar(\''+esc(m.id)+'\')"><i class="ti ti-clipboard-plus"></i>Lançar contagem</button></td></tr>';
      rs.forEach(function(it){ body+=rowHTML(it, W, hist); });
    });
    if(!body) body='<tr><td colspan="14" class="ctg-vz">Nenhum item com esses filtros.</td></tr>';
    var leg='<div class="ctg-leg"><span><b class="lr"></b>No mínimo ou abaixo (a comprar)</span><span><b class="la"></b>Perto de acabar — até '+pct()+'% acima do mínimo, só no estoque atual</span><span>Data pequena ao lado do número = última contagem, quando o item não foi contado na semana</span></div>';
    return '<div id="ctg-root">'+indHTML(base,W)+'<div class="mp-tw"><table class="mp-t ctg-t">'+h+'<tbody>'+body+'</tbody></table></div>'+leg+'</div>';
  }
  function rowHTML(it, W, hist){
    var st=status(it), a=atual(it), u=UNID[it.tipo];
    var cls='n at'+(st==='comprar'?' red':st==='perto'?' amb':'');
    var old=a && W.length && semana(a.d)!==W[0].k;
    var tip=a?(it.tipo+': '+fmt(a.v)+' '+u+' · mínimo '+fmt(it.min)+' '+u+' · contagem '+dBRf(a.d)):'Sem contagem';
    var at='<td class="'+cls+'" title="'+esc(tip)+'">'+(a?fmt(a.v)+(old?'<span class="dt">'+dBR(a.d)+'</span>':''):'—')+'</td>';
    var hs='';
    for(var i=0;i<5;i++){
      var w=hist[i], x=w?valSemana(it,w.k):null;
      hs+='<td class="n mu w'+(i+1)+(x&&x.v<=it.min?' red':'')+'">'+(x?fmt(x.v):'')+'</td>';
    }
    var obsIc=it.obs?'<i class="ti ti-message-2 ctg-obsic" title="'+esc(it.obs)+'"></i>':'';
    return '<tr data-id="'+esc(it.id)+'"><td class="mu">'+esc(it.cod)+'</td><td class="pr">'+esc(it.prod)+obsIc+'</td>'
      +'<td>'+esc(it.tipo)+'<span class="un">'+u+'</span></td><td class="'+(it.sit==='Ativo'?'mu':'')+'">'+esc(it.sit)+'</td>'
      +'<td class="n mu fl">'+fmt(it.min)+'</td>'+at+hs+'<td class="n mu fl">'+cobTxt(cobertura(it))+'</td>'
      +'<td class="ob"'+(it.obs?' title="'+esc(it.obs)+'"':'')+'>'+esc(it.obs)+'</td>'
      +'<td><div class="mp-acts"><button class="mp-act" title="Lançar contagem do cliente" onclick="CTG.lancar(\''+esc(it.mid)+'\')"><i class="ti ti-clipboard-list"></i></button>'
      +'<button class="mp-act" title="Editar item" onclick="CTG.editar(\''+esc(it.id)+'\')"><i class="ti ti-pencil"></i></button></div></td></tr>';
  }

  // ── Refresh parcial (mantém o foco da busca) ──
  function refreshBody(){ var b=document.getElementById('mp-body'); if(b) b.innerHTML=bodyHTML(); syncFunil(); }
  function syncFunil(){ var w=document.getElementById('ctg-fwrap'); if(!w) return; var b=w.querySelector('.cp-abtn,button'); if(b) b.classList.toggle('on', nFiltros()>0); }
  function refreshPop(){ var w=document.getElementById('ctg-fwrap'); if(!w) return; var p=w.querySelector('.ctg-pop'); if(p) p.remove(); if(S.fOpen) w.insertAdjacentHTML('beforeend',popHTML()); syncFunil(); }
  function rerenderMP(){ if(window.MP && MP.render) MP.render(document.getElementById('task-container')); }

  // ── Modal (usa as classes do modal de Marcas) ──
  function fecharModal(){ var o=document.getElementById('ctg-modal'); if(o) o.remove(); document.removeEventListener('keydown', escKey); }
  function escKey(e){ if(e.key==='Escape') fecharModal(); }
  function abrirModal(titulo, icone, corpo, onSalvar, rot, largo){
    fecharModal();
    var ov=document.createElement('div'); ov.className='mp-ov mp-wrap'; ov.id='ctg-modal';
    ov.innerHTML='<div class="mp-mod'+(largo?' ctg-mod-l':'')+'" role="dialog" aria-modal="true"><div class="mp-mod-h"><h3><i class="ti '+icone+'"></i>'+titulo+'</h3><button class="mp-x" title="Fechar" data-x="1">&times;</button></div>'
      +'<div class="mp-mod-b" id="ctg-mod-b">'+corpo+'<div class="mp-err" id="ctg-err"></div></div>'
      +'<div class="mp-mod-f"><button class="mp-btn gho" data-x="1">Cancelar</button><button class="mp-btn pri" id="ctg-salvar"><i class="ti ti-check"></i>'+(rot||'Salvar')+'</button></div></div>';
    ov.addEventListener('mousedown',function(e){ if(e.target===ov) ov._down=true; });
    ov.addEventListener('click',function(e){ if((e.target===ov&&ov._down)||(e.target.closest&&e.target.closest('[data-x]'))) fecharModal(); ov._down=false; });
    ov.querySelector('#ctg-salvar').onclick=onSalvar;
    document.body.appendChild(ov);
    document.addEventListener('keydown', escKey);
    return ov;
  }
  function lancarCorpo(mid, data){
    var its=load().itens.filter(function(it){ return it.mid===mid; });
    var opts=load().marcas.map(function(m){ return '<option value="'+esc(m.id)+'"'+(m.id===mid?' selected':'')+'>'+esc(m.codigo+' — '+m.nome+' ('+m.cliente+')')+'</option>'; }).join('');
    var rows=its.map(function(it){
      var a=atual(it), u=UNID[it.tipo], ja=it.c&&it.c[data];
      return '<tr><td class="mu">'+esc(it.cod)+'</td><td class="pr">'+esc(it.prod)+'</td><td>'+esc(it.tipo)+'<span class="un">'+u+'</span></td>'
        +'<td class="n mu">'+fmt(it.min)+'</td><td class="n mu">'+(a?fmt(a.v)+'<span class="dt">'+dBR(a.d)+'</span>':'—')+'</td>'
        +'<td class="n"><input class="mp-in ctg-qin" type="number" min="0" step="1" inputmode="numeric" data-id="'+esc(it.id)+'" value="'+(ja!=null?ja:'')+'" placeholder="—"></td></tr>';
    }).join('');
    return '<div class="ctg-fl"><label class="mp-f"><span>Cliente</span><select class="mp-sel" id="ctg-fmid" onchange="CTG._troca()">'+opts+'</select></label>'
      +'<label class="mp-f"><span>Data da contagem</span><input class="mp-in" type="date" id="ctg-fdata" value="'+esc(data)+'" onchange="CTG._troca()"></label></div>'
      +'<div class="mp-tw ctg-ftw"><table class="mp-t ctg-t ctg-ft"><thead><tr><th>Cód.</th><th>Produto</th><th>Tipo</th><th class="n">Mínimo</th><th class="n">Última contagem</th><th class="n">Contagem</th></tr></thead><tbody>'
      +(rows||'<tr><td colspan="6" class="ctg-vz">Este cliente não tem itens de embalagem cadastrados.</td></tr>')+'</tbody></table></div>'
      +'<div class="ctg-fhint">Deixe em branco o que não foi contado. Etiqueta e caixa em unidades; filme em kg.</div>';
  }
  function lancar(mid){
    mid=mid||S.f.mid||(load().marcas[0]&&load().marcas[0].id);
    var data=hojeISO();
    abrirModal('Lançar contagem','ti-clipboard-plus',lancarCorpo(mid,data),function(){
      var d=(document.getElementById('ctg-fdata')||{}).value;
      var err=document.getElementById('ctg-err');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d||'')){ if(err) err.textContent='Informe a data da contagem.'; return; }
      var n=0, bad=false;
      document.querySelectorAll('#ctg-modal .ctg-qin').forEach(function(inp){
        var v=String(inp.value).trim(); if(v==='') return;
        var x=Number(v); if(!(x>=0)){ bad=true; inp.classList.add('err'); return; }
        var it=load().itens.find(function(i){ return i.id===inp.getAttribute('data-id'); });
        if(it){ it.c=it.c||{}; it.c[d]=Math.round(x); n++; }
      });
      if(bad){ if(err) err.textContent='Use só números (0 ou mais).'; return; }
      if(!n){ if(err) err.textContent='Preencha ao menos uma contagem.'; return; }
      save(); fecharModal(); rerenderMP(); toastMsg('Contagem salva — '+n+' '+(n===1?'item':'itens'));
    },'Salvar contagem',true);
  }
  function editar(id){
    var it=load().itens.find(function(i){ return i.id===id; }); if(!it) return;
    var m=marca(it.mid);
    var b='<div class="ctg-esub">'+esc(m.codigo+' — '+m.nome)+' · '+esc(it.cod+' · '+it.prod)+' · '+esc(it.tipo)+'</div>'
      +'<div class="ctg-fl"><label class="mp-f"><span>Mínimo ('+UNID[it.tipo]+')</span><input class="mp-in" type="number" min="0" id="ctg-emin" value="'+esc(it.min)+'"></label>'
      +'<label class="mp-f"><span>Situação</span><select class="mp-sel" id="ctg-esit">'+['Ativo','Sai de linha','Inativo'].map(function(s){ return '<option'+(s===it.sit?' selected':'')+'>'+s+'</option>'; }).join('')+'</select></label></div>'
      +'<label class="mp-f" style="display:block;margin-top:10px"><span>Observações</span><textarea class="mp-in" id="ctg-eobs" rows="2">'+esc(it.obs)+'</textarea></label>';
    abrirModal('Editar item','ti-pencil',b,function(){
      var mn=Number(document.getElementById('ctg-emin').value);
      if(!(mn>=0)){ document.getElementById('ctg-err').textContent='Informe o mínimo.'; return; }
      it.min=Math.round(mn); it.sit=document.getElementById('ctg-esit').value; it.obs=document.getElementById('ctg-eobs').value.trim();
      save(); fecharModal(); rerenderMP(); toastMsg('Item atualizado');
    },'Salvar');
  }

  // ── Fonte para o Terceiros ──
  function emb(cod){
    var out={};
    load().itens.forEach(function(it){
      if(String(it.cod)!==String(cod)) return;
      var a=atual(it), u=UNID[it.tipo];
      out[it.tipo]={v:a?a.v:null, min:it.min, d:a?a.d:'', red:!!(a&&a.v<=it.min), un:u,
        tip:a?(it.tipo+': '+fmt(a.v)+' '+u+' · mínimo '+fmt(it.min)+' '+u+' · contagem '+dBRf(a.d)):(it.tipo+': sem contagem · mínimo '+fmt(it.min)+' '+u)};
    });
    return out;
  }
  var TR_K={etq:'Etiqueta',fil:'Filme',cxa:'Caixa'};
  function cellTerceiros(k, cod, g){
    var t=TR_K[k], e=emb(cod)[t];
    if(!e) return '<td class="tr-emb vz'+(g||'')+'" title="Este produto não usa '+t.toLowerCase()+'">—</td>';
    return '<td class="tr-emb'+(e.red?' red':'')+(g||'')+'" title="'+esc(e.tip)+'">'+(e.v==null?'—':fmt(e.v))+'</td>';
  }
  function sortTerceiros(k, cod){ var e=emb(cod)[TR_K[k]]; return e&&e.v!=null?e.v:-1; }

  // fecha o funil ao clicar fora / Esc
  document.addEventListener('mousedown', function(e){
    if(!S.fOpen) return;
    if(e.target && e.target.closest && e.target.closest('#ctg-fwrap')) return;
    S.fOpen=false; refreshPop();
  }, true);

  window.CTG={
    acaoHTML:acaoHTML, tabHTML:tabHTML, toolsHTML:toolsHTML, bodyHTML:bodyHTML,
    count:function(){ return load().itens.length; },
    emb:emb, cellTerceiros:cellTerceiros, sortTerceiros:sortTerceiros,
    buscaEl:function(el){ S.busca=el.value; refreshBody(); },
    toggleFiltro:function(){ S.fOpen=!S.fOpen; refreshPop(); },
    tipo:function(t,on){ S.f.tipos[t]=on?1:0; refreshBody(); refreshPop(); },
    cliente:function(v){ S.f.mid=v; refreshBody(); refreshPop(); },
    saiLinha:function(on){ S.f.semSaiLinha=!!on; refreshBody(); refreshPop(); },
    limpar:function(){ S.f={tipos:{Etiqueta:1,Filme:1,Caixa:1},mid:'',semSaiLinha:false}; refreshBody(); refreshPop(); },
    setPct:function(v){ var x=Math.round(Number(String(v).replace(',','.'))); if(!(x>=0)) x=20; if(x>500) x=500; load().pct=x; save(); refreshBody(); var i=document.getElementById('ctg-pct'); if(i) i.value=x; },
    ind:function(k){ S.ind=(S.ind===k&&k!=='todos')?'todos':k; refreshBody(); },
    sort:function(k){ if(S.sort.k===k){ if(S.sort.d===1) S.sort.d=-1; else S.sort={k:'',d:1}; } else S.sort={k:k,d:(k==='atual'||k==='cob'||k==='min')?1:1}; refreshBody(); },
    lancar:lancar, editar:editar,
    _troca:function(){ var mid=document.getElementById('ctg-fmid').value, d=document.getElementById('ctg-fdata').value||hojeISO();
      var b=document.getElementById('ctg-mod-b'); if(b) b.innerHTML=lancarCorpo(mid,d)+'<div class="mp-err" id="ctg-err"></div>'; },
    importar:function(){ toastMsg('Importar planilha: em breve'); },
    _reset:function(){ DB=seed(); save(); rerenderMP(); },
    _db:function(){ return load(); }
  };
})();
