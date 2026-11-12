/* ══ COMERCIAL › COBERTURA (hub-cobertura1)
   Planilha de semanas: demanda e entregas por produto, dia a dia, com os
   pedidos em aberto num resumo recolhível acima. Tela diferente da
   PCP › Cobertura (dias de estoque), que continua no PCP sem mudança.
   Filtros só dentro de ícones: funil (produtos, linhas, marcas,
   almoxarifados) e calendário (período da planilha + período dos pedidos).
   Quantidades guardadas em CAIXAS; Pacotes/Paletes convertem por produto.
   Clientes e números de pedido são fictícios. Datas ancoradas na semana
   corrente. Estado da tela no localStorage (taskflow_cobertura), sempre
   via safeSetItem. Tudo prefixado .cbp- para não vazar.
   Entrada: renderComercial() chama CBP.render(main) quando
   comercialView==='cobertura'. */
(function(){
  'use strict';
  var LS_KEY='taskflow_cobertura';
  var DOW=['dom','seg','ter','qua','qui','sex','sáb'];
  var DOWH=['seg','ter','qua','qui','sex','sáb','dom'];
  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  function lsGet(k, fb){
    if(typeof safeJSON==='function') return safeJSON(k, fb);
    try{ var r=localStorage.getItem(k); return r?JSON.parse(r):fb; }catch(e){ return fb; }
  }
  function lsSet(k,v){
    var s=JSON.stringify(v);
    try{ return (typeof safeSetItem==='function') ? safeSetItem(k,s) : (localStorage.setItem(k,s),true); }catch(e){ return false; }
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  /* ── datas ── */
  function d0(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addD(d,n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n); }
  function p2(n){ return (n<10?'0':'')+n; }
  function key(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
  function fromKey(k){ var p=String(k).split('-'); return new Date(+p[0], (+p[1])-1, +p[2]); }
  function monday(d){ return addD(d, -((d.getDay()+6)%7)); }
  function ddmm(d){ return p2(d.getDate())+'/'+p2(d.getMonth()+1); }
  function ddmmyyyy(d){ return ddmm(d)+'/'+d.getFullYear(); }
  function isoWeek(d){
    var t=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day);
    var y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));
    return Math.ceil(((t-y0)/86400000+1)/7);
  }
  function sameDay(a,b){ return a&&b&&a.getTime()===b.getTime(); }
  function monthStart(y,m){ return new Date(y,m,1); }
  function monthEnd(y,m){ return new Date(y,m+1,0); }

  var TODAY=d0(new Date());
  var W0=monday(TODAY);

  /* ── catálogo (linhas e produtos reais da Klain) ──
     ppc = pacotes por caixa · cpp = caixas por palete */
  var LINHAS=[
    {id:'skimo', nome:'Indústria - Skimo 14kg', prods:[
      {c:'975', n:'Skimo Choc. KLAIN 14kg - Ao Leite (BLD)', ppc:1, cpp:60},
      {c:'976', n:'Skimo Choc. KLAIN 14kg - Branco (BLD)', ppc:1, cpp:60},
      {c:'977', n:'Skimo Choc. KLAIN 14kg - Meio Amargo (BLD)', ppc:1, cpp:60}]},
    {id:'amendoim', nome:'Linha Amendoim', prods:[
      {c:'9', n:'Biscoito Broa de Amendoim 250g (ES01)', ppc:20, cpp:60},
      {c:'70', n:'Biscoito de Amendoim com Chocolate ao Leite 250g (ES01)', ppc:20, cpp:60},
      {c:'71', n:'Biscoito de Amendoim com Chocolate Branco 250g (ES01)', ppc:20, cpp:60}]},
    {id:'aperitivos', nome:'Linha Aperitivos', prods:[
      {c:'788', n:'Salgadinho Aperitivo sabor Churrasco 140g (ES12)', ppc:24, cpp:48},
      {c:'789', n:'Salgadinho Aperitivo sabor Costelinha com Limão 140g (ES12)', ppc:24, cpp:48},
      {c:'790', n:'Salgadinho Aperitivo sabor Bacon 140g (ES12)', ppc:24, cpp:48},
      {c:'1170', n:'Salgadinho Aperitivo Sabor Original 140g (ES12)', ppc:24, cpp:48}]},
    {id:'batatas', nome:'Linha Batatas', prods:[
      {c:'24', n:'Batata Frita sabor Churrasco 40g (ES11)', ppc:50, cpp:40},
      {c:'31', n:'Batata Frita sabor Original 40g (ES11)', ppc:50, cpp:40},
      {c:'215', n:'Batata Palha 80g (ES11)', ppc:30, cpp:40},
      {c:'1178', n:'Batata Frita sabor Churrasco 85g (ES11)', ppc:30, cpp:40},
      {c:'1179', n:'Batata Frita sabor Original 85g (ES11)', ppc:30, cpp:40}]},
    {id:'paodemel', nome:'Linha Pão de Mel', prods:[
      {c:'17', n:'Pão de Mel com Chocolate ao Leite 250g (ES02)', ppc:20, cpp:50},
      {c:'47', n:'Pão de Mel com Chocolate Branco 250g (ES02)', ppc:20, cpp:50}]}
  ];
  var PROD={}, PRODS=[];
  LINHAS.forEach(function(l){ l.prods.forEach(function(p){ p.linha=l.id; p.marca='Klain'; PROD[p.c]=p; PRODS.push(p); }); });
  var MARCAS=['Klain'];
  var ALMOX=['Klain','Terceiros','Expedição'];

  /* ── pedidos fictícios (datas relativas à segunda-feira da semana atual) ── */
  var PED_SPEC=[
    ['704512','Distribuidora Serra Azul Ltda',-25,2,640,''],
    ['704538','Mercantil Vale do Taquari',-19,4,1180,'Entregar no CD de Lajeado; agendar descarga com 24h de antecedência pelo telefone da portaria e enviar romaneio junto com a nota'],
    ['704561','Comercial Rio Pardo Alimentos',-16,9,420,'Paletizar por linha'],
    ['704577','Atacado Pampa Sul Distribuidora',-12,11,950,''],
    ['704602','Central Gaúcha de Distribuição',-10,16,760,'Carga fechada'],
    ['704619','Empório Campos Altos',-6,18,180,'Cliente novo — conferir cadastro'],
    ['704633','Rede Mercados Planalto Verde',-4,23,530,''],
    ['704648','Distribuidora Litoral Norte',-3,26,160,'Pedido de reposição']
  ];
  function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  var PEDIDOS=(function(){
    var R=rng(46), out=[];
    var QBIG=[12,18,24,30,36,40,48,60,72,80,96,120], QSK=[4,6,8,10,12,16,20];
    PED_SPEC.forEach(function(s){
      var emis=addD(W0,s[2]), ent=addD(W0,s[3]);
      var ini=addD(emis,7); if(ini<addD(W0,-7)) ini=addD(W0,-7);
      var span=Math.max(1, Math.round((ent-ini)/86400000));
      var map={}, soma=0, guard=0;
      while(soma<s[4] && guard++<200){
        var p=PRODS[Math.floor(R()*PRODS.length)];
        var d=addD(ini, Math.floor(R()*(span+1)));
        if(d.getDay()===0) d=addD(d,1);
        if(d.getDay()===6 && R()<.6) d=addD(d,-1);
        if(d>ent) d=ent;
        if(d.getDay()===0) d=addD(d,-1);
        var q=(p.linha==='skimo'?QSK:QBIG)[Math.floor(R()*(p.linha==='skimo'?QSK.length:QBIG.length))];
        if(soma+q>s[4]) q=s[4]-soma;
        if(q<=0) break;
        soma+=q;
        var conf= d<TODAY || (d<=addD(TODAY,9) && R()<.72);
        var al= R()<.1 ? 'Expedição' : 'Klain';
        var k=p.c+'|'+key(d)+'|'+al;
        if(map[k]){ map[k].q+=q; map[k].conf=map[k].conf&&conf; }
        else map[k]={c:p.c, d:d, dk:key(d), q:q, conf:conf, al:al};
      }
      var itens=Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return a.d-b.d; });
      out.push({num:s[0], cli:s[1], emis:emis, ent:ent, obs:s[5], itens:itens});
    });
    return out;
  })();

  /* ── estado ── */
  var MAIN=null, S=null, DRAFT=null, FDRAFT=null;
  function defaults(){
    return {unid:'caixas', mode:'w2', wOff:0, mOff:0,
      ped:{campo:'entrega', preset:'prox4', de:'', ate:''},
      sab:true, dom:false, tot:true,
      f:{prods:[], linhas:[], marca:'', almox:['Klain'], pbusca:'', lbusca:''},
      col:{}, pedAberto:false,
      busca:'', pop:null, popM:0, fBusca:'', fLbusca:''};
  }
  function load(){
    if(S) return S;
    S=defaults();
    var r=lsGet(LS_KEY, null), u=r&&r.ui;
    if(u){
      if(['pacotes','caixas','paletes'].indexOf(u.unid)>=0) S.unid=u.unid;
      if(['w1','w2','mes'].indexOf(u.mode)>=0) S.mode=u.mode;
      if(typeof u.wOff==='number') S.wOff=u.wOff;
      if(typeof u.mOff==='number') S.mOff=u.mOff;
      if(u.ped&&typeof u.ped==='object') S.ped={campo:u.ped.campo==='emissao'?'emissao':'entrega', preset:String(u.ped.preset||''), de:String(u.ped.de||''), ate:String(u.ped.ate||'')};
      if(typeof u.sab==='boolean') S.sab=u.sab;
      if(typeof u.dom==='boolean') S.dom=u.dom;
      if(typeof u.tot==='boolean') S.tot=u.tot;
      if(u.f&&typeof u.f==='object'){
        S.f={prods:[],
             linhas:[],
             marca:typeof u.f.marca==='string'?u.f.marca:'',
             almox:Array.isArray(u.f.almox)?u.f.almox.filter(function(a){return ALMOX.indexOf(a)>=0;}):['Klain'],
             pbusca:typeof u.f.pbusca==='string'?u.f.pbusca:'',
             lbusca:typeof u.f.lbusca==='string'?u.f.lbusca:''};
      }
      if(u.col&&typeof u.col==='object') S.col=u.col;
      if(typeof u.pedAberto==='boolean') S.pedAberto=u.pedAberto;
    }
    return S;
  }
  function persist(){
    lsSet(LS_KEY, {v:1, ui:{unid:S.unid, mode:S.mode, wOff:S.wOff, mOff:S.mOff, ped:S.ped, sab:S.sab, dom:S.dom, tot:S.tot, f:S.f, col:S.col, pedAberto:S.pedAberto}});
  }

  /* ── unidades ── */
  function conv(p, cx){ return S.unid==='pacotes' ? cx*p.ppc : (S.unid==='paletes' ? cx/p.cpp : cx); }
  function fmt(n){
    if(!n || !isFinite(n)) return '';
    var d=(Math.abs(n-Math.round(n))<1e-6)?0:1;
    if(d && Math.abs(n)<0.05) return '0,0';
    return n.toLocaleString('pt-BR',{minimumFractionDigits:d, maximumFractionDigits:d});
  }
  function fmt0(n){ return fmt(n)||'0'; }
  function unidLabel(){ return S.unid; }

  /* ── período dos pedidos ── */
  function presetRange(pr){
    if(pr==='semana') return [W0, addD(W0,6)];
    if(pr==='prox2') return [W0, addD(W0,12)];
    if(pr==='prox4') return [W0, addD(W0,26)];
    if(pr==='mes') return [monthStart(TODAY.getFullYear(),TODAY.getMonth()), monthEnd(TODAY.getFullYear(),TODAY.getMonth())];
    if(pr==='atras') return [null, addD(TODAY,-1)];
    return null;
  }
  function pedRange(ped){
    ped=ped||S.ped;
    if(ped.preset && ped.preset!=='custom') return presetRange(ped.preset);
    if(ped.de) return [fromKey(ped.de), ped.ate?fromKey(ped.ate):fromKey(ped.de)];
    return null;
  }
  var PRESETS=[['semana','Esta semana'],['prox2','Próximas 2 semanas'],['prox4','Próximas 4 semanas'],['mes','Este mês'],['atras','Atrasados']];

  /* ── visão (filtros + busca) ── */
  function prodPassaFunil(p){
    var f=S.f;
    if(f.pbusca){ var q=norm(f.pbusca).trim(); if(q && norm(p.c).indexOf(q)<0 && norm(p.n).indexOf(q)<0) return false; }
    if(f.lbusca){ var lq=norm(f.lbusca).trim(); var lnome=(function(){ for(var i=0;i<LINHAS.length;i++) if(LINHAS[i].id===p.linha) return LINHAS[i].nome; return p.linha; })(); if(lq && norm(p.linha).indexOf(lq)<0 && norm(lnome).indexOf(lq)<0) return false; }
    if(f.marca && p.marca!==f.marca) return false;
    return true;
  }
  function itemPassa(it){
    return !S.f.almox.length || S.f.almox.indexOf(it.al)>=0;
  }
  function visao(){
    var q=norm(S.busca).trim();
    var rg=pedRange();
    var prodMatch=null;
    if(q){
      prodMatch={};
      PRODS.forEach(function(p){ if(norm(p.c)===q || norm(p.n).indexOf(q)>=0) prodMatch[p.c]=1; });
      if(!Object.keys(prodMatch).length) prodMatch=null;
    }
    var peds=PEDIDOS.filter(function(p){
      if(rg){
        var d=S.ped.campo==='emissao'?p.emis:p.ent;
        if(rg[0] && d<rg[0]) return false;
        if(rg[1] && d>rg[1]) return false;
      }
      var its=p.itens.filter(function(it){ return itemPassa(it) && prodPassaFunil(PROD[it.c]); });
      if(!its.length) return false;
      if(q){
        var hit = norm(p.num).indexOf(q)>=0 || norm(p.cli).indexOf(q)>=0;
        if(!hit && prodMatch) hit=its.some(function(it){ return prodMatch[it.c]; });
        if(!hit) return false;
      }
      return true;
    });
    var pedHitDireto = q && peds.some(function(p){ return norm(p.num).indexOf(q)>=0 || norm(p.cli).indexOf(q)>=0; });
    var prods=PRODS.filter(function(p){
      if(!prodPassaFunil(p)) return false;
      if(q){
        if(prodMatch && !pedHitDireto) return !!prodMatch[p.c];
        return peds.some(function(pd){ return pd.itens.some(function(it){ return it.c===p.c && itemPassa(it); }); }) || !!(prodMatch&&prodMatch[p.c]);
      }
      return true;
    });
    var okP={}; prods.forEach(function(p){ okP[p.c]=1; });
    /* células: produto|dia → {q (cx), conf} */
    var cell={};
    peds.forEach(function(pd){
      pd.itens.forEach(function(it){
        if(!okP[it.c] || !itemPassa(it)) return;
        var k=it.c+'|'+it.dk, c=cell[k]||(cell[k]={q:0, conf:true});
        c.q+=it.q; c.conf=c.conf&&it.conf;
      });
    });
    function pedQtd(pd){
      var t=0; pd.itens.forEach(function(it){ if(okP[it.c] && itemPassa(it)) t+=conv(PROD[it.c], it.q); }); return t;
    }
    return {peds:peds, prods:prods, cell:cell, pedQtd:pedQtd};
  }

  /* ── colunas da planilha ── */
  function planWeeks(){
    var ws=[], y, m;
    if(S.mode==='mes'){
      var b=new Date(TODAY.getFullYear(), TODAY.getMonth()+S.mOff, 1);
      y=b.getFullYear(); m=b.getMonth();
      var me=monthEnd(y,m), w=monday(monthStart(y,m));
      while(w<=me){ ws.push(w); w=addD(w,7); }
    } else {
      var a=addD(W0, 7*S.wOff);
      ws.push(a); if(S.mode==='w2') ws.push(addD(a,7));
    }
    return {weeks:ws, y:y, m:m};
  }
  function planCols(){
    var pw=planWeeks(), segs=[];
    pw.weeks.forEach(function(w){
      var days=[];
      for(var i=0;i<7;i++){
        var d=addD(w,i);
        if(i===5 && !S.sab) continue;
        if(i===6 && !S.dom) continue;
        if(S.mode==='mes' && d.getMonth()!==pw.m) continue;
        days.push(d);
      }
      /* divide a semana pelo mês (como a planilha do Hub) */
      days.forEach(function(d){
        var last=segs[segs.length-1];
        if(!last || last.w!==w || last.m!==d.getMonth()) segs.push(last={w:w, m:d.getMonth(), y:d.getFullYear(), days:[]});
        last.days.push(d);
      });
    });
    var months=[];
    segs.forEach(function(s){
      var last=months[months.length-1];
      if(!last || last.m!==s.m || last.y!==s.y) months.push(last={m:s.m, y:s.y, segs:[]});
      last.segs.push(s);
    });
    var all=[]; segs.forEach(function(s){ all=all.concat(s.days); });
    return {segs:segs, months:months, days:all, weeks:pw.weeks, y:pw.y, m:pw.m};
  }
  function periodoTitulo(pc){
    if(S.mode==='mes'){
      var ini=pc.days[0], fim=pc.days[pc.days.length-1];
      return cap(MESES[pc.m])+' '+pc.y+(ini?' · '+ddmm(ini)+' a '+ddmm(fim):'');
    }
    var ws=pc.weeks.map(isoWeek);
    var a=pc.weeks[0], z=addD(pc.weeks[pc.weeks.length-1], S.dom?6:5);
    return 'Sem '+ws.join(' e ')+' · '+ddmm(a)+' a '+ddmm(z);
  }

  /* ── HTML ── */
  function toolsHTML(){
    var nf=funilCount();
    return '<div class="cbp-tools">'
      +'<div class="cbp-unit"><span class="cbp-ulab">Quantidades em</span><div class="cbp-seg" role="group" aria-label="Unidade">'
      +['pacotes','caixas','paletes'].map(function(u){ return '<button type="button" data-a="unid" data-v="'+u+'"'+(S.unid===u?' class="on" aria-pressed="true"':' aria-pressed="false"')+'>'+cap(u)+'</button>'; }).join('')
      +'</div></div>'
      +'<div class="cbp-tr cbp-popwrap">'
      +'<label class="cbp-busca"><i class="ti ti-search"></i><input id="cbp-busca" type="search" autocomplete="off" placeholder="Buscar pedido, produto ou cliente…" value="'+esc(S.busca)+'">'
      +(S.busca?'<button type="button" class="cbp-bx" data-a="limpaBusca" title="Limpar busca"><i class="ti ti-x"></i></button>':'')+'</label>'
      +'<button type="button" class="cbp-ib'+(S.pop==='fun'?' on':'')+'" data-a="pop" data-v="fun" title="Filtros" aria-label="Filtros"><i class="ti ti-filter"></i>'+(nf?'<span class="cbp-bd">'+nf+'</span>':'')+'</button>'
      +'<button type="button" class="cbp-ib'+(S.pop==='cal'?' on':'')+'" data-a="pop" data-v="cal" title="Período" aria-label="Período"><i class="ti ti-calendar"></i></button>'
      +(S.pop==='fun'?funilHTML():'')+(S.pop==='cal'?calHTML():'')
      +'</div></div>';
  }
  function funilCount(){
    var f=S.f, n=0;
    if((f.pbusca||'').trim()) n++; if((f.lbusca||'').trim()) n++; if(f.marca) n++; if(f.almox.length && f.almox.length<ALMOX.length) n++;
    return n;
  }
  function chk(on, label, a, v, extra){
    return '<button type="button" class="cbp-chk'+(on?' on':'')+'" data-a="'+a+'" data-v="'+esc(v)+'"><span class="b">'+(on?'<i class="ti ti-check"></i>':'')+'</span>'+(extra||'')+'<span class="lb">'+esc(label)+'</span></button>';
  }
  function funilHTML(){
    var F=FDRAFT;
    return '<div class="cbp-pop cbp-fun" style="--ar:52px" role="dialog" aria-label="Filtros">'
      +'<div class="cbp-sec"><h4>Produtos</h4>'
      +'<label class="cbp-mini"><i class="ti ti-search"></i><input id="cbp-fbusca" type="text" autocomplete="off" placeholder="Buscar produto…" value="'+esc(S.fBusca)+'"></label>'
      +'<h4 style="margin-top:14px">Linhas</h4>'
      +'<label class="cbp-mini"><i class="ti ti-search"></i><input id="cbp-flinha" type="text" autocomplete="off" placeholder="Buscar linha…" value="'+esc(S.fLbusca)+'"></label>'
      +'<h4 style="margin-top:14px">Marcas</h4><div class="cbp-tags">'
      +'<button type="button" class="cbp-tag'+(!F.marca?' on':'')+'" data-a="fMarca" data-v="">Todas</button>'
      +MARCAS.map(function(m){ return '<button type="button" class="cbp-tag'+(F.marca===m?' on':'')+'" data-a="fMarca" data-v="'+esc(m)+'">'+esc(m)+'</button>'; }).join('')
      +'</div>'
      +'<h4 style="margin-top:14px">Almoxarifados <span class="c">'+(F.almox.length&&F.almox.length<ALMOX.length?F.almox.length+' selecionado'+(F.almox.length>1?'s':''):'Todos')+'</span></h4>'
      +ALMOX.map(function(a){ return chk(F.almox.indexOf(a)>=0, a, 'fAlmox', a); }).join('')
      +'</div>'
      +'<div class="cbp-ft"><button type="button" class="cbp-lnk" data-a="fLimpar">Limpar filtros</button><span class="cbp-ftb"><button type="button" class="cbp-btn" data-a="pop" data-v="">Cancelar</button><button type="button" class="cbp-btn pri" data-a="fAplicar"><i class="ti ti-check"></i>Aplicar</button></span></div>'
      +'</div>';
  }
  function popMonth(){
    if(S.mode==='mes') { var b=new Date(TODAY.getFullYear(), TODAY.getMonth()+S.mOff, 1); return {y:b.getFullYear(), m:b.getMonth()}; }
    var b2=new Date(TODAY.getFullYear(), TODAY.getMonth()+S.popM, 1); return {y:b2.getFullYear(), m:b2.getMonth()};
  }
  function calHTML(){
    var pm=popMonth(), pc=planCols();
    var me=monthEnd(pm.y,pm.m), w=monday(monthStart(pm.y,pm.m)), chips=[];
    if(w.getMonth()!==pm.m && addD(w,5)<monthStart(pm.y,pm.m)) w=addD(w,7);
    while(w<=me){ chips.push(w); w=addD(w,7); }
    var sel={}; pc.weeks.forEach(function(x){ sel[key(x)]=1; });
    var nDias=pc.days.length;
    var D=DRAFT, rg=pedRange(D);
    var h='<div class="cbp-pop cbp-cal" style="--ar:12px" role="dialog" aria-label="Período">'
      +'<div class="cbp-blk pl"><h4><i class="ti ti-table"></i>Período da planilha</h4>'
      +'<div class="cbp-pnav"><div class="mon"><button type="button" class="ar" data-a="popM" data-v="-1" aria-label="Mês anterior"><i class="ti ti-chevron-left"></i></button><span class="lb">'+cap(MESES[pm.m])+' '+pm.y+'</span><button type="button" class="ar" data-a="popM" data-v="1" aria-label="Próximo mês"><i class="ti ti-chevron-right"></i></button></div>'
      +'<span class="cbp-unit" style="margin-left:auto"><span class="cbp-ulab">Mostrar</span><div class="cbp-seg">'
      +[['w1','1 semana'],['w2','2 semanas'],['mes','Mês']].map(function(x){ return '<button type="button" data-a="mode" data-v="'+x[0]+'"'+(S.mode===x[0]?' class="on"':'')+'>'+x[1]+'</button>'; }).join('')
      +'</div></span></div>'
      +'<div class="cbp-pchips" style="grid-template-columns:repeat('+chips.length+',1fr)">'
      +chips.map(function(c){
        var z=addD(c,5), now=sameDay(c,W0);
        var lab=(c.getMonth()===z.getMonth()? p2(c.getDate())+'–'+ddmm(z) : ddmm(c)+'–'+ddmm(z));
        return '<button type="button" class="cbp-wch'+(sel[key(c)]?' on':'')+(now?' now':'')+'" data-a="wk" data-v="'+key(c)+'"><small>Sem '+isoWeek(c)+'</small>'+lab+'</button>';
      }).join('')+'</div>'
      +'<div class="cbp-pnote"><b>'+esc(periodoTitulo(pc).split(' · ')[0])+'</b> · '+(pc.days.length?ddmm(pc.days[0])+' a '+ddmm(pc.days[nDias-1]):'')+' · '+nDias+' dias na planilha · <button type="button" class="cbp-lnk" data-a="hoje">Voltar para hoje</button></div></div>';
    /* período dos pedidos */
    var cm=new Date(TODAY.getFullYear(), TODAY.getMonth()+D.cal, 1);
    h+='<div class="cbp-blk"><h4><i class="ti ti-clipboard-list"></i>Período dos pedidos</h4>'
      +'<div class="cbp-prow"><div class="cbp-seg"><button type="button" data-a="dCampo" data-v="emissao"'+(D.campo==='emissao'?' class="on"':'')+'>Emissão</button><button type="button" data-a="dCampo" data-v="entrega"'+(D.campo==='entrega'?' class="on"':'')+'>Prev. entrega</button></div>'
      +'<div class="cbp-dates"><div class="cbp-date"><i class="ti ti-calendar"></i><small>DE</small>'+(rg&&rg[0]?ddmmyyyy(rg[0]):'—')+'</div><div class="cbp-date"><i class="ti ti-calendar"></i><small>ATÉ</small>'+(rg&&rg[1]?ddmmyyyy(rg[1]):'—')+'</div></div></div>'
      +'<div class="cbp-tags" style="margin-bottom:12px">'+PRESETS.map(function(p){ return '<button type="button" class="cbp-tag'+(D.preset===p[0]?' on':'')+'" data-a="dPreset" data-v="'+p[0]+'">'+p[1]+'</button>'; }).join('')+'</div>'
      +'<div class="cbp-cals">'+miniCal(cm.getFullYear(), cm.getMonth(), rg, 'L')+miniCal(cm.getFullYear(), cm.getMonth()+1, rg, 'R')+'</div>'
      +'<div class="cbp-opts">'+chk(D.sab,'Mostrar sábados','dSab','1')+chk(D.dom,'Mostrar domingos','dDom','1')+chk(D.tot,'Totais por semana e mês','dTot','1')+'</div></div>'
      +'<div class="cbp-ft"><button type="button" class="cbp-lnk" data-a="dLimpar">Limpar período</button><span class="cbp-ftb"><button type="button" class="cbp-btn" data-a="pop" data-v="">Cancelar</button><button type="button" class="cbp-btn pri" data-a="dAplicar"><i class="ti ti-check"></i>Aplicar</button></span></div>'
      +'</div>';
    return h;
  }
  function miniCal(y, m, rg, lado){
    var b=new Date(y,m,1); y=b.getFullYear(); m=b.getMonth();
    var ini=monday(b), h='<div><div class="cbp-calh">'
      +(lado==='L'?'<button type="button" class="ar" data-a="dCal" data-v="-1" aria-label="Mês anterior"><i class="ti ti-chevron-left"></i></button>':'<span></span>')
      +MESES[m]+' '+y
      +(lado==='R'?'<button type="button" class="ar" data-a="dCal" data-v="1" aria-label="Próximo mês"><i class="ti ti-chevron-right"></i></button>':'<span></span>')
      +'</div><table class="cbp-mcal"><tr>'+DOWH.map(function(d){ return '<th>'+d+'</th>'; }).join('')+'</tr>';
    var a=rg&&rg[0], z=rg&&rg[1];
    for(var r=0;r<6;r++){
      var d=addD(ini, r*7);
      if(r>=4 && d.getMonth()!==m && d>b) break;
      h+='<tr>';
      for(var i=0;i<7;i++){
        var x=addD(ini, r*7+i), cl=[];
        if(x.getMonth()!==m) cl.push('o');
        else {
          var aa=a||(z?new Date(1900,0,1):null);
          if(aa && z && x>aa && x<z) cl.push('in');
          if(a && sameDay(x,a)) cl.push(z&&!sameDay(a,z)?'s':'se');
          if(z && sameDay(x,z) && !sameDay(a,z)) cl.push('e');
          if(!a && z && x<z) cl.push('in');
        }
        if(sameDay(x,TODAY)) cl.push('t');
        h+= x.getMonth()!==m ? '<td class="'+cl.join(' ')+'">'+x.getDate()+'</td>'
          : '<td class="'+cl.join(' ')+'"><button type="button" data-a="dDia" data-v="'+key(x)+'">'+x.getDate()+'</button></td>';
      }
      h+='</tr>';
    }
    return h+'</table></div>';
  }

  function pbarHTML(v){
    var peds=v.peds, n=peds.length;
    var tot=0; peds.forEach(function(p){ tot+=v.pedQtd(p); });
    var emis=peds.map(function(p){ return p.emis; }), ents=peds.map(function(p){ return p.ent; });
    function rgTxt(a){ if(!a.length) return '—'; var mn=new Date(Math.min.apply(null,a)), mx=new Date(Math.max.apply(null,a)); return ddmm(mn)+' a '+ddmm(mx); }
    var prox=peds.filter(function(p){ return p.ent>=TODAY; }).sort(function(a,b){ return a.ent-b.ent; })[0];
    var open=S.pedAberto;
    var h='<div class="cbp-pbar'+(open?' open':'')+'">'
      +'<button type="button" class="cbp-pbar-t" data-a="ped" aria-expanded="'+open+'"><i class="ti '+(open?'ti-chevron-down':'ti-chevron-right')+' ch"></i><i class="ti ti-clipboard-list"></i><b>'+n+' pedido'+(n===1?'':'s')+'</b></button>'
      +'<span class="dot">·</span><span class="m">emissão '+rgTxt(emis)+'</span><span class="dot">·</span><span class="m">entregas '+rgTxt(ents)+'</span><span class="dot">·</span><span class="m">'+fmt0(tot)+' '+unidLabel()+'</span>'
      +(prox?'<span class="dot nx">·</span><span class="m nx mut">próxima entrega: <b>'+esc(prox.num)+' · '+esc(prox.cli)+' · '+ddmm(prox.ent)+'</b></span>':'')
      +'<button type="button" class="cbp-pbar-r" data-a="ped">'+(open?'Recolher<i class="ti ti-chevron-up"></i>':'Expandir pedidos<i class="ti ti-chevron-down"></i>')+'</button></div>';
    if(open){
      h+='<div class="cbp-pexp"><div class="cbp-pscroll"><table class="cbp-ped"><colgroup><col style="width:110px"><col style="width:300px"><col style="width:120px"><col style="width:120px"><col style="width:120px"><col></colgroup>'
        +'<thead><tr><th>Nº Pedido</th><th>Cliente</th><th>Data Emissão</th><th>Prev. Entrega</th><th class="n">Quantidade</th><th>Observações</th></tr></thead><tbody>'
        +(n?peds.map(function(p,i){
          return '<tr'+(i%2?' class="z"':'')+'><td class="pn">'+esc(p.num)+'</td><td class="cl" title="'+esc(p.cli)+'">'+esc(p.cli)+'</td><td class="dt">'+ddmmyyyy(p.emis)+'</td><td class="dt'+(p.ent<TODAY?' late':'')+'">'+ddmmyyyy(p.ent)+'</td><td class="n">'+fmt0(v.pedQtd(p))+'</td><td class="obs"'+(p.obs?' title="'+esc(p.obs)+'"':'')+'><div>'+esc(p.obs)+'</div></td></tr>';
        }).join(''):'<tr><td colspan="6" class="cbp-vazio">Nenhum pedido no período e filtros atuais.</td></tr>')
        +'</tbody><tfoot><tr><td colspan="4">'+n+' pedido'+(n===1?'':'s')+'</td><td class="n">'+fmt0(tot)+'</td><td></td></tr></tfoot></table></div></div>';
    }
    return h;
  }

  function gridHTML(v){
    var pc=planCols(), tot=S.tot, cell=v.cell, isMes=S.mode==='mes';
    var nd=pc.days.length, nts=tot?pc.segs.length:0;
    var linhas=LINHAS.map(function(l){ return {l:l, prods:v.prods.filter(function(p){ return p.linha===l.id; })}; }).filter(function(x){ return x.prods.length; });
    var al=S.f.almox, alTxt=(!al.length||al.length===ALMOX.length)?'todos os almoxarifados':(al.length===1?'Almoxarifado '+al[0]:al.length+' almoxarifados');
    var h='<div class="cbp-card"><div class="cbp-cardh"><i class="ti ti-table"></i><span>'+esc(periodoTitulo(pc))+'</span>'
      +'<span class="mut">'+v.prods.length+' produto'+(v.prods.length===1?'':'s')+' · '+linhas.length+' linha'+(linhas.length===1?'':'s')+' · '+unidLabel()+' · '+esc(alTxt)+'</span>'
      +'<div class="rt"><div class="cbp-leg"><span><b>120</b> entrega confirmada</span><span>120 previsto em pedido</span><span><span class="tdy"></span>hoje</span></div></div></div>';
    h+='<div class="cbp-scroll"><table class="cbp-gr'+(isMes?' mesv':'')+'" data-nd="'+nd+'" data-nts="'+nts+'"><colgroup><col class="k1"><col class="k2">';
    pc.segs.forEach(function(s){ s.days.forEach(function(){ h+='<col class="kd">'; }); if(tot) h+='<col class="kt">'; });
    h+='<col class="kg"></colgroup><thead><tr class="r1"><th class="fz c1" rowspan="3">Código</th><th class="fz c2" rowspan="3">Produto</th>';
    pc.months.forEach(function(mo){
      var span=0; mo.segs.forEach(function(s){ span+=s.days.length+(tot?1:0); });
      h+='<th class="mb mh" colspan="'+span+'">'+MESES[mo.m]+' '+mo.y+'</th>';
    });
    h+='<th class="tg" rowspan="3">'+(isMes?'Total mês':'Total período')+'</th></tr><tr class="r2">';
    pc.months.forEach(function(mo){
      mo.segs.forEach(function(s,i){
        h+='<th colspan="'+(s.days.length+(tot?1:0))+'"'+(i===0?' class="mb"':'')+'>Sem: '+ddmm(s.days[0])+' - '+ddmm(s.days[s.days.length-1])+'</th>';
      });
    });
    h+='</tr><tr class="r3">';
    pc.months.forEach(function(mo){
      mo.segs.forEach(function(s,i){
        s.days.forEach(function(d,j){
          var cl=[]; if(i===0&&j===0) cl.push('mb'); if(sameDay(d,TODAY)) cl.push('today'); if(d.getDay()===0||d.getDay()===6) cl.push('we');
          h+='<th'+(cl.length?' class="'+cl.join(' ')+'"':'')+'>'+p2(d.getDate())+'<small>'+DOW[d.getDay()]+'</small></th>';
        });
        if(tot) h+='<th class="ts">Total<small>sem</small></th>';
      });
    });
    h+='</tr></thead><tbody>';
    var gtDay={}, gtSeg=[], gt=0;
    function rowCells(getQ, isGrp){
      var out='', total=0;
      pc.segs.forEach(function(s,si){
        var st=0;
        s.days.forEach(function(d,j){
          var r=getQ(d), q=r.q, cl=['d'];
          if(si===0&&j===0 || (j===0 && s.m!==(pc.segs[si-1]||{}).m)) cl.push('mb');
          if(sameDay(d,TODAY)) cl.push('today');
          if(!isGrp && q && r.conf) cl.push('g');
          out+='<td class="'+cl.join(' ')+'">'+fmt(q)+'</td>';
          st+=q;
        });
        if(tot) out+='<td class="ts">'+fmt(st)+'</td>';
        total+=st;
      });
      return {html:out+'<td class="tg">'+fmt(total)+'</td>', total:total};
    }
    if(!linhas.length){
      h+='<tr><td class="fz c1"></td><td class="fz c2 cbp-vazio">Nenhum produto com os filtros atuais.</td><td colspan="'+(nd+nts+1)+'"></td></tr>';
    }
    linhas.forEach(function(x){
      var col=!!S.col[x.l.id];
      var g=rowCells(function(d){ var q=0; x.prods.forEach(function(p){ var c=cell[p.c+'|'+key(d)]; if(c) q+=conv(p,c.q); }); return {q:q}; }, true);
      h+='<tr class="grp"><td class="fz c1 gl"><button type="button" class="cbp-gtog" data-a="lin" data-v="'+x.l.id+'" aria-expanded="'+(!col)+'" title="'+(col?'Expandir':'Recolher')+' linha"><i class="ti '+(col?'ti-chevron-right':'ti-chevron-down')+'"></i></button></td>'
        +'<td class="fz c2 gl"><button type="button" class="cbp-gname" data-a="lin" data-v="'+x.l.id+'">'+esc(x.l.nome)+'</button><span class="q">'+x.prods.length+' produto'+(x.prods.length===1?'':'s')+'</span></td>'+g.html+'</tr>';
      if(col) return;
      x.prods.forEach(function(p,i){
        var r=rowCells(function(d){ var c=cell[p.c+'|'+key(d)]; return c?{q:conv(p,c.q), conf:c.conf}:{q:0}; }, false);
        h+='<tr class="p'+(i%2?' z':'')+'"><td class="fz c1">'+esc(p.c)+'</td><td class="fz c2" title="'+esc(p.n)+'">'+esc(p.n)+'</td>'+r.html+'</tr>';
      });
    });
    var ft=rowCells(function(d){ var q=0; v.prods.forEach(function(p){ var c=cell[p.c+'|'+key(d)]; if(c) q+=conv(p,c.q); }); return {q:q}; }, true);
    h+='</tbody><tfoot><tr><td class="fz c1" colspan="2">Total geral · '+unidLabel()+'</td>'+ft.html+'</tr></tfoot></table></div></div>';
    return h;
  }

  function bodyHTML(){
    var v=visao();
    return pbarHTML(v)+gridHTML(v);
  }
  function screenHTML(){
    return '<style>.main{max-width:none !important}</style>'
      +'<div class="cbp-wrap" style="padding:20px 4px 40px">'
      +'<div class="cbp-head"><h2><i class="ti ti-chart-bar"></i> Entrega diária</h2><p>Demanda e entregas por produto, semana a semana — pedidos em aberto e quantidades previstas por dia.</p></div>'
      +toolsHTML()
      +'<div id="cbp-body">'+bodyHTML()+'</div>'
      +'</div>';
  }

  /* ── largura das colunas: 2 semanas cabem em 1920 sem rolagem ── */
  function fit(){
    if(!MAIN) return;
    var sc=MAIN.querySelector('.cbp-scroll'), t=sc&&sc.querySelector('table.cbp-gr');
    if(!t) return;
    var nd=+t.getAttribute('data-nd')||1, nts=+t.getAttribute('data-nts')||0;
    var W=sc.clientWidth;
    var c1=62, c2=W>=1500?330:(W>=1150?300:260), ts=58, tg=S.mode==='mes'?78:96;
    var mn=S.mode==='mes'?38:60, mx=S.mode==='w1'?140:110;
    /* no mês, encolhe a coluna Produto (até 240) antes de pedir rolagem */
    if(S.mode==='mes'){ var need=c1+ts*nts+tg+mn*nd; if(W-need<c2) c2=Math.max(240, W-need); }
    var avail=W-c1-c2-ts*nts-tg;
    var dw=Math.max(mn, Math.min(mx, Math.floor(avail/nd)));
    var total=c1+c2+ts*nts+tg+dw*nd;
    if(total<W && dw<mx){ /* reparte a sobra no total do período */ tg+=W-total; total=W; }
    t.style.setProperty('--cbp-c2', c2+'px');
    t.style.setProperty('--cbp-dw', dw+'px');
    t.style.setProperty('--cbp-tg', tg+'px');
    t.style.width=total+'px';
    /* altura: a planilha rola por dentro, sob a barra do Hub */
    var nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hub-nav-h'))||59;
    sc.style.maxHeight=Math.max(320, window.innerHeight-nav-24-38)+'px';
  }

  /* ── render ── */
  function keepScroll(fn){
    var sc=MAIN&&MAIN.querySelector('.cbp-scroll'), x=sc?sc.scrollLeft:0, y=sc?sc.scrollTop:0;
    var ps=MAIN&&MAIN.querySelector('.cbp-plist'), py=ps?ps.scrollTop:0;
    var act=document.activeElement, id=act&&act.id, caret=-1;
    if(id){ try{ caret=act.selectionStart; }catch(e){} }
    fn();
    var sc2=MAIN.querySelector('.cbp-scroll'); if(sc2){ sc2.scrollLeft=x; sc2.scrollTop=y; }
    var ps2=MAIN.querySelector('.cbp-plist'); if(ps2) ps2.scrollTop=py;
    if(id==='cbp-busca'||id==='cbp-fbusca'||id==='cbp-flinha'){ var n=document.getElementById(id); if(n){ n.focus(); if(caret>=0) try{ n.setSelectionRange(caret,caret); }catch(e){} } }
  }
  function refresh(){ if(!MAIN) return; keepScroll(function(){ MAIN.innerHTML=screenHTML(); bind(); fit(); }); }
  function refreshBody(){
    if(!MAIN) return;
    var b=MAIN.querySelector('#cbp-body'); if(!b){ refresh(); return; }
    keepScroll(function(){ b.innerHTML=bodyHTML(); fit(); });
    var bx=MAIN.querySelector('.cbp-busca'), has=!!S.busca, btn=bx&&bx.querySelector('.cbp-bx');
    if(bx && has && !btn) bx.insertAdjacentHTML('beforeend','<button type="button" class="cbp-bx" data-a="limpaBusca" title="Limpar busca"><i class="ti ti-x"></i></button>');
    if(btn && !has) btn.remove();
  }

  function openPop(w){
    if(w==='fun'){ FDRAFT=JSON.parse(JSON.stringify(S.f)); S.fBusca=S.f.pbusca||''; S.fLbusca=S.f.lbusca||''; }
    if(w==='cal'){ DRAFT={campo:S.ped.campo, preset:S.ped.preset, de:S.ped.de, ate:S.ped.ate, sab:S.sab, dom:S.dom, tot:S.tot, cal:0};
      var rg=pedRange(S.ped); if(rg&&rg[0]) DRAFT.cal=(rg[0].getFullYear()-TODAY.getFullYear())*12+rg[0].getMonth()-TODAY.getMonth();
      S.popM=0; }
    S.pop=w||null;
  }
  function tog(arr, v){ var i=arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v); }

  function onClick(e){
    var el=e.target.closest&&e.target.closest('[data-a]'); if(!el || !MAIN.contains(el)) return;
    var a=el.getAttribute('data-a'), v=el.getAttribute('data-v');
    switch(a){
      case 'unid': S.unid=v; persist(); refresh(); return;
      case 'pop': openPop(S.pop===v?null:v); refresh(); return;
      case 'limpaBusca': S.busca=''; refresh(); var bi=document.getElementById('cbp-busca'); if(bi) bi.focus(); return;
      case 'ped': S.pedAberto=!S.pedAberto; persist(); refreshBody(); return;
      case 'lin': if(S.col[v]) delete S.col[v]; else S.col[v]=1; persist(); refreshBody(); return;
      /* funil */
      case 'fMarca': FDRAFT.marca=v||''; refresh(); return;
      case 'fAlmox': tog(FDRAFT.almox, v); refresh(); return;
      case 'fLimpar': FDRAFT={prods:[], linhas:[], marca:'', almox:[], pbusca:'', lbusca:''}; S.fBusca=''; S.fLbusca=''; refresh(); return;
      case 'fAplicar': FDRAFT.pbusca=(S.fBusca||'').trim(); FDRAFT.lbusca=(S.fLbusca||'').trim(); S.f=FDRAFT; S.pop=null; persist(); refresh(); return;
      /* período da planilha (aplica na hora) */
      case 'mode':
        if(v==='mes' && S.mode!=='mes'){ S.mOff=S.popM; }
        if(v!=='mes' && S.mode==='mes'){ S.popM=S.mOff; var fm=monday(new Date(TODAY.getFullYear(), TODAY.getMonth()+S.mOff, 1)); if(S.mOff===0) S.wOff=0; else { if(fm.getMonth()!==new Date(TODAY.getFullYear(), TODAY.getMonth()+S.mOff, 1).getMonth()) fm=addD(fm,7); S.wOff=Math.round((fm-W0)/(7*86400000)); } }
        S.mode=v; persist(); refresh(); return;
      case 'popM':
        if(S.mode==='mes'){ S.mOff+=(+v); persist(); }
        else S.popM+=(+v);
        refresh(); return;
      case 'wk':
        var wd=fromKey(v); S.wOff=Math.round((wd-W0)/(7*86400000));
        if(S.mode==='mes'){ S.popM=S.mOff; S.mode='w1'; }
        persist(); refresh(); return;
      case 'hoje': S.wOff=0; S.mOff=0; S.popM=0; persist(); refresh(); return;
      /* período dos pedidos (rascunho + Aplicar) */
      case 'dCampo': DRAFT.campo=v; refresh(); return;
      case 'dPreset':
        DRAFT.preset=v; var pr=presetRange(v);
        if(pr&&pr[0]) DRAFT.cal=(pr[0].getFullYear()-TODAY.getFullYear())*12+pr[0].getMonth()-TODAY.getMonth();
        else if(pr&&pr[1]) DRAFT.cal=(pr[1].getFullYear()-TODAY.getFullYear())*12+pr[1].getMonth()-TODAY.getMonth()-1;
        refresh(); return;
      case 'dCal': DRAFT.cal+=(+v); refresh(); return;
      case 'dDia':
        var cur=pedRange(DRAFT), de=cur&&cur[0]?key(cur[0]):'', ate=cur&&cur[1]?key(cur[1]):'';
        if(DRAFT.preset==='custom' && de && !DRAFT.ate){
          if(v<de){ DRAFT.ate=de; DRAFT.de=v; } else DRAFT.ate=v;
        } else { DRAFT.de=v; DRAFT.ate=''; }
        DRAFT.preset='custom'; refresh(); return;
      case 'dSab': DRAFT.sab=!DRAFT.sab; refresh(); return;
      case 'dDom': DRAFT.dom=!DRAFT.dom; refresh(); return;
      case 'dTot': DRAFT.tot=!DRAFT.tot; refresh(); return;
      case 'dLimpar': DRAFT.preset=''; DRAFT.de=''; DRAFT.ate=''; refresh(); return;
      case 'dAplicar':
        if(DRAFT.preset==='custom' && DRAFT.de && !DRAFT.ate) DRAFT.ate=DRAFT.de;
        S.ped={campo:DRAFT.campo, preset:DRAFT.preset, de:DRAFT.de, ate:DRAFT.ate};
        S.sab=DRAFT.sab; S.dom=DRAFT.dom; S.tot=DRAFT.tot; S.pop=null; persist(); refresh(); return;
    }
  }
  function onInput(e){
    var t=e.target;
    if(t.id==='cbp-busca'){ S.busca=t.value; refreshBody(); }
    else if(t.id==='cbp-fbusca'){ S.fBusca=t.value; }
    else if(t.id==='cbp-flinha'){ S.fLbusca=t.value; }
  }
  function bind(){
    var w=MAIN.querySelector('.cbp-wrap'); if(!w) return;
    w.addEventListener('click', onClick);
    w.addEventListener('input', onInput);
  }
  function aberto(){ return MAIN && MAIN.isConnected && MAIN.querySelector('.cbp-wrap'); }
  if(!window.__cbpCloser){
    window.__cbpCloser=function(e){
      if(!S || !S.pop || !aberto()) return;
      var t=e&&e.target; if(t&&t.closest&&t.closest('.cbp-popwrap')) return;
      S.pop=null; refresh();
    };
    document.addEventListener('mousedown', window.__cbpCloser);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && S && S.pop && aberto()){ S.pop=null; refresh(); } });
    window.addEventListener('resize', function(){ if(aberto()) fit(); });
  }

  function render(main){
    MAIN=main;
    load();
    S.pop=null;
    main.innerHTML=screenHTML();
    bind();
    fit();
  }

  window.CBP={
    render:render,
    setUnid:function(u){ load(); S.unid=u; persist(); if(aberto()) refresh(); },
    setMode:function(m){ load(); S.mode=m; persist(); if(aberto()) refresh(); },
    abrir:function(w){ load(); openPop(w); if(aberto()) refresh(); },
    expandir:function(on){ load(); S.pedAberto=on!==false; persist(); if(aberto()) refreshBody(); },
    _pedidos:function(){ return PEDIDOS; },
    _reset:function(){ S=defaults(); persist(); if(aberto()) refresh(); }
  };
})();
