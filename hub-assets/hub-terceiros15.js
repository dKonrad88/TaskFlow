/* ══ PCP › TERCEIROS (hub-terceiros15)
   Planilha no padrão da Cobertura do Hub (v8): layout igual ao v7.
   Só o cabeçalho das colunas congela ao rolar (cinza #CDD2D2), sob a
   barra do Hub. A barra de ferramentas rola com a página.
   Observações é a última coluna (ordem padrão). A linha da marca junta
   código, nome, cliente e cidade no título principal. A linha do pedido
   mostra só o número. Sem coluna Cliente; linhas de item em uma só linha,
   sem quebra. Colunas arrastáveis (ordem em
   taskflow_terceiros.ui.colOrder). A planilha cabe na largura da tela,
   sem barra de rolagem horizontal. Status OP paleta Cobertura; marca #E7EBEB;
   pedido no branco da tabela.
   Dados no localStorage (chave taskflow_terceiros), sempre via safeSetItem.
   Entrada: renderProducao() chama TR.render(main) quando producaoView==='terceiros'.
   Grupo Embalagens (13/11/2026): Etiqueta / Filme / Caixa antes de Observações, com o estoque
   atual da aba Contagem (hub-contagem1, CTG.emb); vermelho no mínimo ou abaixo, "—" se não usa.
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
          f:{linha:'',marca:'',fin:'',sop:''},
          sort:{k:'', dir:''}, col:{}, colOrder:null };

  function load(){
    var v=lsGet(LS_KEY, null);
    if(v && v.v===1 && v.data && Array.isArray(v.data.marcas)){
      DB=v.data;
      if(v.ui){
        S.unid=v.ui.unid||'caixas'; S.busca=v.ui.busca||'';
        var fIn=v.ui.f||{}, keep={linha:1,marca:1,fin:1,sop:1}; Object.keys(fIn).forEach(function(k){ if(keep[k]) S.f[k]=fIn[k]; }); S.sort=v.ui.sort||S.sort;
        S.col=v.ui.col||S.col||{};
        S.colOrder=normalizeOrder(v.ui.colOrder);
      }
    } else {
      DB=seed();
      S.colOrder=COL_DEFAULT.slice();
      persist();
    }
    S.colOrder=normalizeOrder(S.colOrder);
    return DB;
  }
  function persist(){
    lsSet(LS_KEY, {v:1, data:DB, ui:{unid:S.unid, busca:S.busca, f:S.f, sort:S.sort, col:S.col, colOrder:colOrder()}});
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
    ['linha','Linhas','linha'],
    ['marca','Marcas','marca'],
    ['fin','Status Financeiro','fin'],
    ['sop','Status OP','sop']
  ];

  function optsUnicas(){
    var o={linha:[],marca:[],fin:[],sop:[]};
    var seen={};
    function add(k,v){ if(!v) return; var s=k+'::'+v; if(seen[s]) return; seen[s]=1; o[k].push(v); }
    (DB.marcas||[]).forEach(function(m){
      add('marca', m.nome);
      (m.pedidos||[]).forEach(function(p){
        add('fin', p.fin);
        (p.itens||[]).forEach(function(it){
          add('linha', it.linha); add('sop', it.status);
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
    if(f.fin && f.fin!==p.fin) return false;
    if(f.linha && f.linha!==it.linha) return false;
    if(f.sop && f.sop!==it.status) return false;
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
    prev:function(it){ return it.prev||''; },
    entrega:function(it,p){ return (p&&p.entrega)||''; },
    emissao:function(it,p){ return (p&&p.emissao)||''; },
    obs:function(it){ return it.obs||''; },
    etq:function(it){ return window.CTG?CTG.sortTerceiros('etq',it.codigo):-1; },
    fil:function(it){ return window.CTG?CTG.sortTerceiros('fil',it.codigo):-1; },
    cxa:function(it){ return window.CTG?CTG.sortTerceiros('cxa',it.codigo):-1; }
  };
  var SORT_NUM={pedido:1,estoque:1,op:1,status:1,etq:1,fil:1,cxa:1};
  var SORT_DATE={entrega:1,emissao:1};
  var SORT_PED={entrega:1,emissao:1};

  function parseDateBR(s){
    var m=String(s||'').match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if(!m) return 0;
    return Date.UTC(+m[3], +m[2]-1, +m[1], +(m[4]||0), +(m[5]||0));
  }
  function cmpVal(va, vb, k, sgn){
    if(SORT_DATE[k]) return (parseDateBR(va)-parseDateBR(vb))*sgn;
    if(SORT_NUM[k]) return (parseN(va)-parseN(vb))*sgn;
    return String(va).localeCompare(String(vb),'pt-BR',{numeric:true})*sgn;
  }

  function sortItens(itens, p){
    var k=S.sort.k, dir=S.sort.dir;
    if(!k || !SORT_ACC[k]) return itens.slice();
    var acc=SORT_ACC[k], sgn=dir==='desc'?-1:1;
    return itens.slice().sort(function(a,b){ return cmpVal(acc(a,p), acc(b,p), k, sgn); });
  }
  function sortPeds(peds){
    var k=S.sort.k, dir=S.sort.dir;
    if(!k || !SORT_PED[k] || !SORT_ACC[k]) return peds;
    var acc=SORT_ACC[k], sgn=dir==='desc'?-1:1;
    return peds.slice().sort(function(a,b){ return cmpVal(acc(null,a.p), acc(null,b.p), k, sgn); });
  }

  function visao(){
    var q=(S.busca||'').trim().toLowerCase();
    var out=[], nPed=0, nIt=0;
    (DB.marcas||[]).forEach(function(m){
      var peds=[];
      (m.pedidos||[]).forEach(function(p){
        var itens=(p.itens||[]).filter(function(it){ return matchFiltro(m,p,it) && matchBusca(m,p,it,q); });
        if(!itens.length) return;
        peds.push({p:p, itens:sortItens(itens, p)});
        nPed++; nIt+=itens.length;
      });
      if(peds.length) out.push({m:m, peds:sortPeds(peds)});
    });
    return {grupos:out, nPed:nPed, nIt:nIt};
  }

  var STATUS_SHORT={'Finalizada':'Finalizada','Aguardando Liberação':'Aguard. lib.','Sem OP':'Sem OP'};
  var STATUS_MAP={'Finalizada':['ok','ti-check'],'Aguardando Liberação':['wait','ti-lock'],'Sem OP':['no','ti-x']};
  function statusClass(st){ return (STATUS_MAP[st]||['otr','ti-dot'])[0]; }
  function statusHTML(st){
    var x=STATUS_MAP[st]||['otr','ti-dot'];
    var lab=STATUS_SHORT[st]||st||'';
    return '<span class="tr-st '+x[0]+'" title="'+esc(st||'')+'"><i class="ti '+x[1]+'"></i>'+esc(lab)+'</span>';
  }

  function unidLabel(){
    return S.unid==='pacotes'?'pacotes':(S.unid==='paletes'?'paletes':'caixas');
  }
  function unidLabelUp(){
    return S.unid==='pacotes'?'PACOTES':(S.unid==='paletes'?'PALETES':'CAIXAS');
  }

  var COL_DEFAULT=['codigo','status','produto','pedido','estoque','op','nop','prev','entrega','emissao','etq','fil','cxa','obs'];
  var COL_DEF={
    codigo:{share:54, lab:'Código', group:'Item'},
    status:{share:112, lab:'Status OP', group:'Item'},
    produto:{share:196, lab:'Produto', group:'Item'},
    pedido:{share:64, lab:'Pedido', group:'Quantidades', num:1},
    estoque:{share:64, lab:'Estoque', group:'Quantidades', num:1},
    op:{share:58, lab:'OP', group:'Quantidades', num:1},
    nop:{share:56, lab:'Nº OP', group:'Produção'},
    prev:{share:92, lab:'Prev. Produção', group:'Produção'},
    entrega:{share:80, lab:'Entrega', group:'Datas'},
    emissao:{share:100, lab:'Emissão', group:'Datas'},
    // Embalagens (13/11/2026): estoque atual da aba Contagem (CTG.emb) — mesma fonte
    etq:{share:60, lab:'Etiqueta', group:'Embalagens', num:1},
    fil:{share:48, lab:'Filme', group:'Embalagens', num:1},
    cxa:{share:48, lab:'Caixa', group:'Embalagens', num:1},
    obs:{share:92, lab:'Observações', group:'Observações'}
  };
  var COL_SHARE_TOT=0;
  Object.keys(COL_DEF).forEach(function(k){ COL_SHARE_TOT+=COL_DEF[k].share; });
  var COL_SHARE_ALL=COL_SHARE_TOT+36;
  function colWidth(k){
    var s=k==='__pal__'?36:COL_DEF[k].share;
    return (100*s/COL_SHARE_ALL).toFixed(4)+'%';
  }
  var DRAG_THRESH=8;

  function normalizeOrder(arr){
    var seen={}, out=[];
    if(Array.isArray(arr)){
      arr.forEach(function(k){
        if(COL_DEF[k] && !seen[k]){ seen[k]=1; out.push(k); }
      });
    }
    // ordem salva antes das Embalagens: encaixa as colunas novas antes de Observações
    ['etq','fil','cxa'].forEach(function(k){ if(out.length && !seen[k]){ var i=out.indexOf('obs'); if(i<0) out.push(k); else out.splice(i,0,k); seen[k]=1; } });
    if(out.length!==COL_DEFAULT.length) return COL_DEFAULT.slice();
    return out;
  }
  function colOrder(){ return normalizeOrder(S.colOrder); }
  function orderIsDefault(){
    var a=colOrder();
    return a.every(function(k,i){ return k===COL_DEFAULT[i]; });
  }
  function groupStarts(){
    var keys=colOrder(), starts={}, prev='Item';
    keys.forEach(function(k){
      var g=COL_DEF[k].group;
      if(g!==prev) starts[k]=1;
      prev=g;
    });
    return starts;
  }
  function groupBands(){
    var keys=['__pal__'].concat(colOrder());
    var bands=[], i, g;
    for(i=0;i<keys.length;i++){
      g=keys[i]==='__pal__'?'Item':COL_DEF[keys[i]].group;
      if(bands.length && bands[bands.length-1].name===g) bands[bands.length-1].span++;
      else bands.push({name:g, span:1});
    }
    return bands;
  }
  function gs(k, starts){ return starts[k]?' g-start':''; }

  function th(k, starts){
    var d=COL_DEF[k];
    var on=S.sort.k===k, icon=on?(S.sort.dir==='desc'?'ti-chevron-down':'ti-chevron-up'):'ti-selector';
    var cls='so'+(d.num?' num':'')+gs(k, starts)+(on?' on':'');
    return '<th class="'+cls+'" data-sort="'+k+'" data-col="'+k+'" title="Clique para ordenar · arraste para mover">'+d.lab+'<i class="ti '+icon+'"></i></th>';
  }

  function colgroupHTML(){
    var h='<colgroup><col style="width:'+colWidth('__pal__')+'">';
    colOrder().forEach(function(k){ h+='<col style="width:'+colWidth(k)+'">'; });
    return h+'</colgroup>';
  }

  function theadHTML(){
    var starts=groupStarts();
    var bands=groupBands();
    var hg='<tr class="tr-hg">';
    bands.forEach(function(b,i){
      hg+='<th colspan="'+b.span+'"'+(i?' class="g-start"':'')+'>'+b.name+'</th>';
    });
    hg+='</tr>';
    var hc='<tr class="tr-hc"><th class="pal"></th>';
    colOrder().forEach(function(k){ hc+=th(k, starts); });
    hc+='</tr>';
    return '<thead>'+hg+hc+'</thead>';
  }

  function cellHTML(k, it, p, starts){
    var g=gs(k, starts);
    if(k==='codigo') return '<td class="tr-cod'+g+'">'+esc(it.codigo||'')+'</td>';
    if(k==='status') return '<td class="tr-stc '+statusClass(it.status)+g+'">'+statusHTML(it.status)+'</td>';
    if(k==='produto') return '<td class="tr-prod'+g+'"><div class="nm">'+esc(it.nome)+'</div></td>';
    if(k==='pedido') return '<td class="num'+g+'">'+(it.pedido!=null&&it.pedido!==''?fmtQtd(qtd(it,'pedido')):'')+'</td>';
    if(k==='estoque') return '<td class="num'+g+'">'+(it.estoque!=null&&it.estoque!==''?fmtQtd(qtd(it,'estoque')):'')+'</td>';
    if(k==='op') return '<td class="num'+g+'">'+(it.op!=null&&it.op!==''?fmtQtd(qtd(it,'op')):'')+'</td>';
    if(k==='nop') return '<td class="tr-nop'+g+'">'+esc(it.nop||'')+'</td>';
    if(k==='prev') return '<td class="tr-prev'+g+'">'+esc(it.prev||'')+'</td>';
    if(k==='entrega') return '<td class="tr-ent'+g+'">'+esc((p&&p.entrega)||'')+'</td>';
    if(k==='emissao'){ var em=String((p&&p.emissao)||''), sp=em.indexOf(' '); // hora some em telas estreitas (CSS)
      return '<td class="tr-emi'+g+'"'+(em?' title="'+esc(em)+'"':'')+'>'+(sp>0?esc(em.slice(0,sp))+'<span class="h">'+esc(em.slice(sp+1))+'</span>':esc(em))+'</td>'; }
    if(k==='etq'||k==='fil'||k==='cxa') return window.CTG?CTG.cellTerceiros(k, it.codigo, g):'<td class="tr-emb'+g+'"></td>';
    if(k==='obs'){
      var raw=it.obs||'';
      var obs=raw?'<span class="tr-obs-t">'+esc(raw)+'</span>':'';
      return '<td class="tr-obs'+g+'"'+(raw?' title="'+esc(raw)+'"':'')+'>'+obs+'</td>';
    }
    return '<td></td>';
  }

  function rowHTML(it, mid, p, idx){
    var pid=p&&p.id||'';
    var has=!!(it.palete && it.palete.modelo);
    var hide=isHidden(mid,pid)?' is-hidden':'';
    var zebra=(idx%2===0)?' tr-z':'';
    var starts=groupStarts();
    var h='<tr class="tr-item'+zebra+hide+'" data-mid="'+esc(mid)+'" data-pid="'+esc(pid)+'">'
      +'<td class="tr-palc"><button type="button" class="tr-pal'+(has?' has':'')+'" title="Palete" data-pal="'+esc(it.id)+'"><i class="ti ti-box"></i></button></td>';
    colOrder().forEach(function(k){ h+=cellHTML(k, it, p, starts); });
    return h+'</tr>';
  }

  function isCol(id){ return !!(S.col && S.col[id]); }
  function isHidden(mid, pid){ return isCol(mid) || (pid && isCol(pid)); }

  function marcaClients(peds){
    var seen={}, out=[];
    (peds||[]).forEach(function(x){
      var p=x&&x.p?x.p:x;
      var id=String((p&&p.cliId)||''), nome=(p&&p.cliente)||'';
      if(!id && !nome) return;
      var key=id+'\0'+nome;
      if(!seen[key]){ seen[key]=1; out.push({cliId:id, cliente:nome}); }
    });
    return out;
  }
  function fmtCliPart(c){
    if(c.cliId && c.cliente) return c.cliId+' — '+c.cliente;
    return c.cliId||c.cliente||'';
  }
  function marcaRow(g){
    var n=0; g.peds.forEach(function(x){ n+=x.itens.length; });
    var col=isCol(g.m.id);
    var clis=marcaClients(g.peds);
    var cliTxt=clis.map(fmtCliPart).filter(Boolean).join('; ');
    var title=[(g.m.codigo||'')+' — '+(g.m.nome||''), cliTxt?('('+cliTxt+')'):'', g.m.cidade?('— '+g.m.cidade):''].filter(Boolean).join(' ');
    return '<tr class="tr-gmarca" data-mid="'+esc(g.m.id)+'" data-toggle="m" title="'+esc(title)+'">'
      +'<td colspan="'+(colOrder().length+1)+'"><span class="tr-gbtn"><i class="ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch"></i>'
      +'<span class="tr-gmain"><span class="tr-gline"><span class="tr-gtitle">'
      +'<span class="tr-gname">'+esc(g.m.codigo)+' — '+esc(g.m.nome)+'</span>'
      +(cliTxt?'<span class="tr-gcli">('+esc(cliTxt)+')</span>':'')
      +(g.m.cidade?'<span class="sep"> — </span><span class="city">'+esc(g.m.cidade)+'</span>':'')
      +'</span><span class="tr-cnt">'+n+'</span></span>'
      +'</span></span></td></tr>';
  }

  function pedRow(p, mid, nIt){
    var col=isCol(p.id);
    var hide=isCol(mid)?' is-hidden':'';
    return '<tr class="tr-gped'+hide+'" data-mid="'+esc(mid)+'" data-pid="'+esc(p.id)+'" data-toggle="p" title="Recolher ou expandir pedido">'
      +'<td colspan="'+(colOrder().length+1)+'"><span class="tr-gbtn"><i class="ti '+(col?'ti-chevron-right':'ti-chevron-down')+' ch"></i>'
      +'<span class="tr-ped-l1"><span class="plab">Pedido</span><span class="pn">'+esc(p.numero)+'</span>'
      +'<span class="tr-cnt">'+nIt+'</span></span></span></td></tr>';
  }

  function cardTable(inner){
    return '<table class="tr-tbl">'+colgroupHTML()+'<tbody>'+inner+'</tbody></table>';
  }

  function cardsHTML(){
    var v=visao();
    if(!v.grupos.length){
      return '<div class="tr-cards"><article class="tr-card">'+cardTable('<tr><td colspan="'+(colOrder().length+1)+'"><div class="tr-empty"><i class="ti ti-search-off"></i>Nenhum pedido encontrado.</div></td></tr>')+'</article></div>';
    }
    var h='<div class="tr-cards">';
    v.grupos.forEach(function(g){
      var inner=marcaRow(g);
      g.peds.forEach(function(x){
        inner+=pedRow(x.p, g.m.id, x.itens.length);
        x.itens.forEach(function(it,i){ inner+=rowHTML(it, g.m.id, x.p, i); });
      });
      h+='<article class="tr-card" data-mid="'+esc(g.m.id)+'">'+cardTable(inner)+'</article>';
    });
    return h+'</div>';
  }

  function headTblHTML(){
    return '<div class="tr-headtbl"><div class="tr-headtbl-in"><table class="tr-tbl">'+colgroupHTML()+theadHTML()+'</table></div></div>';
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
    return '<div class="tr-fpop" id="tr-fpop"><div class="tr-fpop-h"><u data-act="limpar">Limpar filtros</u></div>'+grupos
      +'<div class="tr-fpop-foot"><u data-act="restore-cols">Restaurar ordem das colunas</u></div></div>';
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
    return '<div class="tr-body">'+toolsHTML()+headTblHTML()+cardsHTML()+'</div>';
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
    var rest=root.querySelector('[data-act="restore-cols"]');
    if(rest) rest.addEventListener('click',function(e){
      e.stopPropagation();
      S.colOrder=COL_DEFAULT.slice();
      persist(); refresh();
    });
    bindColDrag(root);
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
    bindHScroll(root);
  }

  function bindHScroll(root){
    var head=root.querySelector('.tr-headtbl-in');
    var cards=Array.prototype.slice.call(root.querySelectorAll('.tr-card'));
    if(!head) return;
    var lock=false;
    function sync(from){
      if(lock) return;
      lock=true;
      var x=from.scrollLeft;
      if(from!==head) head.scrollLeft=x;
      cards.forEach(function(c){ if(c!==from) c.scrollLeft=x; });
      lock=false;
    }
    head.addEventListener('scroll', function(){ sync(head); });
    cards.forEach(function(c){ c.addEventListener('scroll', function(){ sync(c); }); });
  }

  var COLDRAG=null;
  function bindColDrag(root){
    var head=root.querySelector('.tr-headtbl thead tr.tr-hc');
    if(!head) return;
    head.querySelectorAll('th[data-sort]').forEach(function(th){
      th.addEventListener('pointerdown', onColDown);
    });
  }
  function sheetScrollX(){
    var el=MAIN && MAIN.querySelector('.tr-headtbl-in');
    return el?el.scrollLeft:0;
  }
  function setSheetScrollX(x){
    var el=MAIN && MAIN.querySelector('.tr-headtbl-in');
    if(el) el.scrollLeft=x;
  }
  function applyColMove(from, to){
    var a=colOrder().slice();
    if(from<0 || from>=a.length) return false;
    if(to>from) to--;
    if(to<0) to=0;
    if(to>a.length) to=a.length;
    if(to===from) return false;
    var k=a.splice(from,1)[0];
    a.splice(to,0,k);
    S.colOrder=a;
    persist();
    var x=sheetScrollX();
    refreshSheet();
    setSheetScrollX(x);
    return true;
  }
  function sortByKey(k){
    if(S.sort.k===k) S.sort.dir=S.sort.dir==='asc'?'desc':'asc';
    else { S.sort.k=k; S.sort.dir=SORT_NUM[k]?'desc':'asc'; }
    persist(); refreshSheet();
  }
  function colThs(){
    if(!MAIN) return [];
    return Array.prototype.slice.call(MAIN.querySelectorAll('.tr-headtbl thead tr.tr-hc th[data-sort]'));
  }
  function dropIdxAt(clientX){
    var ths=colThs(), i, r;
    for(i=0;i<ths.length;i++){
      r=ths[i].getBoundingClientRect();
      if(clientX < r.left + r.width/2) return i;
    }
    return ths.length;
  }
  function indicatorX(idx){
    var ths=colThs();
    if(!ths.length) return 0;
    if(idx<=0) return ths[0].getBoundingClientRect().left;
    if(idx>=ths.length) return ths[ths.length-1].getBoundingClientRect().right;
    return ths[idx].getBoundingClientRect().left;
  }
  function clearColDragUI(){
    document.body.classList.remove('tr-col-dragging');
    var g=document.getElementById('tr-col-ghost');
    var n=document.getElementById('tr-col-ind');
    if(g && g.parentNode) g.parentNode.removeChild(g);
    if(n && n.parentNode) n.parentNode.removeChild(n);
    if(MAIN) MAIN.querySelectorAll('th.is-dragging').forEach(function(el){ el.classList.remove('is-dragging'); });
  }
  function startColGhost(d, e){
    d.th.classList.add('is-dragging');
    document.body.classList.add('tr-col-dragging');
    var ghost=document.createElement('div');
    ghost.id='tr-col-ghost';
    ghost.className='tr-col-ghost';
    ghost.textContent=COL_DEF[d.k].lab;
    var r=d.th.getBoundingClientRect();
    ghost.style.width=Math.max(72, r.width)+'px';
    ghost.style.height=r.height+'px';
    document.body.appendChild(ghost);
    var ind=document.createElement('div');
    ind.id='tr-col-ind';
    ind.className='tr-col-ind';
    document.body.appendChild(ind);
    d.ghost=ghost; d.ind=ind;
    d.offX=e.clientX-r.left; d.offY=e.clientY-r.top;
    try{ d.th.setPointerCapture(d.pointerId); }catch(err){}
    placeColGhost(d, e);
  }
  function placeColGhost(d, e){
    if(!d.ghost) return;
    d.ghost.style.left=(e.clientX - (d.offX||24))+'px';
    d.ghost.style.top=(e.clientY - (d.offY||10))+'px';
    var idx=dropIdxAt(e.clientX);
    d.dropIdx=idx;
    var x=indicatorX(idx);
    var head=MAIN && MAIN.querySelector('.tr-headtbl');
    var wrap=MAIN && MAIN.querySelector('.tr-wrap');
    var top=head?head.getBoundingClientRect().top:e.clientY;
    var bot=wrap?Math.min(wrap.getBoundingClientRect().bottom, window.innerHeight):top+56;
    d.ind.style.left=(x-1)+'px';
    d.ind.style.top=top+'px';
    d.ind.style.height=Math.max(56, bot-top)+'px';
  }
  function autoHScroll(e){
    var box=MAIN && MAIN.querySelector('.tr-headtbl-in');
    if(!box) return;
    var r=box.getBoundingClientRect();
    var edge=44, step=0;
    if(e.clientX < r.left+edge) step=-Math.ceil((edge-(e.clientX-r.left))/3);
    else if(e.clientX > r.right-edge) step=Math.ceil((e.clientX-(r.right-edge))/3);
    if(step){
      step=Math.max(-28, Math.min(28, step));
      box.scrollLeft += step;
    }
  }
  function onColDown(e){
    if(e.button!==0) return;
    var th=e.currentTarget;
    var k=th.getAttribute('data-sort');
    if(!k || !COL_DEF[k]) return;
    if(COLDRAG) clearColDragUI();
    COLDRAG={k:k, th:th, startX:e.clientX, startY:e.clientY, moved:false, pointerId:e.pointerId, from:colOrder().indexOf(k), dropIdx:null};
    window.addEventListener('pointermove', onColMove);
    window.addEventListener('pointerup', onColUp);
    window.addEventListener('pointercancel', onColUp);
    e.preventDefault();
  }
  function onColMove(e){
    var d=COLDRAG; if(!d) return;
    if(!d.moved){
      var dx=e.clientX-d.startX, dy=e.clientY-d.startY;
      if(Math.sqrt(dx*dx+dy*dy)<DRAG_THRESH) return;
      d.moved=true;
      startColGhost(d, e);
    }
    autoHScroll(e);
    placeColGhost(d, e);
  }
  function onColUp(e){
    window.removeEventListener('pointermove', onColMove);
    window.removeEventListener('pointerup', onColUp);
    window.removeEventListener('pointercancel', onColUp);
    var d=COLDRAG; COLDRAG=null;
    if(!d) return;
    var moved=d.moved;
    var k=d.k, from=d.from, to=d.dropIdx;
    clearColDragUI();
    if(moved){
      if(to!=null && to!==from && to!==from+1) applyColMove(from, to);
    } else {
      sortByKey(k);
    }
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
    var sheet=MAIN.querySelector('.tr-body');
    if(!sheet){ refresh(); return; }
    var caret=-1, foc=false, hx=sheetScrollX();
    var b=MAIN.querySelector('#tr-busca');
    if(b && document.activeElement===b){ foc=true; try{ caret=b.selectionStart; }catch(e){} }
    var tmp=document.createElement('div');
    tmp.innerHTML=sheetHTML();
    sheet.replaceWith(tmp.firstElementChild);
    bind(MAIN);
    setSheetScrollX(hx);
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
    colOrder:function(){ return colOrder().slice(); },
    setColOrder:function(a){ S.colOrder=normalizeOrder(a); persist(); if(MAIN) refreshSheet(); },
    resetColOrder:function(){ S.colOrder=COL_DEFAULT.slice(); persist(); if(MAIN) refresh(); },
    _reset:function(){ DB=seed(); S={unid:'caixas',busca:'',funil:false,f:{linha:'',marca:'',fin:'',sop:''},sort:{k:'',dir:''},col:{},colOrder:COL_DEFAULT.slice()}; persist(); if(MAIN) refresh(); }
  };
})();
