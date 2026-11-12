/* ══ PCP › TERCEIROS (hub-terceiros3)
   Planilha no padrão da Cobertura do Hub, com mais respiro (v3):
   item ~32–36px, marca em faixa, pedido em duas linhas.
   Cabeçalho de duas linhas congelado, grupos recolhíveis. Tela somente leitura.
   Dados no localStorage (chave taskflow_terceiros), sempre via safeSetItem.
   Entrada: renderProducao() chama TR.render(main) quando producaoView==='terceiros'.
   O ícone de palete abre MP.verPalete (modal de Marcas, somente leitura). */
(function(){
  'use strict';
  var LS_KEY='taskflow_terceiros';

  function lsGet(k, fb){
    if(typeof safeJSON==='function') return safeJSON(k, fb);
    try{ var r=localStorage.getItem(k); return r?JSON.parse(r):fb; }catch(e){ return fb; }
  }
  function lsSet(k,v){
    var s=JSON.stringify(v);
    return (typeof safeSetItem==='function') ? safeSetItem(k,s) : (localStorage.setItem(k,s),true);
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function palSeed(modelo, lastros){
    var ori=[], chp=[];
    for(var i=0;i<lastros;i++){ ori.push(i%3===1?'Direita':'Meio'); chp.push(i===0||i===3?1:0); }
    return {modelo:modelo, lastros:lastros, orientacao:ori, chapas:chp};
  }

  function seed(){
    return {v:1, marcas:[
      {id:'m71', codigo:'71', nome:'Norte Doce', cidade:'Caxias do Sul/RS', pedidos:[
        {id:'p601128', numero:'601128', cliId:'2201', cliente:'Império dos Cereais',
         entrega:'10/11/2026', emissao:'03/11/2026 10:11', fin:'Crédito Aprovado', exp:'Conferência',
         itens:[
           {id:'i20281', codigo:'20281', nome:'Pipoca Doce Tradicional 30g', linha:'Pipocas',
            pedido:500, estoque:500, op:500, nop:'14090', status:'Finalizada', prev:'09/11/2026', obs:'',
            pacotesPorCaixa:50, caixasPorPalete:40, palete:palSeed('mod. A14 (6+6)', 8)},
           {id:'i20284', codigo:'20284', nome:'Pipoca Doce Tradicional 80g', linha:'Pipocas',
            pedido:1000, estoque:1000, op:1000, nop:'14066', status:'Finalizada', prev:'09/11/2026', obs:'',
            pacotesPorCaixa:30, caixasPorPalete:40, palete:palSeed('mod. A14 (6+6)', 7)}
         ]},
        {id:'p601210', numero:'601210', cliId:'2201', cliente:'Império dos Cereais',
         entrega:'18/11/2026', emissao:'08/11/2026 09:40', fin:'Liberado', exp:'Aguardando',
         itens:[
           {id:'i20290', codigo:'20290', nome:'Pipoca Salgada 100g', linha:'Pipocas',
            pedido:200, estoque:40, op:160, nop:'14190', status:'Aguardando Liberação', prev:'14/11/2026', obs:'',
            pacotesPorCaixa:25, caixasPorPalete:36, palete:palSeed('mod. 810 (5+3+5)', 6)},
           {id:'i20291', codigo:'20291', nome:'Pipoca Doce Caramelo 50g', linha:'Pipocas',
            pedido:120, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:40, caixasPorPalete:40, palete:null}
         ]}
      ]},
      {id:'m18', codigo:'18', nome:'Serra Alimentos', cidade:'Bento Gonçalves/RS', pedidos:[
        {id:'p601347', numero:'601347', cliId:'3301', cliente:'Vale dos Vinhedos Comércio',
         entrega:'26/11/2026', emissao:'03/11/2026 15:11', fin:'Crédito Aprovado', exp:'Aguardando',
         itens:[
           {id:'i18703', codigo:'18703', nome:'Pão de Mel com Choc. ao Leite 250g', linha:'Pão de Mel',
            pedido:100, estoque:0, op:100, nop:'14154', status:'Aguardando Liberação', prev:'12/11/2026', obs:'',
            pacotesPorCaixa:20, caixasPorPalete:50, palete:palSeed('mod. 610 (4+2+4)', 6)},
           {id:'i18708', codigo:'18708', nome:'Pão de Mel com Choc. Branco 250g', linha:'Pão de Mel',
            pedido:80, estoque:10, op:70, nop:'14155', status:'Aguardando Liberação', prev:'13/11/2026', obs:'',
            pacotesPorCaixa:20, caixasPorPalete:50, palete:palSeed('mod. 610 (4+2+4)', 6)}
         ]}
      ]},
      {id:'m42', codigo:'42', nome:'Atlântico Snacks', cidade:'Itajaí/SC', pedidos:[
        {id:'p602031', numero:'602031', cliId:'4402', cliente:'Costa Norte Alimentos',
         entrega:'13/11/2026', emissao:'03/11/2026 16:13', fin:'Liberado', exp:'Aguardando',
         itens:[
           {id:'i22479', codigo:'22479', nome:'Salgadinho Palitinho sabor Original 50g', linha:'Palitinhos',
            pedido:10, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:40, caixasPorPalete:60, palete:null},
           {id:'i22480', codigo:'22480', nome:'Salgadinho Palitinho sabor Queijo 50g', linha:'Palitinhos',
            pedido:10, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:40, caixasPorPalete:60, palete:null},
           {id:'i22481', codigo:'22481', nome:'Salgadinho Palitinho sabor Bacon 50g', linha:'Palitinhos',
            pedido:16, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'Cliente pediu antecipar se houver janela',
            pacotesPorCaixa:40, caixasPorPalete:60, palete:null}
         ]}
      ]},
      {id:'m33', codigo:'33', nome:'Campo Verde', cidade:'Passo Fundo/RS', pedidos:[
        {id:'p602082', numero:'602082', cliId:'5503', cliente:'Pedra Alta & Cia',
         entrega:'20/11/2026', emissao:'06/11/2026 07:11', fin:'Crédito Aprovado', exp:'Aguardando',
         itens:[
           {id:'i13201', codigo:'13201', nome:'Pão de Mel com Choc. ao Leite 200g', linha:'Pão de Mel',
            pedido:50, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'Aguardar liberação financeira',
            pacotesPorCaixa:24, caixasPorPalete:48, palete:null}
         ]}
      ]},
      {id:'m94', codigo:'94', nome:'Mostruário', cidade:'Interno', pedidos:[
        {id:'p612563', numero:'612563', cliId:'1640', cliente:'Laboratório Comercial',
         entrega:'06/11/2026', emissao:'06/11/2026 14:11', fin:'Liberado', exp:'Conferência',
         itens:[
           {id:'i1330', codigo:'1330', nome:'Amostra Cobertura Choc. ao Leite 200g', linha:'Amostras',
            pedido:5, estoque:2, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:10, caixasPorPalete:20, palete:null},
           {id:'i1332', codigo:'1332', nome:'Amostra Cobertura Choc. Meio Amargo 200g', linha:'Amostras',
            pedido:5, estoque:15, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:10, caixasPorPalete:20, palete:null}
         ]}
      ]},
      {id:'m8', codigo:'8', nome:'Porto Doce', cidade:'Porto Alegre/RS', pedidos:[
        {id:'p613072', numero:'613072', cliId:'4073', cliente:'Atacado Rio Grande Alimentos',
         entrega:'20/11/2026', emissao:'09/11/2026 08:11', fin:'Liberado', exp:'Aguardando',
         itens:[
           {id:'i10805', codigo:'10805', nome:'Salgadão sabor Bacon 100g', linha:'Salgadão',
            pedido:100, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:30, caixasPorPalete:48, palete:null},
           {id:'i11709', codigo:'11709', nome:'Biscoito de Amendoim 250g', linha:'Amendoim',
            pedido:30, estoque:0, op:0, nop:'', status:'Sem OP', prev:'', obs:'',
            pacotesPorCaixa:20, caixasPorPalete:50, palete:null}
         ]},
        {id:'p613180', numero:'613180', cliId:'4073', cliente:'Atacado Rio Grande Alimentos',
         entrega:'27/11/2026', emissao:'10/11/2026 11:05', fin:'Crédito Aprovado', exp:'Aguardando',
         itens:[
           {id:'i10812', codigo:'10812', nome:'Salgadão sabor Churrasco 100g', linha:'Salgadão',
            pedido:80, estoque:20, op:60, nop:'14210', status:'Aguardando Liberação', prev:'18/11/2026', obs:'',
            pacotesPorCaixa:30, caixasPorPalete:48, palete:palSeed('PBR 1,00 × 1,20', 8)}
         ]}
      ]}
    ]};
  }

  var DB=null;
  var S={ unid:'caixas', busca:'', funil:false,
          f:{prod:'',linha:'',marca:'',cli:'',fin:'',exp:'',sop:'',op:''},
          sort:{k:'', dir:''}, col:{} };

  function load(){
    var v=lsGet(LS_KEY, null);
    if(v && v.v===1 && v.data && Array.isArray(v.data.marcas)){
      DB=v.data;
      if(v.ui){
        S.unid=v.ui.unid||'caixas'; S.busca=v.ui.busca||'';
        S.f=Object.assign(S.f, v.ui.f||{}); S.sort=v.ui.sort||S.sort;
        S.col=v.ui.col||S.col||{};
      }
    } else {
      DB=seed();
      persist();
    }
    return DB;
  }
  function persist(){
    lsSet(LS_KEY, {v:1, data:DB, ui:{unid:S.unid, busca:S.busca, f:S.f, sort:S.sort, col:S.col}});
  }

  function parseN(n){ return typeof n==='number'?n:(parseFloat(String(n).replace(/\./g,'').replace(',','.'))||0); }
  function fmtQtd(n){
    if(!isFinite(n)) return '';
    var d=(Math.abs(n-Math.round(n))<1e-6)?0:1;
    return n.toLocaleString('pt-BR',{minimumFractionDigits:d, maximumFractionDigits:d});
  }
  /* Quantidades no seed estão em CAIXAS. */
  function qtd(it, campo){
    var n=parseN(it[campo]);
    if(S.unid==='pacotes') n=n*(it.pacotesPorCaixa||1);
    else if(S.unid==='paletes') n=n/(it.caixasPorPalete||1);
    return n;
  }

  var FILTROS=[
    ['prod','Produtos','prod'],
    ['linha','Linhas','linha'],
    ['marca','Marcas','marca'],
    ['cli','Clientes','cli'],
    ['fin','Status Financeiro','fin'],
    ['exp','Status Expedição','exp'],
    ['sop','Status OP','sop'],
    ['op','OP','op']
  ];

  function optsUnicas(){
    var o={prod:[],linha:[],marca:[],cli:[],fin:[],exp:[],sop:[],op:[]};
    var seen={};
    function add(k,v){ if(!v) return; var s=k+'::'+v; if(seen[s]) return; seen[s]=1; o[k].push(v); }
    (DB.marcas||[]).forEach(function(m){
      add('marca', m.nome);
      (m.pedidos||[]).forEach(function(p){
        add('cli', p.cliente); add('fin', p.fin); add('exp', p.exp);
        (p.itens||[]).forEach(function(it){
          add('prod', it.nome); add('linha', it.linha); add('sop', it.status); add('op', it.nop);
        });
      });
    });
    Object.keys(o).forEach(function(k){ o[k].sort(function(a,b){ return a.localeCompare(b,'pt-BR'); }); });
    return o;
  }

  function nFiltros(){
    return FILTROS.reduce(function(n,f){ return n+(S.f[f[0]]?1:0); },0);
  }

  function matchBusca(m,p,it,q){
    if(!q) return true;
    var blob=[m.nome,m.codigo,m.cidade,p.numero,p.cliente,p.cliId,it.codigo,it.nome,it.linha,it.nop,it.status,it.obs].join(' ').toLowerCase();
    return blob.indexOf(q)>=0;
  }
  function matchFiltro(m,p,it){
    var f=S.f;
    if(f.marca && f.marca!==m.nome) return false;
    if(f.cli && f.cli!==p.cliente) return false;
    if(f.fin && f.fin!==p.fin) return false;
    if(f.exp && f.exp!==p.exp) return false;
    if(f.prod && f.prod!==it.nome) return false;
    if(f.linha && f.linha!==it.linha) return false;
    if(f.sop && f.sop!==it.status) return false;
    if(f.op && f.op!==it.nop) return false;
    return true;
  }

  var STATUS_ORD={'Sem OP':0,'Aguardando Liberação':1,'Finalizada':2};
  var SORT_ACC={
    codigo:function(it){ return it.codigo; },
    produto:function(it){ return it.nome; },
    pedido:function(it){ return qtd(it,'pedido'); },
    estoque:function(it){ return qtd(it,'estoque'); },
    op:function(it){ return qtd(it,'op'); },
    nop:function(it){ return it.nop||''; },
    status:function(it){ return STATUS_ORD[it.status]!=null?STATUS_ORD[it.status]:9; },
    prev:function(it){ return it.prev||''; }
  };
  var SORT_NUM={pedido:1,estoque:1,op:1,status:1};

  function sortItens(itens){
    var k=S.sort.k, dir=S.sort.dir;
    if(!k || !SORT_ACC[k]) return itens.slice();
    var acc=SORT_ACC[k], num=!!SORT_NUM[k], sgn=dir==='desc'?-1:1;
    return itens.slice().sort(function(a,b){
      var va=acc(a), vb=acc(b);
      if(num) return (parseN(va)-parseN(vb))*sgn;
      return String(va).localeCompare(String(vb),'pt-BR',{numeric:true})*sgn;
    });
  }

  function visao(){
    var q=(S.busca||'').trim().toLowerCase();
    var out=[], nPed=0, nIt=0;
    (DB.marcas||[]).forEach(function(m){
      var peds=[];
      (m.pedidos||[]).forEach(function(p){
        var itens=(p.itens||[]).filter(function(it){ return matchFiltro(m,p,it) && matchBusca(m,p,it,q); });
        if(!itens.length) return;
        peds.push({p:p, itens:sortItens(itens)});
        nPed++; nIt+=itens.length;
      });
      if(peds.length) out.push({m:m, peds:peds});
    });
    return {grupos:out, nPed:nPed, nIt:nIt};
  }

  var STATUS_SHORT={'Finalizada':'Finalizada','Aguardando Liberação':'Aguard. lib.','Sem OP':'Sem OP'};
  function statusHTML(st){
    var map={'Finalizada':['ok','ti-check'],'Aguardando Liberação':['wait','ti-lock'],'Sem OP':['no','ti-x']};
    var x=map[st]||['','ti-dot'];
    var lab=STATUS_SHORT[st]||st||'';
    return '<span class="tr-st '+x[0]+'" title="'+esc(st||'')+'"><i class="ti '+x[1]+'"></i>'+esc(lab)+'</span>';
  }

  function unidLabel(){
    return S.unid==='pacotes'?'pacotes':(S.unid==='paletes'?'paletes':'caixas');
  }
  function unidLabelUp(){
    return S.unid==='pacotes'?'PACOTES':(S.unid==='paletes'?'PALETES':'CAIXAS');
  }

  function th(k,lab,cls){
    var on=S.sort.k===k, icon=on?(S.sort.dir==='desc'?'ti-chevron-down':'ti-chevron-up'):'ti-selector';
    return '<th class="so '+(cls||'')+(on?' on':'')+'" data-sort="'+k+'">'+lab+'<i class="ti '+icon+'"></i></th>';
  }

  function colgroupHTML(){
    return '<colgroup>'
      +'<col style="width:36px">'
      +'<col style="width:72px">'
      +'<col style="width:156px">'
      +'<col>'
      +'<col style="width:78px">'
      +'<col style="width:78px">'
      +'<col style="width:70px">'
      +'<col style="width:72px">'
      +'<col style="width:118px">'
      +'</colgroup>';
  }

  function theadHTML(){
    return '<thead>'
      +'<tr class="tr-hg">'
      +'<th colspan="4">Item</th>'
      +'<th colspan="3" class="g-start">Quantidades</th>'
      +'<th colspan="2" class="g-start">Produção</th>'
      +'</tr>'
      +'<tr class="tr-hc">'
      +'<th class="pal"></th>'
      +th('codigo','Código')
      +th('status','Status OP')
      +th('produto','Produto')
      +th('pedido','Pedido','num g-start')
      +th('estoque','Estoque','num')
      +th('op','OP','num')
      +th('nop','Nº OP','g-start')
      +th('prev','Prev. Produção')
      +'</tr></thead>';
  }

  function rowHTML(it, mid, pid){
    var note=it.obs?'<div class="note"><i class="ti ti-notes"></i>'+esc(it.obs)+'</div>':'';
    var has=!!(it.palete && it.palete.modelo);
    var hide=isHidden(mid,pid)?' is-hidden':'';
    return '<tr class="tr-item'+hide+'" data-mid="'+esc(mid)+'" data-pid="'+esc(pid)+'">'
      +'<td class="tr-palc"><button type="button" class="tr-pal'+(has?' has':'')+'" title="Palete" data-pal="'+esc(it.id)+'"><i class="ti ti-box"></i></button></td>'
      +'<td class="tr-cod">'+esc(it.codigo||'')+'</td>'
      +'<td class="tr-stc">'+statusHTML(it.status)+'</td>'
      +'<td class="tr-prod"><div class="nm">'+esc(it.nome)+'</div>'+note+'</td>'
      +'<td class="num g-start">'+(it.pedido!=null&&it.pedido!==''?fmtQtd(qtd(it,'pedido')):'')+'</td>'
      +'<td class="num">'+(it.estoque!=null&&it.estoque!==''?fmtQtd(qtd(it,'estoque')):'')+'</td>'
      +'<td class="num">'+(it.op!=null&&it.op!==''?fmtQtd(qtd(it,'op')):'')+'</td>'
      +'<td class="tr-nop g-start">'+esc(it.nop||'')+'</td>'
      +'<td class="tr-prev">'+esc(it.prev||'')+'</td>'
      +'</tr>';
  }

  function isCol(id){ return !!(S.col && S.col[id]); }
  function isHidden(mid, pid){ return isCol(mid) || (pid && isCol(pid)); }

  function marcaRow(g){
    var n=0; g.peds.forEach(function(x){ n+=x.itens.length; });
    var col=isCol(g.m.id);
    return '<tr class="tr-gmarca" data-mid="'+esc(g.m.id)+'" data-toggle="m" title="Recolher ou expandir marca">'
      +'<td colspan="9"><span class="tr-gbtn"><i class="ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch"></i>'
      +'<span class="tr-gmain"><span class="tr-gline"><span class="tr-gname">'+esc(g.m.codigo)+' — '+esc(g.m.nome)+'</span>'
      +'<span class="tr-cnt">'+n+'</span></span>'
      +(g.m.cidade?'<span class="city">'+esc(g.m.cidade)+'</span>':'')
      +'</span></span></td></tr>';
  }

  function pedRow(p, mid, nIt){
    var col=isCol(p.id);
    var hide=isCol(mid)?' is-hidden':'';
    return '<tr class="tr-gped'+hide+'" data-mid="'+esc(mid)+'" data-pid="'+esc(p.id)+'" data-toggle="p" title="Recolher ou expandir pedido">'
      +'<td colspan="9"><span class="tr-gbtn"><i class="ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch"></i>'
      +'<span class="tr-ped-block">'
      +'<span class="tr-ped-l1"><span class="plab">Pedido</span><span class="pn">'+esc(p.numero)+'</span>'
      +'<span class="dot">·</span>'
      +'<span class="cli">'+esc(p.cliente)+'</span>'
      +'<span class="cid">('+esc(p.cliId)+')</span>'
      +'<span class="tr-cnt">'+nIt+'</span></span>'
      +'<span class="tr-ped-l2">'
      +(p.entrega?'<span><b>Entrega</b>'+esc(p.entrega)+'</span>':'')
      +(p.emissao?'<span><b>Emissão</b>'+esc(p.emissao)+'</span>':'')
      +'</span></span></span></td></tr>';
  }

  function tableHTML(){
    var v=visao();
    if(!v.grupos.length){
      return '<table class="tr-tbl">'+colgroupHTML()+theadHTML()+'<tbody><tr><td colspan="9"><div class="tr-empty"><i class="ti ti-search-off"></i>Nenhum pedido encontrado.</div></td></tr></tbody></table>';
    }
    var h='<table class="tr-tbl">'+colgroupHTML()+theadHTML()+'<tbody>';
    v.grupos.forEach(function(g){
      h+=marcaRow(g);
      g.peds.forEach(function(x){
        h+=pedRow(x.p, g.m.id, x.itens.length);
        x.itens.forEach(function(it){ h+=rowHTML(it, g.m.id, x.p.id); });
      });
    });
    return h+'</tbody></table>';
  }

  function funilHTML(){
    if(!S.funil) return '';
    var opts=optsUnicas();
    var grupos=FILTROS.map(function(f){
      var todos=f[0]==='linha'||f[0]==='marca'||f[0]==='op'?'Todas':'Todos';
      var lis=opts[f[2]]||[];
      var sel=S.f[f[0]]||'';
      return '<div class="tr-fgrp"><b>'+esc(f[1])+'</b><select class="tr-fsel" data-fk="'+f[0]+'">'
        +'<option value="">'+todos+'</option>'
        +lis.map(function(v){ return '<option value="'+esc(v)+'"'+(v===sel?' selected':'')+'>'+esc(v)+'</option>'; }).join('')
        +'</select></div>';
    }).join('');
    return '<div class="tr-fpop" id="tr-fpop"><div class="tr-fpop-h"><u data-act="limpar">Limpar filtros</u></div>'+grupos+'</div>';
  }

  function toolsHTML(v){
    v=v||visao();
    var n=nFiltros();
    var meta=v.nIt+' '+(v.nIt===1?'item':'itens')+' · '+v.nPed+' pedido'+(v.nPed===1?'':'s')+' · unidades: '+unidLabelUp();
    return '<div class="tr-tools"><div class="tr-tools-meta">'+esc(meta)+'</div><div class="tr-tools-right">'
      +'<div class="tr-unit"><span class="ulab">Quantidades em</span><div class="tr-seg">'
      +'<button type="button" data-unid="pacotes"'+(S.unid==='pacotes'?' class="on"':'')+'>Pacotes</button>'
      +'<button type="button" data-unid="caixas"'+(S.unid==='caixas'?' class="on"':'')+'>Caixas</button>'
      +'<button type="button" data-unid="paletes"'+(S.unid==='paletes'?' class="on"':'')+'>Paletes</button>'
      +'</div></div>'
      +'<span class="tr-buscaw"><i class="ti ti-search"></i><input class="tr-busca" id="tr-busca" value="'+esc(S.busca)+'" placeholder="Buscar pedido, produto ou OP…"></span>'
      +'<span class="tr-pop-wrap">'
      +'<button type="button" class="tr-abtn'+(S.funil||n?' on':'')+'" data-act="funil" title="Filtros"><i class="ti ti-filter"></i>'
      +(n?'<span class="tr-abtn-badge">'+n+'</span>':'')+'</button>'
      +funilHTML()
      +'</span></div></div>';
  }

  function sheetHTML(){
    return '<div class="tr-sheet">'+toolsHTML()+ '<div class="tr-scroller">'+tableHTML()+'</div></div>';
  }

  var MAIN=null;
  function bind(root){
    root.querySelectorAll('[data-unid]').forEach(function(b){
      b.addEventListener('click',function(){ S.unid=b.getAttribute('data-unid'); persist(); refresh(); });
    });
    var busca=root.querySelector('#tr-busca');
    if(busca){
      busca.addEventListener('input',function(){ S.busca=busca.value; persist(); refreshSheet(); });
    }
    var funil=root.querySelector('[data-act="funil"]');
    if(funil) funil.addEventListener('click',function(e){ e.stopPropagation(); S.funil=!S.funil; refresh(); });
    var limpar=root.querySelector('[data-act="limpar"]');
    if(limpar) limpar.addEventListener('click',function(){
      FILTROS.forEach(function(f){ S.f[f[0]]=''; }); persist(); refresh();
    });
    root.querySelectorAll('.tr-fsel').forEach(function(sel){
      sel.addEventListener('change',function(){ S.f[sel.getAttribute('data-fk')]=sel.value; persist(); refresh(); });
    });
    root.querySelectorAll('th[data-sort]').forEach(function(thEl){
      thEl.addEventListener('click',function(){
        var k=thEl.getAttribute('data-sort');
        if(S.sort.k===k) S.sort.dir=S.sort.dir==='asc'?'desc':'asc';
        else { S.sort.k=k; S.sort.dir=SORT_NUM[k]?'desc':'asc'; }
        persist(); refreshSheet();
      });
    });
    root.querySelectorAll('[data-pal]').forEach(function(btn){
      btn.addEventListener('click',function(e){ e.stopPropagation(); abrirPalete(btn.getAttribute('data-pal')); });
    });
    root.querySelectorAll('[data-toggle]').forEach(function(tr){
      tr.addEventListener('click',function(){
        var kind=tr.getAttribute('data-toggle');
        var id=kind==='m'?tr.getAttribute('data-mid'):tr.getAttribute('data-pid');
        if(!id) return;
        S.col=S.col||{};
        S.col[id]=!S.col[id];
        persist();
        applyCollapse(root);
      });
    });
  }

  function applyCollapse(root){
    root=root||MAIN;
    if(!root) return;
    root.querySelectorAll('tr.tr-gmarca').forEach(function(tr){
      var id=tr.getAttribute('data-mid');
      var col=isCol(id);
      var ic=tr.querySelector('i.ch');
      if(ic) ic.className='ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch';
    });
    root.querySelectorAll('tr.tr-gped').forEach(function(tr){
      var mid=tr.getAttribute('data-mid'), pid=tr.getAttribute('data-pid');
      var col=isCol(pid);
      var ic=tr.querySelector('i.ch');
      if(ic) ic.className='ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch';
      tr.classList.toggle('is-hidden', isCol(mid));
    });
    root.querySelectorAll('tr.tr-item').forEach(function(tr){
      var mid=tr.getAttribute('data-mid'), pid=tr.getAttribute('data-pid');
      tr.classList.toggle('is-hidden', isHidden(mid,pid));
    });
  }

  function findItem(id){
    var found=null;
    (DB.marcas||[]).some(function(m){
      return (m.pedidos||[]).some(function(p){
        return (p.itens||[]).some(function(it){ if(it.id===id){ found=it; return true; } return false; });
      });
    });
    return found;
  }
  function abrirPalete(id){
    var it=findItem(id); if(!it) return;
    var label=(it.codigo?it.codigo+' — ':'')+it.nome;
    if(window.MP && typeof MP.verPalete==='function') MP.verPalete(it.palete||null, label);
    else if(typeof toast==='function') toast('Não foi possível abrir o palete.');
  }

  function refreshSheet(){
    if(!MAIN) return;
    var sheet=MAIN.querySelector('.tr-sheet');
    if(!sheet){ refresh(); return; }
    var caret=-1, foc=false;
    var b=MAIN.querySelector('#tr-busca');
    if(b && document.activeElement===b){ foc=true; try{ caret=b.selectionStart; }catch(e){} }
    var tmp=document.createElement('div');
    tmp.innerHTML=sheetHTML();
    sheet.replaceWith(tmp.firstElementChild);
    bind(MAIN);
    if(foc){
      var n=MAIN.querySelector('#tr-busca');
      if(n){ n.focus(); if(caret>=0) try{ n.setSelectionRange(caret,caret);}catch(e){} }
    }
  }

  function refresh(){
    if(!MAIN) return;
    var caret=-1, foc=false;
    var b=MAIN.querySelector('#tr-busca');
    if(b && document.activeElement===b){ foc=true; try{ caret=b.selectionStart; }catch(e){} }
    render(MAIN);
    if(foc){
      var n=MAIN.querySelector('#tr-busca');
      if(n){ n.focus(); if(caret>=0) try{ n.setSelectionRange(caret,caret);}catch(e){} }
    }
  }

  function closer(e){
    var t=e&&e.target;
    if(t&&t.closest&&t.closest('.tr-pop-wrap')) return;
    if(S.funil){ S.funil=false; refresh(); }
  }
  if(!window.__trFunilCloser){
    window.__trFunilCloser=closer;
    document.addEventListener('mousedown', window.__trFunilCloser);
  }

  function render(main){
    MAIN=main;
    load();
    var v=visao();
    var sub='Pedidos de industrialização — '+v.nPed+' pedido'+(v.nPed===1?'':'s')+' · '+v.nIt+' '+(v.nIt===1?'item':'itens')+' · quantidades em '+unidLabel();
    main.innerHTML='<div class="tr-wrap" style="padding:20px 4px 80px">'
      +'<div class="tr-head"><div><h2><i class="ti ti-building-warehouse"></i> Terceiros</h2><p>'+sub+'</p></div></div>'
      +sheetHTML()
      +'</div>';
    bind(main);
  }

  window.TR={
    render:render,
    setUnid:function(u){ S.unid=u; persist(); if(MAIN) refresh(); },
    _db:function(){ load(); return DB; },
    _reset:function(){ DB=seed(); S={unid:'caixas',busca:'',funil:false,f:{prod:'',linha:'',marca:'',cli:'',fin:'',exp:'',sop:'',op:''},sort:{k:'',dir:''},col:{}}; persist(); if(MAIN) refresh(); }
  };
})();
