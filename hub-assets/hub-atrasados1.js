/* ══ COMERCIAL › PEDIDOS › ATRASADOS (hub-atrasados1) ══
   Porte da página "Atrasados" do Power BI "Resumo de Pedidos" (pedido do Diego, 19/11/2026).
   · 3ª sub-aba de Comercial › Pedidos (Produtos / Representantes / Atrasados).
   · Topo: busca, período do gráfico (ícone de calendário) e funil — nada de filtro aberto na tela.
     Funil: Estado e Cidade, Região, Rede e Cliente, Representante, Class. representante,
     Dias emitidos (de/até) e "Atrasado a partir de N dias" (gravado em taskflow_atrasados.prazo).
   · Indicadores: Semana atual (ciclo de rota), Pedidos atrasados, Valor, Caixas, Tempo médio de entrega.
   · Gráfico: tempo médio de entrega (dias, emissão → entrega) por mês ou por ano, recalculado com os
     filtros. Cliente escolhido (no funil ou clicando no nome na tabela) = linha do cliente + Geral tracejado.
   · Tabela: agrupada por representante (recolhível), "Pedido | Cód — Cliente", Pedidos, Valor, Caixas,
     Data emissão, Dias emitidos (maior primeiro), UF, Cidade, Semana lançada, Região + Total.
   · Layout: ATR.layout = 2 (padrão, aprovado 19/11: indicadores e gráfico lado a lado) | 1 (gráfico largo abaixo).
   · Substitui a antiga sub-aba "Pedidos em aberto" (_comAba 'aberto' redireciona para cá).
   · ⚠️ DADOS FICTÍCIOS gerados com semente fixa (sempre iguais). Regra P0: render não grava. */
(function(){
  'use strict';
  var LS_KEY='taskflow_atrasados';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function num(n,d){ return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
  function brl(n){ return 'R$ '+num(n,2); }
  function dBR(iso){ var p=String(iso).split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(2); }
  function hojeD(){ var d=new Date(); d.setHours(12,0,0,0); return d; }
  function isoD(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function diasDesde(iso){ return Math.round((hojeD()-new Date(iso+'T12:00:00'))/86400000); }
  function lsSet(k,v){ try{ return (typeof safeSetItem==='function') ? safeSetItem(k,v) : (localStorage.setItem(k,v),true); }catch(e){ return false; } }
  var MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // ── Dados fictícios ───────────────────────────────────────────────────────────────────────
  function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  var REPS=[ // cód, nome, classe
    [11,'Carla Demo (Serra)','Rep. varejo'],[12,'Fábio Exemplo (Vales)','Rep. varejo'],
    [21,'Canal Litoral Demo','Broker'],[31,'Televendas (Ana Demo)','Televendas'],
    [41,'Marcos Fictício (Oeste)','Rep. varejo'],[51,'Key Account Demo','Key account']];
  var CLIS=[ // cód, nome, rede, cidade, UF, região, rep, semana de rota, lead base (dias)
    [1001,'Mercado Praça Imaginária','—','Caxias do Sul','RS','Serra',11,'Sem 1',3.1],
    [1002,'Padaria Sol de Mentira','—','Bento Gonçalves','RS','Serra',11,'Sem 2',3.4],
    [1003,'Empório dos Quatro Ventos','Rede Bom Grão Demo','Farroupilha','RS','Serra',11,'Sem 1',3.0],
    [1004,'Cantina Estrela Falsa','—','Garibaldi','RS','Serra',11,'Sem 2',3.6],
    [1005,'Supermercado Vale Demo','Rede Bom Grão Demo','Lajeado','RS','Vale do Taquari',12,'Sem 1',3.5],
    [1006,'Quitanda Lua de Papel','—','Estrela','RS','Vale do Taquari',12,'Sem 2',3.9],
    [1007,'Atacado Ponte Fictícia','—','Santa Cruz do Sul','RS','Vale do Rio Pardo',12,'Sem 1',4.2],
    [1008,'Mini Box Exemplo','—','Venâncio Aires','RS','Vale do Rio Pardo',12,'Sem 2',4.0],
    [1009,'Comercial Maré Alta Demo','Rede Costa Demo','Itajaí','SC','Litoral Norte SC',21,'Sem 1',4.4],
    [1010,'Mercado Farol de Papel','Rede Costa Demo','Balneário Camboriú','SC','Litoral Norte SC',21,'Sem 1',4.1],
    [1011,'Empório Areia Fina','—','Torres','RS','Litoral Norte RS',21,'Sem 2',3.8],
    [1012,'Super Onda Fictícia','—','Tramandaí','RS','Litoral Norte RS',21,'Sem 2',3.7],
    [1013,'Armazém Bairro Demo','—','Porto Alegre','RS','Metropolitana',31,'Sem 1',2.6],
    [1014,'Padaria Pão de Exemplo','—','Canoas','RS','Metropolitana',31,'Sem 1',2.8],
    [1015,'Mercearia Dona Fictícia','—','Novo Hamburgo','RS','Metropolitana',31,'Sem 2',2.9],
    [1016,'Lanchonete Ponto Demo','—','Gravataí','RS','Metropolitana',31,'Sem 2',2.7],
    [1017,'Supermercado Planalto Demo','Rede Planalto Demo','Passo Fundo','RS','Planalto',41,'Sem 1',4.6],
    [1018,'Mercado Coxilha Exemplo','Rede Planalto Demo','Erechim','RS','Planalto',41,'Sem 2',4.9],
    [1019,'Comércio Oeste Fictício','—','Chapecó','SC','Oeste SC',41,'Sem 1',5.3],
    [1020,'Distribuidora Rio Demo','—','Joaçaba','SC','Oeste SC',41,'Sem 2',5.6],
    [1021,'Rede Sabor Sul Demo — Loja 1','Rede Sabor Sul Demo','Porto Alegre','RS','Metropolitana',51,'Sem 1',2.9],
    [1022,'Rede Sabor Sul Demo — Loja 4','Rede Sabor Sul Demo','Pelotas','RS','Sul',51,'Sem 2',4.8],
    [1023,'Atacarejo Campo Demo','—','Santa Maria','RS','Centro',51,'Sem 1',4.3],
    [1024,'Mercado Fronteira Exemplo','—','Santana do Livramento','RS','Fronteira Oeste',51,'Sem 2',5.9],
    [1025,'Empório Blumen Demo','—','Blumenau','SC','Vale do Itajaí',21,'Sem 2',4.2],
    [1026,'Padaria Serra Fictícia','—','Gramado','RS','Serra',11,'Sem 1',3.3]];
  var REP_IX={}; REPS.forEach(function(r){ REP_IX[r[0]]=r; });
  var CLI_IX={}; CLIS.forEach(function(c){ CLI_IX[c[0]]=c; });

  // Histórico de entregas: por cliente e mês, {n, soma de dias}. jan/2025 até o mês atual.
  var HIST=null, MES0=[2025,0];
  function mesesAteHoje(){ var h=hojeD(), out=[], y=MES0[0], m=MES0[1];
    while(y<h.getFullYear() || (y===h.getFullYear() && m<=h.getMonth())){ out.push(y+'-'+String(m+1).padStart(2,'0')); m++; if(m>11){m=0;y++;} }
    return out; }
  function gerarHist(){
    var r=rng(20261119), meses=mesesAteHoje(); HIST={};
    CLIS.forEach(function(c,ci){
      meses.forEach(function(mk,mi){
        var mes=+mk.slice(5,7), ano=+mk.slice(0,4);
        var n=2+Math.floor(r()*5); var soma=0;
        var saz=(mes===12||mes===1)?0.7:(mes===7?0.35:0);           // fim de ano e férias de julho atrasam
        var melhora=(ano===2026)?-0.12:0;
        for(var k=0;k<n;k++){ soma+=Math.max(1, c[8]+saz+melhora+(r()-0.5)*2.2 + (ci%5===0&&mi>15?0.6:0)); }
        HIST[c[0]+'|'+mk]={n:n,s:soma};
      });
    });
  }
  // Pedidos em aberto (foto de hoje): [pedido, cód. cliente, valor, caixas, emissão(ISO)]
  var ABERTOS=null;
  function gerarAbertos(){
    var r=rng(84), out=[], ped=310400, h=hojeD();
    CLIS.forEach(function(c){
      var n=1+Math.floor(r()*4);
      for(var k=0;k<n;k++){
        var u=r(), dias=Math.round(u<0.45? r()*5 : (u<0.8? 5+r()*12 : 17+Math.pow(r(),1.6)*67));
        var d=new Date(h); d.setDate(d.getDate()-dias); if(d.getDay()===0) d.setDate(d.getDate()-2); if(d.getDay()===6) d.setDate(d.getDate()-1);
        var cx=Math.round(6+Math.pow(r(),1.5)*120), valor=Math.round(cx*(48+r()*40)*100)/100;
        out.push([ped+=Math.round(3+r()*40), c[0], valor, cx, isoD(d)]);
      }
    });
    ABERTOS=out;
  }

  // ── Estado da tela (só o prazo é gravado) ─────────────────────────────────────────────────
  var CFG={prazo:7};
  try{ var _s=JSON.parse(localStorage.getItem(LS_KEY)||'{}'); if(_s&&_s.prazo>0) CFG.prazo=+_s.prazo; }catch(e){}
  var S={busca:'', fOpen:false, pOpen:false, per:'12m', gran:'mes', layout:2, fechados:{}, sort:{k:'dias',d:-1},
         f:{uf:'',cidade:'',regiao:'',rede:'',cli:'',rep:'',cls:'',dMin:'',dMax:''}};
  var PERIODOS=[['12m','Últimos 12 meses'],['ano','Este ano'],['anoAnt','Ano passado'],['tudo','Desde jan/2025']];

  function nFiltros(){ var f=S.f, n=0; ['uf','cidade','regiao','rede','cli','rep','cls'].forEach(function(k){ if(f[k]) n++; }); if(f.dMin!==''||f.dMax!=='') n++; return n; }
  // filtro de cliente (vale para tabela e gráfico) — sem a busca e sem os dias, que são da tabela
  function cliPassa(c, semCli){
    var f=S.f, rep=REP_IX[c[6]];
    if(f.uf && c[4]!==f.uf) return false;
    if(f.cidade && c[3]!==f.cidade) return false;
    if(f.regiao && c[5]!==f.regiao) return false;
    if(f.rede && c[2]!==f.rede) return false;
    if(f.rep && String(c[6])!==String(f.rep)) return false;
    if(f.cls && rep[2]!==f.cls) return false;
    if(!semCli && f.cli && String(c[0])!==String(f.cli)) return false;
    return true;
  }
  function linhas(){
    var q=norm(S.busca), f=S.f, mn=f.dMin===''?-1:+f.dMin, mx=f.dMax===''?1e9:+f.dMax;
    return ABERTOS.map(function(p){ var c=CLI_IX[p[1]]; return {p:p,c:c,rep:REP_IX[c[6]],dias:diasDesde(p[4])}; })
      .filter(function(x){
        if(!cliPassa(x.c)) return false;
        if(x.dias<CFG.prazo) return false;                       // aba = só atrasados
        if(x.dias<mn || x.dias>mx) return false;
        if(q && (norm(x.c[1]).indexOf(q)<0 && String(x.p[0]).indexOf(q)<0 && String(x.c[0]).indexOf(q)<0 && norm(x.c[3]).indexOf(q)<0 && norm(x.rep[1]).indexOf(q)<0)) return false;
        return true;
      });
  }
  // série do gráfico: [{k, rot, v (média), n}] para o conjunto de clientes que passa
  function mesesDoPeriodo(){
    var ms=mesesAteHoje(), h=hojeD(), a=String(h.getFullYear());
    if(S.per==='12m') return S.gran==='ano'?ms:ms.slice(-12);   // por ano, 12 meses cortaria o ano passado ao meio
    if(S.per==='ano') return ms.filter(function(m){ return m.slice(0,4)===a; });
    if(S.per==='anoAnt') return ms.filter(function(m){ return m.slice(0,4)===String(h.getFullYear()-1); });
    return ms;
  }
  function serie(clis){
    var ms=mesesDoPeriodo(), grp={}, ordem=[];
    ms.forEach(function(m){
      var k=S.gran==='ano'?m.slice(0,4):m;
      if(!grp[k]){ grp[k]={n:0,s:0}; ordem.push(k); }
      clis.forEach(function(c){ var h=HIST[c[0]+'|'+m]; if(h){ grp[k].n+=h.n; grp[k].s+=h.s; } });
    });
    return ordem.map(function(k){ var g=grp[k];
      return {k:k, rot:S.gran==='ano'?k:(MESES[+k.slice(5,7)-1]+'/'+k.slice(2,4)), v:g.n?g.s/g.n:null, n:g.n}; });
  }
  function mediaDe(sr){ var n=0,s=0; sr.forEach(function(x){ if(x.v!=null){ n+=x.n; s+=x.v*x.n; } }); return n?s/n:null; }
  function semanaAtual(){ // ciclo de rota de 2 semanas (Sem 1 / Sem 2), contado da semana ISO
    var d=hojeD(), t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); var dn=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-dn);
    var y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)); var w=Math.ceil(((t-y0)/86400000+1)/7);
    return {iso:w, ciclo:(w%2===0)?2:1};
  }

  // ── Topo: breadcrumb, título e ações ──────────────────────────────────────────────────────
  function acoesHTML(){
    var busca='<span class="cp-buscaw"><i class="ti ti-search"></i><input id="atr-busca" class="cp-busca" value="'+esc(S.busca)+'" oninput="ATR.buscar(this.value)" placeholder="Buscar cliente, pedido, cidade ou representante"></span>';
    var at=PERIODOS.filter(function(p){ return p[0]===S.per; })[0];
    var per='<span class="cp-pop-wrap atr-pw" style="position:relative;display:inline-flex"><button class="cp-abtn txt'+(S.pOpen?' on':'')+'" title="Período do gráfico" onclick="ATR.togglePer()"><i class="ti ti-calendar-stats"></i>'+esc(at[1])+'<i class="ti ti-chevron-down" style="font-size:13px;color:var(--text3)"></i></button>'
      +(S.pOpen?'<div class="cp-pop lista" style="min-width:214px">'+PERIODOS.map(function(p){ return '<button class="cp-perit'+(p[0]===S.per?' on':'')+'" onclick="ATR.setPer(\''+p[0]+'\')">'+esc(p[1])+'</button>'; }).join('')+'<div class="atr-pnote">Vale para o gráfico e o tempo médio. A tabela é a foto de hoje.</div></div>':'')+'</span>';
    var n=nFiltros();
    var fil='<span class="cp-pop-wrap atr-pw" id="atr-fwrap" style="position:relative;display:inline-flex"><button class="cp-abtn'+(S.fOpen||n?' on':'')+'" title="Filtros" onclick="ATR.toggleFiltro()"><i class="ti ti-filter"></i>'+(n?'<span class="cp-abtn-badge">'+n+'</span>':'')+'</button>'+(S.fOpen?popHTML():'')+'</span>';
    return '<span class="cp-acoes">'+busca+per+fil+'</span>';
  }
  function uniq(arr){ var o=[]; arr.forEach(function(v){ if(v&&v!=='—'&&o.indexOf(v)<0) o.push(v); }); return o.sort(function(a,b){ return String(a).localeCompare(String(b),'pt-BR'); }); }
  function sel(k, rot, opts, vazio){
    return '<label class="atr-f"><span>'+rot+'</span><select onchange="ATR.setF(\''+k+'\',this.value)"><option value="">'+(vazio||'Todos')+'</option>'
      +opts.map(function(o){ var v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o; return '<option value="'+esc(v)+'"'+(String(S.f[k])===String(v)?' selected':'')+'>'+esc(t)+'</option>'; }).join('')+'</select></label>';
  }
  function popHTML(){
    var f=S.f;
    var cidades=uniq(CLIS.filter(function(c){ return !f.uf||c[4]===f.uf; }).map(function(c){ return c[3]; }));
    var clis=CLIS.filter(function(c){ return cliPassa(c,true); }).map(function(c){ return [c[0], c[0]+' — '+c[1]]; });
    return '<div class="cp-pop atr-pop" onmousedown="event.stopPropagation()">'
      +'<div class="atr-poph"><b>Filtros</b>'+(nFiltros()?'<u onclick="ATR.limpar()">Limpar</u>':'')+'</div>'
      +'<div class="atr-fg"><div class="atr-ft">Estado e cidade</div><div class="atr-f2">'+sel('uf','UF',uniq(CLIS.map(function(c){ return c[4]; })))+sel('cidade','Cidade',cidades,'Todas')+'</div></div>'
      +'<div class="atr-fg">'+sel('regiao','Região',uniq(CLIS.map(function(c){ return c[5]; })),'Todas')+'</div>'
      +'<div class="atr-fg"><div class="atr-ft">Rede e cliente</div>'+sel('rede','Rede',uniq(CLIS.map(function(c){ return c[2]; })),'Todas')+sel('cli','Cliente',clis)+'</div>'
      +'<div class="atr-fg"><div class="atr-f2">'+sel('rep','Representante',REPS.map(function(r){ return [r[0],r[1]]; }))+sel('cls','Class. representante',uniq(REPS.map(function(r){ return r[2]; })),'Todas')+'</div></div>'
      +'<div class="atr-fg"><div class="atr-ft">Dias emitidos</div><div class="atr-rng">de <input type="number" min="0" value="'+esc(f.dMin)+'" placeholder="'+CFG.prazo+'" onchange="ATR.setF(\'dMin\',this.value)"> até <input type="number" min="0" value="'+esc(f.dMax)+'" placeholder="máx." onchange="ATR.setF(\'dMax\',this.value)"> dias</div></div>'
      +'<div class="atr-fg atr-sep"><div class="atr-rng">Atrasado a partir de <input type="number" min="1" value="'+CFG.prazo+'" onchange="ATR.setPrazo(this.value)"> dias da emissão</div></div>'
      +'</div>';
  }

  // ── Indicadores + gráfico ─────────────────────────────────────────────────────────────────
  function kpi(lab,val,sub,cls){ return '<div class="cp-ind atr-kpi'+(cls?' '+cls:'')+'"><span class="lab">'+lab+'</span><span class="val">'+val+'</span>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</div>'; }
  function painelHTML(L){
    var clis=CLIS.filter(function(c){ return cliPassa(c); });
    var sr=serie(clis), med=mediaDe(sr);
    var cliSel=S.f.cli?CLI_IX[S.f.cli]:null;
    var srGeral=cliSel?serie(CLIS.filter(function(c){ return cliPassa(c,true); })):null;
    var sw=semanaAtual();
    var v=L.reduce(function(s,x){ return s+x.p[2]; },0), cx=L.reduce(function(s,x){ return s+x.p[3]; },0);
    var crit=L.filter(function(x){ return x.dias>=15; }).length;
    var at=(S.gran==='ano'&&S.per==='12m')?'desde jan/2025':PERIODOS.filter(function(p){ return p[0]===S.per; })[0][1].toLowerCase();
    var kp=kpi('Semana atual', num(sw.ciclo), 'semana '+sw.iso+' do ano')
      +kpi('Pedidos atrasados', num(L.length), crit?num(crit)+' com 15+ dias':'nenhum com 15+ dias', crit?'red':'')
      +kpi('Valor atrasado', brl(v), '')
      +kpi('Caixas', num(cx), '')
      +kpi('Tempo médio de entrega', med!=null?num(med,2)+' dias':'—', (cliSel?'do cliente · ':'')+at);
    var tit='Tempo médio de entrega'+(cliSel?' — <b>'+esc(cliSel[1])+'</b> <button class="atr-x" title="Voltar para todos" onclick="ATR.setF(\'cli\',\'\')"><i class="ti ti-x"></i></button>':(nFiltros()?' — <span class="atr-muted">com os filtros</span>':''));
    var gran='<span class="atr-seg"><button class="'+(S.gran==='mes'?'on':'')+'" onclick="ATR.setGran(\'mes\')">Mês</button><button class="'+(S.gran==='ano'?'on':'')+'" onclick="ATR.setGran(\'ano\')">Ano</button></span>';
    var leg=cliSel?'<span class="atr-leg"><i class="a"></i>Cliente <i class="g"></i>Geral</span>':'';
    var graf='<div class="atr-chart"><div class="atr-ch-h"><span class="atr-ch-t">'+tit+'</span>'+leg+gran+'</div>'+chartHTML(sr, srGeral)+'</div>';
    if(S.layout===2) return '<div class="atr-band l2"><div class="atr-kgrid">'+kp+'</div>'+graf+'</div>';
    return '<div class="atr-kpis">'+kp+'</div>'+graf;
  }
  function chartHTML(sr, geral){
    var pts=sr.filter(function(x){ return x.v!=null; });
    if(!pts.length) return '<div class="atr-vz">Sem entregas no período para esse filtro.</div>';
    var all=pts.map(function(x){ return x.v; }).concat(geral?geral.filter(function(x){return x.v!=null;}).map(function(x){ return x.v; }):[]);
    var mx=Math.max.apply(null,all), mn=Math.min.apply(null,all);
    var top=Math.ceil(mx+0.6), bot=Math.max(0,Math.floor(mn-1)); if(top-bot<2) top=bot+2;
    var n=sr.length, W=1000, H=100, padX=n>1?0:50;
    var X=function(i){ return n>1? (3+i*(94/(n-1))) : 50; };            // em % da largura
    var Y=function(v){ return 8+(1-(v-bot)/(top-bot))*80; };            // em % da altura
    function path(s){ var d='', st=false; s.forEach(function(x,i){ if(x.v==null){ st=false; return; } d+=(st?' L':' M')+(X(i)*W/100).toFixed(1)+','+(Y(x.v)*H/100).toFixed(2); st=true; }); return d; }
    var d=path(sr);
    var first=sr.findIndex(function(x){ return x.v!=null; }), last=sr.length-1; while(last>=0&&sr[last].v==null) last--;
    var area=d+' L'+(X(last)*W/100).toFixed(1)+','+H+' L'+(X(first)*W/100).toFixed(1)+','+H+' Z';
    var grid=''; for(var g=bot; g<=top; g+=((top-bot)>4?2:1)){ grid+='<div class="atr-gl" style="top:'+Y(g)+'%"><span>'+num(g)+'</span></div>'; }
    var svg='<svg class="atr-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'
      +'<path d="'+area+'" class="ar"/>'
      +(geral?'<path d="'+path(geral)+'" class="gl"/>':'')
      +'<path d="'+d+'" class="ln"/></svg>';
    var labs='', xs='';
    var cada=n>14?2:1;
    sr.forEach(function(x,i){
      xs+='<span class="atr-xl" style="left:'+X(i)+'%">'+esc(x.rot)+'</span>';
      if(x.v==null) return;
      labs+='<span class="atr-dot" style="left:'+X(i)+'%;top:'+Y(x.v)+'%" title="'+esc(x.rot)+': '+num(x.v,2)+' dias · '+num(x.n)+' entregas"></span>';
      if(i%cada===0||i===last) labs+='<span class="atr-vl" style="left:'+X(i)+'%;top:'+Y(x.v)+'%">'+num(x.v,2)+'</span>';
    });
    return '<div class="atr-plot">'+grid+svg+labs+'<div class="atr-xaxis">'+xs+'</div></div>';
  }

  // ── Tabela ────────────────────────────────────────────────────────────────────────────────
  var COLS=[['ped','Pedido | Cód — Cliente','l'],['n','Pedidos','','Ped.'],['valor','Valor',''],['cx','Caixas',''],['emi','Data emissão','','Emissão'],['dias','Dias emitidos','','Dias'],['uf','UF','c'],['cidade','Cidade','l'],['sem','Semana lançada','c','Semana'],['reg','Região','l']];
  var ACC={ped:function(x){ return x.p[0]; }, n:function(){ return 1; }, valor:function(x){ return x.p[2]; }, cx:function(x){ return x.p[3]; }, emi:function(x){ return x.p[4]; }, dias:function(x){ return x.dias; },
    uf:function(x){ return x.c[4]; }, cidade:function(x){ return x.c[3]; }, sem:function(x){ return x.c[7]; }, reg:function(x){ return x.c[5]; }};
  function cmp(a,b){ var k=S.sort.k, f=ACC[k]||ACC.dias, va=f(a), vb=f(b); var r=(typeof va==='number')?va-vb:String(va).localeCompare(String(vb),'pt-BR'); return r*S.sort.d || (b.dias-a.dias); }
  function diasCls(d){ return d>=30?'d3':(d>=15?'d2':''); }
  function tabelaHTML(L){
    var g={}, ordem=[];
    L.forEach(function(x){ var k=x.rep[0]; if(!g[k]){ g[k]={rep:x.rep,it:[]}; ordem.push(k); } g[k].it.push(x); });
    ordem.forEach(function(k){ g[k].it.sort(cmp); g[k].mx=Math.max.apply(null,g[k].it.map(function(x){ return x.dias; })); g[k].v=g[k].it.reduce(function(s,x){ return s+x.p[2]; },0); g[k].cx=g[k].it.reduce(function(s,x){ return s+x.p[3]; },0); });
    ordem.sort(function(a,b){ var A=g[a],B=g[b];
      if(S.sort.k==='valor') return (A.v-B.v)*S.sort.d; if(S.sort.k==='cx') return (A.cx-B.cx)*S.sort.d; if(S.sort.k==='n') return (A.it.length-B.it.length)*S.sort.d;
      return B.mx-A.mx; });
    var th=COLS.map(function(c){ var on=S.sort.k===c[0];
      return '<th class="'+c[2]+' c-'+c[0]+(on?' on':'')+'" title="'+esc(c[1])+'" onclick="ATR.sortBy(\''+c[0]+'\')">'+(c[3]?'<span class="lg">'+c[1]+'</span><span class="sh">'+c[3]+'</span>':c[1])+(on?' <i class="ti ti-arrow-'+(S.sort.d<0?'down':'up')+'"></i>':'')+'</th>'; }).join('');
    var body='';
    ordem.forEach(function(k){ var G=g[k], fe=!!S.fechados[k];
      body+='<tr class="atr-g" onclick="ATR.toggleGrp('+k+')"><td class="l"><i class="ti ti-chevron-'+(fe?'right':'down')+'"></i><span class="cod">'+G.rep[0]+'</span> '+esc(G.rep[1])+' <span class="atr-cls">'+esc(G.rep[2])+'</span></td>'
        +'<td>'+num(G.it.length)+'</td><td>'+brl(G.v)+'</td><td>'+num(G.cx)+'</td><td></td><td>'+num(G.mx)+'</td><td colspan="4"></td></tr>';
      if(fe) return;
      G.it.forEach(function(x){ var sel=String(S.f.cli)===String(x.c[0]);
        body+='<tr class="atr-r'+(sel?' sel':'')+'"><td class="l"><span class="cod">'+x.p[0]+'</span> <span class="sepb">|</span> <button class="atr-cli" title="Ver o tempo médio de entrega deste cliente no gráfico" onclick="ATR.pickCli('+x.c[0]+')">'+x.c[0]+' — '+esc(x.c[1])+'</button></td>'
          +'<td>1</td><td>'+brl(x.p[2])+'</td><td>'+num(x.p[3])+'</td><td>'+dBR(x.p[4])+'</td><td class="dd '+diasCls(x.dias)+'">'+num(x.dias)+'</td>'
          +'<td class="c">'+x.c[4]+'</td><td class="l" title="'+esc(x.c[3]+'/'+x.c[4])+'">'+esc(x.c[3])+'</td><td class="c">'+esc(x.c[7])+'</td><td class="l" title="'+esc(x.c[5])+'">'+esc(x.c[5])+'</td></tr>';
      });
    });
    if(!L.length) body='<tr><td colspan="10" class="atr-vz">Nenhum pedido atrasado com esse filtro.</td></tr>';
    var v=L.reduce(function(s,x){ return s+x.p[2]; },0), cx=L.reduce(function(s,x){ return s+x.p[3]; },0);
    var mx=L.length?Math.max.apply(null,L.map(function(x){ return x.dias; })):0;
    var tot='<tr class="atr-tot"><td class="l">Total</td><td>'+num(L.length)+'</td><td>'+brl(v)+'</td><td>'+num(cx)+'</td><td></td><td>'+(L.length?num(mx):'')+'</td><td colspan="4"></td></tr>';
    var cols='<colgroup><col class="w-ped"><col class="w-n"><col class="w-valor"><col class="w-cx"><col class="w-emi"><col class="w-dias"><col class="w-uf"><col class="w-cid"><col class="w-sem"><col class="w-reg"></colgroup>';
    var allF=ordem.length&&ordem.every(function(k){ return S.fechados[k]; });
    return '<div class="atr-tbar"><span class="atr-tt">'+num(L.length)+' pedidos atrasados · '+num(ordem.length)+' representantes</span><span class="atr-legd"><i class="d2"></i>15+ dias <i class="d3"></i>30+ dias</span>'
      +'<button class="atr-lnk" onclick="ATR.todos('+(allF?0:1)+')"><i class="ti ti-'+(allF?'arrows-maximize':'arrows-minimize')+'"></i>'+(allF?'Abrir todos':'Recolher todos')+'</button></div>'
      +'<div class="atr-tw"><table class="atr-t">'+cols+'<thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody><tfoot>'+tot+'</tfoot></table></div>';
  }

  // ── Render ────────────────────────────────────────────────────────────────────────────────
  function render(main){
    if(!HIST) gerarHist(); if(!ABERTOS) gerarAbertos();
    main=main||document.getElementById('task-container'); if(!main) return;
    var L=linhas();
    var bc=(typeof hubBreadcrumb==='function')?hubBreadcrumb([{label:'Comercial',onclick:"setComercialView('pedidos')"},{label:'Pedidos',onclick:"_comSetAba('produtos')"},{label:'Atrasados'}]):'';
    var head=(typeof hubHead==='function')?hubHead('Pedidos','',acoesHTML()):'<h2>Pedidos</h2>'+acoesHTML();
    var abas=(typeof _comAbasHTML==='function')?_comAbasHTML():'';
    main.innerHTML='<div id="atr-root" class="atr-root l'+S.layout+'" style="padding:20px 4px 60px">'+(typeof _cpCSS==='function'?_cpCSS():'')+(typeof _comCSS==='function'?_comCSS():'')
      +bc+head+abas+'<div id="atr-corpo">'+corpoHTML(L)+'</div></div>';
  }
  function corpoHTML(L){ return painelHTML(L)+tabelaHTML(L); }
  function refresh(){ var el=document.getElementById('atr-corpo'); if(!el){ render(); return; } el.innerHTML=corpoHTML(linhas()); }
  function rerender(){ render(document.getElementById('task-container')); }
  function count(){ if(!ABERTOS) gerarAbertos(); return ABERTOS.filter(function(p){ return diasDesde(p[4])>=CFG.prazo; }).length; }

  if(!window.__atrCloser){
    window.__atrCloser=function(e){ var t=e&&e.target; if(t&&t.closest&&t.closest('.atr-pw')) return;
      if(S.fOpen||S.pOpen){ S.fOpen=false; S.pOpen=false; if(document.getElementById('atr-root')) rerender(); } };
    document.addEventListener('mousedown', window.__atrCloser);
  }

  window.ATR={
    render:render, count:count,
    get layout(){ return S.layout; }, set layout(v){ S.layout=+v===2?2:1; },
    setLayout:function(v){ S.layout=+v===2?2:1; rerender(); },
    buscar:function(v){ S.busca=v; refresh(); },
    togglePer:function(){ S.pOpen=!S.pOpen; S.fOpen=false; rerender(); },
    setPer:function(p){ S.per=p; S.pOpen=false; rerender(); },
    setGran:function(g){ S.gran=g; refresh(); },
    toggleFiltro:function(){ S.fOpen=!S.fOpen; S.pOpen=false; rerender(); },
    setF:function(k,v){ S.f[k]=v; if(k==='uf') S.f.cidade=''; if(k!=='cli'&&S.f.cli&&!cliPassa(CLI_IX[S.f.cli],true)) S.f.cli=''; rerender(); },
    limpar:function(){ S.f={uf:'',cidade:'',regiao:'',rede:'',cli:'',rep:'',cls:'',dMin:'',dMax:''}; rerender(); },
    setPrazo:function(v){ v=parseInt(v,10); if(!(v>0)) return; CFG.prazo=v; lsSet(LS_KEY, JSON.stringify(CFG)); rerender(); },
    pickCli:function(id){ if(window.event) window.event.stopPropagation(); S.f.cli=(String(S.f.cli)===String(id))?'':String(id); rerender(); },
    sortBy:function(k){ if(S.sort.k===k) S.sort.d=-S.sort.d; else { S.sort.k=k; S.sort.d=(k==='ped'||k==='uf'||k==='cidade'||k==='sem'||k==='reg'||k==='emi')?1:-1; } refresh(); },
    toggleGrp:function(k){ if(S.fechados[k]) delete S.fechados[k]; else S.fechados[k]=1; refresh(); },
    todos:function(fechar){ linhas().forEach(function(x){ if(fechar) S.fechados[x.rep[0]]=1; else delete S.fechados[x.rep[0]]; }); refresh(); },
    _state:S
  };
})();
