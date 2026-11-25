/* ══ PCP › CONTAGEM (hub-contagem-pcp1) — visão por grupo ══════════════════════════════════════
   Fase 1 do blueprint `PCP_Contagem__Blueprint.md` (24/11/2026). Aba de ANÁLISE da contagem cíclica
   de toda noite: lê o que viria do export do ERP e NUNCA escreve no ERP.

   ⚠️ NÃO CONFUNDIR com `hub-contagem1.js`, que é Comercial › Marcas Próprias › Contagem (embalagens
   por cliente). Outra tela, outra lógica. Prefixo daqui: CPC / .cpc- / --cpc-.

   ⭐ O MODELO: o ERP registra a contagem e NÃO ajusta o saldo (decisão do Diego, 24/11). Por isso
   o `gap` (contado − sistema) NÃO some sozinho: ele fica até que um lançamento o feche. É isso que
   dá sentido aos perfis abaixo — e é por isso que somar gaps é PROIBIDO (um gap de −12 parado por
   4 contagens somaria −48, mas a perda é 12). O fato novo do período é a VARIAÇÃO do gap.

   OS SEIS PERFIS (classificar(), seção abaixo) — [proposta] do blueprint, não padrão de mercado:
     limpo    todas as contagens dentro da tolerância        → candidato a contar menos
     fecha    abre e volta a zero (índice < 0,35)            → lançamento atrasado, NÃO é perda
     divida   mesmo valor repetido                           → um erro só, nunca corrigido
     sangra   módulo crescendo (índice > 0,65)               → perda acontecendo agora
     caotico  índice baixo mas amplitude enorme              → unidade / fator de conversão
     mal      um terço ou mais das noites sem contagem       → aderência, não acuracidade
   O índice é |soma das variações| ÷ soma das variações em módulo. ⚠️ Ele sozinho NÃO separa
   'fecha' de 'caotico' (os dois alternam): quem separa é a amplitude. Ver o blueprint.

   TOLERÂNCIA POR CLASSE (decisão do Diego): A 0,5% · B 1% · C 2% do saldo, mínimo de 1 unidade.
   Editável no funil e gravada em taskflow_contagem_pcp.

   ⚠️ DADOS 100% FICTÍCIOS, gerados por semente determinística a partir do código do item: o
   arquivo não muda sozinho a cada abertura. Este repositório é PÚBLICO (regra de 26/10).

   Regra P0: render NÃO grava; só ação do usuário grava.
   Entrada: renderProducao() chama CPC.render(main) quando producaoView==='contagem'. */
(function(){
  'use strict';

  var LS_KEY='taskflow_contagem_pcp';
  var N_CONT=10;                       // contagens mostradas por item
  var TOL_PADRAO={A:0.5,B:1,C:2};      // % do saldo

  // ── estado de tela ────────────────────────────────────────────────────────────────────────
  var S={ ind:'todos', busca:'', fOpen:false, vista:'tabela', f:{grupos:{},classes:{},perfil:''},
          tol:{A:TOL_PADRAO.A,B:TOL_PADRAO.B,C:TOL_PADRAO.C}, fech:{}, sort:{k:'pdiv',d:-1} };
  var MAIN=null, DADOS=null;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function nf(n,d){ return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
  // (o cartão "Dívida da ficha" em R$ saiu da tela a pedido do Diego em 24/11; o campo `gapRS`
  //  continua na linha, porque a coluna de gap em R$ é fase seguinte no blueprint)
  function lsSet(k,v){ try{ return (typeof safeSetItem==='function')?safeSetItem(k,v):(localStorage.setItem(k,v),true); }catch(e){ return false; } }
  function lsGet(k,fb){ try{ return (typeof safeJSON==='function')?safeJSON(k,fb):JSON.parse(localStorage.getItem(k)||'null')||fb; }catch(e){ return fb; } }

  function persist(){ lsSet(LS_KEY, JSON.stringify({tol:S.tol, fech:S.fech, sort:S.sort, vista:S.vista})); }
  function restore(){ var o=lsGet(LS_KEY,null); if(o&&typeof o==='object'){
    if(o.tol) S.tol={A:+o.tol.A||TOL_PADRAO.A, B:+o.tol.B||TOL_PADRAO.B, C:+o.tol.C||TOL_PADRAO.C};
    if(o.fech) S.fech=o.fech; if(o.sort) S.sort=o.sort;
    if(o.vista==='mapa'||o.vista==='tabela') S.vista=o.vista; } }

  // ── base fictícia ─────────────────────────────────────────────────────────────────────────
  // [codigo, nome, unidade, classe, custo unitário, saldo do sistema, comportamento semeado]
  var ITENS=[
    ['MP-101','Farinha de trigo','kg','A',3.20,18400,'limpo'],
    ['MP-102','Açúcar refinado','kg','A',4.10,12600,'fecha'],
    ['MP-103','Açúcar invertido','kg','B',5.40,3100,'ruido'],
    ['MP-104','Gordura vegetal','kg','A',9.80,7400,'sangra'],
    ['MP-105','Óleo de soja','L','B',7.30,2200,'limpo'],
    ['MP-106','Amido de milho','kg','B',4.60,2850,'fecha'],
    ['MP-107','Fermento químico','kg','C',11.20,460,'limpo'],
    ['MP-108','Sal refinado','kg','C',1.90,1250,'ruido'],
    ['MP-109','Leite em pó','kg','A',22.50,1980,'divida'],
    ['MP-110','Cacau em pó','kg','A',28.40,1340,'sangra'],
    ['MP-111','Lecitina de soja','kg','C',14.70,320,'limpo'],
    ['MP-112','Mel','kg','B',19.80,540,'ruido'],
    ['MP-113','Pré-mistura base','kg','A',6.70,5600,'sangra'],
    ['MP-114','Aroma baunilha','L','C',86.00,78,'mal'],

    ['EM-201','Filme BOPP','kg','A',18.40,4200,'caotico'],
    ['EM-202','Bobina laminada','kg','A',24.90,2650,'caotico'],
    ['EM-203','Caixa de papelão 250g','un','B',1.35,24800,'limpo'],
    ['EM-204','Caixa de papelão 500g','un','B',1.72,13400,'ruido'],
    ['EM-205','Etiqueta branca','un','C',0.09,86000,'mal'],
    ['EM-206','Fita adesiva','un','C',4.20,640,'limpo'],
    ['EM-207','Filme stretch','kg','B',16.10,780,'fecha'],
    ['EM-208','Bandeja PS','un','C',0.42,9600,'divida'],
    ['EM-209','Saco plástico','un','C',0.07,54000,'mal'],
    ['EM-210','Pallet PBR','un','B',92.00,310,'divida'],

    ['PA-301','Pão de mel 250g','cx','A',38.60,1840,'limpo'],
    ['PA-302','Biscoito amanteigado 240g','cx','A',29.40,2260,'fecha'],
    ['PA-303','Rosquinha de coco 500g','cx','B',33.10,980,'ruido'],
    ['PA-304','Salgadinho palitinho 138g','cx','A',26.80,3120,'sangra'],
    ['PA-305','Suspiro tradicional 100g','cx','C',21.50,420,'limpo'],
    ['PA-306','Pipoca doce 100g','cx','B',18.90,760,'ruido'],
    ['PA-307','Pasta de amendoim 450g','cx','B',52.30,540,'fecha'],
    ['PA-308','Alfajor premium 38g','cx','C',44.70,290,'limpo'],
    ['PA-309','Batata frita 85g','cx','B',31.20,870,'divida'],

    ['IN-401','Detergente alcalino','L','C',12.80,340,'limpo'],
    ['IN-402','Sanitizante clorado','L','C',9.60,280,'ruido'],
    ['IN-403','Álcool 70','L','C',8.40,190,'mal'],
    ['IN-404','Luva nitrílica','par','C',1.10,2400,'fecha'],
    ['IN-405','Touca descartável','un','C',0.18,8600,'mal'],
    ['IN-406','Papel toalha','rolo','C',6.90,420,'limpo'],
    ['IN-407','Esponja industrial','un','C',3.20,260,'nunca'],

    ['MK-501','Display de PDV','un','C',46.00,120,'mal'],
    ['MK-502','Banner de gôndola','un','C',28.50,86,'limpo'],
    ['MK-503','Brinde caneta','un','C',2.40,1800,'divida'],
    ['MK-504','Folder promocional','un','C',0.85,4200,'mal'],
    ['MK-505','Adesivo de gôndola','un','C',1.60,960,'ruido'],
    ['MK-506','Expositor de balcão','un','C',38.00,45,'nunca']
  ];
  var GRUPOS=[['MP','Matéria-prima'],['EM','Embalagem'],['PA','Produto acabado'],
              ['IN','Insumos e higiene'],['MK','Marketing']];
  var CONTADORES=['Equipe A (demo)','Equipe B (demo)','Equipe C (demo)'];

  // ── gerador determinístico ────────────────────────────────────────────────────────────────
  function hash(str){ var h=2166136261,i; for(i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function rng(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

  // Gera a série de gaps (do mais ANTIGO para o mais RECENTE). null = noite em que não foi contado.
  // ⚠️ `tolRef` é a tolerância PADRÃO da classe, não a que o usuário editou no funil: a quantidade
  // contada é um fato e não pode mudar porque alguém mexeu numa tolerância. A tolerância editável
  // entra só na classificação, mais abaixo — mexer nela reclassifica, nunca reescreve o dado.
  function serieDe(comport, tolRef, r){
    var u=Math.max(1, Math.round(tolRef)), g=[], i, v, acc;
    function um(mult){ return Math.round(u*mult*(0.85+r()*0.3)); }
    for(i=0;i<N_CONT;i++) g.push(0);
    if(comport==='limpo'){                       // ruído abaixo da tolerância: bate, mas não é exato
      for(i=0;i<N_CONT;i++) g[i]=Math.round(u*(r()*0.6-0.3));
    }
    else if(comport==='ruido'){ g[2]=-um(1.6); g[6]=um(1.7); }
    else if(comport==='fecha'){ g[1]=-um(4); g[4]=-um(4.5); g[8]=-um(3.5); }
    else if(comport==='divida'){ v=-um(2.5); for(i=3;i<N_CONT;i++) g[i]=v; }
    else if(comport==='sangra'){ acc=0; for(i=2;i<N_CONT;i++){ acc-=um(1.2); g[i]=acc; } }
    else if(comport==='caotico'){ for(i=0;i<N_CONT;i++) g[i]=um(8+r()*8)*(i%2?-1:1); }
    else if(comport==='mal'){ g[3]=um(5);
      for(i=0;i<N_CONT;i++) if(i!==0&&i!==3&&i!==6&&i!==9) g[i]=null; }
    else if(comport==='nunca'){ for(i=0;i<N_CONT;i++) g[i]=null; }   // está no cadastro e nunca foi contado
    return g;
  }

  // ── classificação (a lógica do blueprint, de verdade) ─────────────────────────────────────
  function tolDe(classe, saldo){ var p=S.tol[classe]!=null?S.tol[classe]:1; return Math.max(1, saldo*p/100); }

  function classificar(serie, tol){
    var feitas=serie.filter(function(v){ return v!==null; });
    var nulos=serie.length-feitas.length;
    if(!feitas.length) return 'semdado';
    if(nulos/serie.length>=0.34) return 'mal';
    var fora=feitas.filter(function(v){ return Math.abs(v)>tol; });
    if(!fora.length) return 'limpo';
    // dívida parada: os valores fora da tolerância são todos o MESMO número
    var iguais=fora.every(function(v){ return v===fora[0]; });
    if(iguais && fora.length>=3) return 'divida';
    // variações entre contagens consecutivas — o fato novo, nunca a soma dos gaps
    var d=[],i; for(i=1;i<feitas.length;i++) d.push(feitas[i]-feitas[i-1]);
    var somaAbs=0, somaSin=0, maxAbs=0;
    d.forEach(function(v){ somaAbs+=Math.abs(v); somaSin+=v; if(Math.abs(v)>maxAbs) maxAbs=Math.abs(v); });
    var idx = somaAbs ? Math.abs(somaSin)/somaAbs : 0;
    var medAbs = fora.reduce(function(a,v){ return a+Math.abs(v); },0)/fora.length;
    // ⚠️ O índice sozinho NÃO distingue três coisas que caem todas na faixa baixa — 'ruido',
    // 'fecha' e 'caotico' abrem e fecham igual. Quem separa é a AMPLITUDE. Foi o furo que só
    // apareceu ao desenhar o mapa de calor; está anotado no blueprint, seção 4.
    if(idx<0.35){
      if(maxAbs>6*tol && medAbs>6*tol) return 'caotico';   // oscilação enorme: unidade / conversão
      if(medAbs<2.5*tol) return 'ruido';                   // pequeno e resolve: custo normal
      return 'fecha';                                      // abre e volta: lançamento atrasado
    }
    if(idx>0.65) return 'sangra';
    return 'ruido';
  }

  // ── diagnóstico detalhado × o que a COLUNA mostra ─────────────────────────────────────────
  // classificar() continua devolvendo os sete comportamentos: é deles que sai a ação certa, e são
  // eles que o mapa de calor e o modo investigação vão usar. Mas a coluna mostra só TRÊS níveis
  // (verde / amarelo / vermelho), decisão do Diego em 24/11: sete estados numa coluna que se lê de
  // relance viram ruído. O detalhe fica na dica ao passar o mouse, sem ocupar espaço na tela.
  var DETALHE={
    limpo:'Todas as contagens dentro da tolerância. Candidato a contar menos.',
    ruido:'Erra pouco, valores pequenos, e resolve sozinho. É o custo normal de contar.',
    fecha:'Abre e volta a zero sem ninguém ajustar: lançamento atrasado. Não é perda de material.',
    divida:'O mesmo valor repetido: um erro só, nunca corrigido. Achar o dia de origem e acertar a ficha.',
    caotico:'Amplitude grande e sinais trocados: olhar unidade e fator de conversão no cadastro.',
    mal:'Muitas noites sem contagem. É aderência ao calendário, não acuracidade.',
    sangra:'A diferença cresce a cada contagem: perda ou consumo não apontado, acontecendo agora.',
    semdado:'Nunca foi contado. O item está no cadastro e não tem uma única contagem registrada.'
  };
  // 🟢 nada a fazer · 🟡 tem diferença, mas o físico provavelmente está certo (é registro, cadastro
  // ou calendário) · 🔴 material sumindo de verdade · ⚪ NUNCA foi contado.
  // ⚠️ O cinza não é uma gravidade entre o verde e o amarelo: é AUSÊNCIA DE DADO. Item que foi
  // contado algumas vezes e faltou em outras (perfil `mal`) tem dado e cai no amarelo — só entra
  // aqui quem não tem nenhuma contagem. A definição é do Diego (25/11) e é melhor que a que eu
  // tinha proposto: "nunca contado" é um fato objetivo, "mal coberto" é um julgamento.
  var NIVEL={ limpo:'ok', ruido:'ok', fecha:'ajt', divida:'ajt', caotico:'ajt', mal:'ajt',
              sangra:'perda', semdado:'sem' };
  var NIVEIS={
    ok:{l:'Em ordem', c:'n1'},
    ajt:{l:'Atenção', c:'n2'},
    perda:{l:'Crítico', c:'n3'},
    sem:{l:'Sem contagem', c:'n4'}
  };

  // ── monta os dados derivados ──────────────────────────────────────────────────────────────
  function montar(){
    var hoje=new Date(), linhas=[], totalGrupo={};
    ITENS.forEach(function(it){
      var cod=it[0], nome=it[1], un=it[2], cl=it[3], custo=it[4], saldo=it[5], comp=it[6];
      var tolRef=Math.max(1, saldo*TOL_PADRAO[cl]/100);
      var r=rng(hash(cod)), serie=serieDe(comp,tolRef,r), tol=tolDe(cl,saldo);
      var intervalo = cl==='A'?7:(cl==='B'?14:28);
      // cada item cai num ponto diferente do ciclo: sem isto a "última contagem" seria hoje para
      // os 44 itens, o que não acontece num calendário de 20 slots.
      var off = hash(cod+'slot') % intervalo;
      var feitas=0, certas=0, div=0, naoFeitas=0, i, v, datas=[];
      for(i=0;i<N_CONT;i++){
        var d=new Date(hoje.getTime()); d.setDate(d.getDate()-(N_CONT-1-i)*intervalo-off); datas.push(d);
        v=serie[i];
        if(v===null){ naoFeitas++; continue; }
        feitas++; if(Math.abs(v)>tol) div++; else certas++;
      }
      var naoNulos=serie.filter(function(x){ return x!==null; });
      var gapAtual = naoNulos.length ? naoNulos[naoNulos.length-1] : null;
      var ultIdx=-1; for(i=0;i<N_CONT;i++) if(serie[i]!==null) ultIdx=i;   // a última NOITE CONTADA
      var variacao = naoNulos.length>1 ? gapAtual-naoNulos[naoNulos.length-2] : 0;
      var valor = saldo*custo;
      var grp = cod.split('-')[0];
      totalGrupo[grp]=(totalGrupo[grp]||0)+valor;
      linhas.push({ cod:cod, nome:nome, un:un, classe:cl, custo:custo, saldo:saldo, grp:grp,
        serie:serie, datas:datas, tol:tol, feitas:feitas, certas:certas, div:div, naoFeitas:naoFeitas,
        pdiv: feitas? div/feitas*100 : 0, gap:gapAtual, variacao:variacao, valor:valor,
        gapRS: gapAtual==null?0:Math.abs(gapAtual)*custo,
        perfil: classificar(serie,tol), nivel: NIVEL[classificar(serie,tol)]||'ajt',
        quem: CONTADORES[hash(cod)%CONTADORES.length],
        ultima: ultIdx>=0 ? datas[ultIdx] : null });
    });
    linhas.forEach(function(l){ l.imp = totalGrupo[l.grp] ? l.valor/totalGrupo[l.grp]*100 : 0; });
    return linhas;
  }

  // ── filtros ───────────────────────────────────────────────────────────────────────────────
  function passa(l){
    if(S.busca){ var q=norm(S.busca); if(norm(l.nome).indexOf(q)<0 && norm(l.cod).indexOf(q)<0) return false; }
    var gk=Object.keys(S.f.grupos).filter(function(k){ return S.f.grupos[k]; });
    if(gk.length && gk.indexOf(l.grp)<0) return false;
    var ck=Object.keys(S.f.classes).filter(function(k){ return S.f.classes[k]; });
    if(ck.length && ck.indexOf(l.classe)<0) return false;
    if(S.f.perfil && l.nivel!==S.f.perfil) return false;
    if(S.ind==='divergindo' && !(l.gap!=null && Math.abs(l.gap)>l.tol)) return false;
    if(NIVEIS[S.ind] && l.nivel!==S.ind) return false;
    return true;
  }
  function temFiltro(){
    return !!(S.f.perfil || Object.keys(S.f.grupos).some(function(k){return S.f.grupos[k];})
      || Object.keys(S.f.classes).some(function(k){return S.f.classes[k];})
      || S.tol.A!==TOL_PADRAO.A || S.tol.B!==TOL_PADRAO.B || S.tol.C!==TOL_PADRAO.C);
  }

  // ── HTML ──────────────────────────────────────────────────────────────────────────────────
  function cardsHTML(todas){
    var vis=todas, ac=0, cert=0;
    vis.forEach(function(l){ ac+=l.feitas; cert+=l.certas; });
    var acur = ac? cert/ac*100 : 0;
    var c=function(id,lab,val,sub){ return '<button class="cpc-card'+(S.ind===id?' on':'')+'" data-ind="'+id+'">'+
      '<span class="cpc-card-v">'+val+'</span><span class="cpc-card-l">'+lab+'</span>'+
      (sub?'<span class="cpc-card-s">'+sub+'</span>':'')+'</button>'; };
    var n=function(f){ return vis.filter(f).length; };
    return '<div class="cpc-cards">'+
      c('todos','Itens',nf(vis.length)) +
      c('divergindo','Divergindo hoje',nf(n(function(l){ return l.gap!=null&&Math.abs(l.gap)>l.tol; }))) +
      c('perda','Crítico',nf(n(function(l){ return l.nivel==='perda'; }))) +
      c('ajt','Atenção',nf(n(function(l){ return l.nivel==='ajt'; }))) +
      c('ok','Em ordem',nf(n(function(l){ return l.nivel==='ok'; }))) +
      c('sem','Sem contagem',nf(n(function(l){ return l.nivel==='sem'; }))) +
      '<div class="cpc-card cpc-kpi"><span class="cpc-card-v">'+nf(acur,1)+'%</span><span class="cpc-card-l">Acuracidade</span><span class="cpc-card-s">'+nf(cert)+' de '+nf(ac)+' contagens</span></div>'+
      '</div>';
  }

  function funilHTML(){
    var g=GRUPOS.map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fg="'+x[0]+'"'+(S.f.grupos[x[0]]?' checked':'')+'> '+esc(x[1])+'</label>'; }).join('');
    var c=['A','B','C'].map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fc="'+x+'"'+(S.f.classes[x]?' checked':'')+'> Classe '+x+'</label>'; }).join('');
    var p='<option value="">Todas as situações</option>'+Object.keys(NIVEIS)
      .map(function(k){ return '<option value="'+k+'"'+(S.f.perfil===k?' selected':'')+'>'+NIVEIS[k].l+'</option>'; }).join('');
    var t=['A','B','C'].map(function(x){ return '<label class="cpc-tol">Classe '+x+' <input type="number" step="0.1" min="0" data-tol="'+x+'" value="'+S.tol[x]+'"> %</label>'; }).join('');
    return '<div class="cpc-funil'+(S.fOpen?'':' hide')+'">'+
      '<div class="cpc-fs">Grupo</div>'+g+
      '<div class="cpc-fs">Classe</div>'+c+
      '<div class="cpc-fs">Perfil</div><select class="cpc-sel" data-fp>'+p+'</select>'+
      '<div class="cpc-fs">Tolerância (% do saldo, mínimo 1 un)</div>'+t+
      '<button class="cpc-limpar" data-limpar>Limpar filtros</button></div>';
  }

  function celGap(l){
    if(l.gap==null) return '<span class="cpc-mut">—</span>';
    var fora=Math.abs(l.gap)>l.tol;
    var cls=!fora?'':(l.gap<0?'cpc-neg':'cpc-pos');
    var txt=(l.gap>0?'+':'')+nf(l.gap)+' '+l.un;
    var va=l.variacao? ' <span class="cpc-var">('+(l.variacao>0?'+':'')+nf(l.variacao)+')</span>' : '';
    return '<span class="'+cls+'">'+txt+'</span>'+va;
  }

  function linhaHTML(l){
    var p=NIVEIS[l.nivel]||NIVEIS.ajt, det=DETALHE[l.perfil]||'';
    return '<tr>'+
      '<td class="cpc-it"><b>'+esc(l.nome)+'</b><span class="cpc-cod">'+esc(l.cod)+'</span></td>'+
      '<td class="cpc-p" title="'+esc(det)+'"><span class="cpc-dot cpc-'+p.c+'"></span>'+p.l+'</td>'+
      '<td class="cpc-cl">'+l.classe+'</td>'+
      '<td class="cpc-n">'+nf(l.feitas)+'</td>'+
      '<td class="cpc-n cpc-ok2">'+nf(l.certas)+'</td>'+
      '<td class="cpc-n'+(l.div?' cpc-neg':'')+'">'+nf(l.div)+'</td>'+
      '<td class="cpc-n'+(l.naoFeitas?' cpc-mut2':'')+'">'+nf(l.naoFeitas)+'</td>'+
      '<td class="cpc-n"><span class="cpc-bar"><i style="width:'+Math.min(100,l.pdiv)+'%"></i></span>'+nf(l.pdiv,0)+'%</td>'+
      '<td class="cpc-n">'+nf(l.imp,1)+'%</td>'+
      '<td class="cpc-n">'+celGap(l)+'</td>'+
      // sem contagem nenhuma não há "quem contou": mostrar um nome aqui seria inventar responsável
      '<td class="cpc-u">'+(l.ultima
        ? l.ultima.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+'<span class="cpc-cod">'+esc(l.quem)+'</span>'
        : '<span class="cpc-mut">—</span>')+'</td>'+
      '</tr>';
  }

  // ── mapa de calor: item × contagem ───────────────────────────────────────────────────────
  // ⚠️ O eixo horizontal NÃO é calendário. Cada item tem o próprio ciclo (semanal, quinzenal,
  // mensal), então a coluna é "a n-ésima contagem mais recente DAQUELE item", não um dia comum a
  // todos. A data real de cada célula está na dica do mouse.
  // ⚠️ O NÚMERO fica dentro da célula de propósito: oito células vermelhas iguais (dívida parada,
  // um erro só) e oito crescendo (sangria) têm a mesma cor e histórias opostas. Sem o número a
  // grade mente. É a lição da seção 4 do blueprint.
  function celMapa(l,i){
    var v=l.serie[i], d=l.datas[i];
    var dia=d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'';
    // ⭐ A DATA VAI DENTRO DA CÉLULA. Não dá para pôr data no cabeçalho: cada item tem o próprio
    // ciclo (semanal, quinzenal, mensal), então a terceira coluna da Farinha e a da Baunilha são
    // dias diferentes. A primeira versão rotulava as colunas de −9 a "atual" e o Diego, com razão,
    // achou incompreensível. Com a data na célula o cabeçalho não precisa dizer nada.
    if(v===null) return '<td class="cpc-c cpc-cnd" title="'+dia+' · não foi contado">'+
      '<span class="cpc-cd">'+dia+'</span><span class="cpc-cv">–</span></td>';
    var r=Math.abs(v)/l.tol, cls, txt;
    if(r<=1){ cls='cpc-c0'; txt='✓'; }
    else{
      var n = r<3?1:(r<8?2:3);
      cls = (v<0?'cpc-cf':'cpc-cs')+n;
      txt = (v>0?'+':'')+nf(v);
    }
    var ant = i>0 ? l.serie[i-1] : null;
    var dica = dia+' · gap '+(v>0?'+':'')+nf(v)+' '+l.un+
      (ant!=null ? ' · variação '+((v-ant)>0?'+':'')+nf(v-ant) : '')+
      ' · tolerância ±'+nf(l.tol);
    return '<td class="cpc-c '+cls+'" title="'+esc(dica)+'">'+
      '<span class="cpc-cd">'+dia+'</span><span class="cpc-cv">'+txt+'</span></td>';
  }

  function mapaHTML(linhas){
    var cab='<th class="cpc-mi">Item</th><th class="cpc-ms">Situação</th>'+
      '<th class="cpc-ch2" colspan="'+N_CONT+'">as '+N_CONT+' últimas contagens de cada item '+
      '· mais antiga à esquerda, mais recente à direita →</th>';
    var out='';
    GRUPOS.forEach(function(g){
      var da=linhas.filter(function(l){ return l.grp===g[0]; });
      if(!da.length) return;
      var fechado=!!S.fech[g[0]];
      out+='<tbody class="cpc-grp"><tr class="cpc-ghead" data-grp="'+g[0]+'"><td colspan="'+(N_CONT+2)+'">'+
        '<i class="ti ti-chevron-'+(fechado?'right':'down')+'"></i> '+esc(g[1])+
        '<span class="cpc-gc">'+da.length+' itens</span></td></tr></tbody>';
      if(fechado) return;
      out+='<tbody>'+ordena(da).map(function(l){
        var p=NIVEIS[l.nivel]||NIVEIS.ajt, cels='';
        for(var k=0;k<N_CONT;k++) cels+=celMapa(l,k);
        // ⚠️ <td> e não <th> de propósito: `html[data-bs-theme] #task-container table:not(.tk-table) th`
        // (hub-telas.css) tem especificidade alta e pinta fundo + CAIXA ALTA em todo th. Como <td> o
        // nome do item sai igual ao da vista de tabela, sem precisar de três !important.
        return '<tr><td class="cpc-mi" title="'+esc(l.cod+' · tolerância ±'+nf(l.tol)+' '+l.un)+'">'+
          esc(l.nome)+'</td>'+
          '<td class="cpc-ms" title="'+esc(DETALHE[l.perfil]||'')+'"><span class="cpc-dot cpc-'+p.c+'"></span>'+p.l+'</td>'+
          cels+'</tr>';
      }).join('')+'</tbody>';
    });
    if(!out) out='<tbody><tr><td colspan="'+(N_CONT+2)+'" class="cpc-vazio">Nenhum item com esses filtros.</td></tr></tbody>';
    return '<div class="cpc-leitura"><b>Como ler:</b> linha toda verde, item sob controle — '+
      'vermelho forte e depois verde, o lançamento entrou atrasado — '+
      '<b>o mesmo número repetido é um erro só, parado</b>, enquanto números crescendo são perda acontecendo — '+
      'hachurado é noite sem contagem. A coluna é a n-ésima contagem <i>daquele item</i>, não uma data comum.</div>'+
      '<div class="cpc-mw"><table class="cpc-m"><thead><tr>'+cab+'</tr></thead>'+out+'</table></div>'+
      '<div class="cpc-leg">'+
        '<span><i class="cpc-sw cpc-c0"></i> dentro da tolerância</span>'+
        '<span><i class="cpc-sw cpc-cf1"></i><i class="cpc-sw cpc-cf2"></i><i class="cpc-sw cpc-cf3"></i> falta</span>'+
        '<span><i class="cpc-sw cpc-cs1"></i><i class="cpc-sw cpc-cs2"></i><i class="cpc-sw cpc-cs3"></i> sobra</span>'+
        '<span><i class="cpc-sw cpc-cnd"></i> não contado</span>'+
        '<span>intensidade = quantas vezes a tolerância</span></div>';
  }

  function ordena(a){
    var k=S.sort.k, d=S.sort.d;
    return a.slice().sort(function(x,y){
      var vx=x[k], vy=y[k];
      if(k==='nome'){ return norm(vx)<norm(vy)? -d : (norm(vx)>norm(vy)? d : 0); }
      if(k==='gap'){ vx=Math.abs(x.gap||0); vy=Math.abs(y.gap||0); }
      return (vx-vy)*d;
    });
  }

  function tabelaHTML(linhas){
    var th=function(k,lab,cls){ var on=S.sort.k===k; return '<th class="'+(cls||'')+'" data-sort="'+k+'">'+lab+
      (on?'<i class="ti ti-chevron-'+(S.sort.d<0?'down':'up')+'"></i>':'')+'</th>'; };
    var out='';
    GRUPOS.forEach(function(g){
      var da=linhas.filter(function(l){ return l.grp===g[0]; });
      if(!da.length) return;
      var fechado=!!S.fech[g[0]];
      var divg=da.filter(function(l){ return l.div>0; }).length;
      out+='<tbody class="cpc-grp"><tr class="cpc-ghead" data-grp="'+g[0]+'"><td colspan="11">'+
        '<i class="ti ti-chevron-'+(fechado?'right':'down')+'"></i> '+esc(g[1])+
        '<span class="cpc-gc">'+da.length+' itens · '+divg+' com divergência</span></td></tr></tbody>';
      if(fechado) return;
      out+='<tbody>'+ordena(da).map(linhaHTML).join('')+'</tbody>';
    });
    if(!out) out='<tbody><tr><td colspan="11" class="cpc-vazio">Nenhum item com esses filtros.</td></tr></tbody>';
    // Situação logo depois do Item (pedido do Diego, 25/11): o veredito antes dos números, porque
    // é por ele que se decide se vale olhar o resto da linha.
    return '<div class="cpc-tw"><table class="cpc-t"><thead><tr>'+
      th('nome','Item','cpc-it')+'<th class="cpc-p">Situação</th><th class="cpc-cl">Cl.</th>'+
      th('feitas','Cont.','cpc-n')+th('certas','Certas','cpc-n')+th('div','Div.','cpc-n')+
      th('naoFeitas','N. feitas','cpc-n')+th('pdiv','% div.','cpc-n')+th('imp','Import.','cpc-n')+
      th('gap','Gap atual','cpc-n')+'<th class="cpc-u">Última</th>'+
      '</tr></thead>'+out+'</table></div>';
  }

  // ── render ────────────────────────────────────────────────────────────────────────────────
  function render(main){
    MAIN=main||document.getElementById('task-container'); if(!MAIN) return;
    restore();
    DADOS=montar();
    var vis=DADOS.filter(passa);
    var head=(typeof hubHead==='function')
      ? hubHead('Contagem','Contagem cíclica de toda noite — análise. Os dados viriam do ERP; a aba não escreve nada de volta.')
      : '<h2>Contagem</h2>';
    MAIN.innerHTML='<div class="cpc" style="padding:20px 4px 40px;">'+head+
      '<div class="cpc-demo"><i class="ti ti-flask"></i> Base de demonstração: '+ITENS.length+
      ' itens fictícios com '+N_CONT+' contagens cada. Ao ligar o export do ERP, só a origem dos dados muda.</div>'+
      cardsHTML(DADOS)+
      '<div class="cpc-bar2"><div class="cpc-busca"><i class="ti ti-search"></i>'+
        '<input type="text" placeholder="Buscar item ou código" value="'+esc(S.busca)+'" data-busca></div>'+
        '<div class="cpc-seg">'+
          '<button data-vista="tabela"'+(S.vista==='tabela'?' class="on"':'')+'>Tabela</button>'+
          '<button data-vista="mapa"'+(S.vista==='mapa'?' class="on"':'')+'>Mapa de calor</button></div>'+
        '<button class="cpc-fbtn'+(temFiltro()?' ativo':'')+'" data-funil title="Filtros"><i class="ti ti-filter"></i></button></div>'+
      funilHTML()+
      (S.vista==='mapa' ? mapaHTML(vis) : tabelaHTML(vis))+'</div>';
    ligar();
  }

  function ligar(){
    var q=function(s){ return MAIN.querySelectorAll(s); };
    q('.cpc-card[data-ind]').forEach(function(b){ b.onclick=function(){ S.ind=b.getAttribute('data-ind'); render(MAIN); }; });
    var bs=MAIN.querySelector('[data-busca]');
    if(bs) bs.oninput=function(){ S.busca=bs.value; var pos=bs.selectionStart; render(MAIN);
      var n=MAIN.querySelector('[data-busca]'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } };
    var fb=MAIN.querySelector('[data-funil]'); if(fb) fb.onclick=function(){ S.fOpen=!S.fOpen; render(MAIN); };
    q('[data-vista]').forEach(function(b){ b.onclick=function(){
      S.vista=b.getAttribute('data-vista'); persist(); render(MAIN); }; });
    q('[data-fg]').forEach(function(c){ c.onchange=function(){ S.f.grupos[c.getAttribute('data-fg')]=c.checked; render(MAIN); }; });
    q('[data-fc]').forEach(function(c){ c.onchange=function(){ S.f.classes[c.getAttribute('data-fc')]=c.checked; render(MAIN); }; });
    var fp=MAIN.querySelector('[data-fp]'); if(fp) fp.onchange=function(){ S.f.perfil=fp.value; render(MAIN); };
    q('[data-tol]').forEach(function(i){ i.onchange=function(){
      var v=parseFloat(i.value); if(isFinite(v)&&v>=0){ S.tol[i.getAttribute('data-tol')]=v; persist(); render(MAIN); } }; });
    var lp=MAIN.querySelector('[data-limpar]'); if(lp) lp.onclick=function(){
      S.f={grupos:{},classes:{},perfil:''}; S.ind='todos'; S.busca='';
      S.tol={A:TOL_PADRAO.A,B:TOL_PADRAO.B,C:TOL_PADRAO.C}; persist(); render(MAIN); };
    q('.cpc-ghead').forEach(function(tr){ tr.onclick=function(){
      var g=tr.getAttribute('data-grp'); S.fech[g]=!S.fech[g]; persist(); render(MAIN); }; });
    q('th[data-sort]').forEach(function(th){ th.onclick=function(){
      var k=th.getAttribute('data-sort');
      if(S.sort.k===k) S.sort.d=-S.sort.d; else { S.sort.k=k; S.sort.d = (k==='nome'?1:-1); }
      persist(); render(MAIN); }; });
  }

  window.CPC={
    render:render,
    _classificar:classificar,          // exposto para conferência manual no console
    _dados:function(){ return DADOS?DADOS.slice():montar(); }
  };
})();
