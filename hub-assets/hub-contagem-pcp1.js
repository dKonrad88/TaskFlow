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
  var S={ ind:'todos', busca:'', fOpen:false, vista:'tabela', mes:'', perAberto:false, ajuda:false,
          f:{grupos:{},classes:{},perfil:'',semanas:{},dias:{},semSlot:false},
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

  function persist(){ lsSet(LS_KEY, JSON.stringify({tol:S.tol, fech:S.fech, sort:S.sort, vista:S.vista, mes:S.mes, ajuda:S.ajuda})); }
  function restore(){ var o=lsGet(LS_KEY,null); if(o&&typeof o==='object'){
    if(o.tol) S.tol={A:+o.tol.A||TOL_PADRAO.A, B:+o.tol.B||TOL_PADRAO.B, C:+o.tol.C||TOL_PADRAO.C};
    if(o.fech) S.fech=o.fech; if(o.sort) S.sort=o.sort;
    if(o.vista==='mapa'||o.vista==='tabela') S.vista=o.vista;
    if(typeof o.mes==='string') S.mes=o.mes;
    if(typeof o.ajuda==='boolean') S.ajuda=o.ajuda; } }

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

  // ── o SLOT do ciclo: dia da semana + em quais das 4 semanas ──────────────────────────────
  // No ERP a frequência mora no cadastro do item, num campo que recebe `domingo1`…`quinta4`.
  // ⭐ Aqui o slot é DERIVADO das datas das contagens, não sorteado à parte: como os intervalos
  // são de 7, 14 ou 28 dias, todas as contagens de um item caem no mesmo dia da semana, e a
  // semana do ciclo sai da semana ISO. Assim o que a tela mostra nunca contradiz as datas que
  // ela mesma exibe — se fosse semeado em separado, um dia divergiria do outro e ninguém saberia
  // qual está certo.
  var DIAS=['dom','seg','ter','qua','qui','sex','sáb'];

  // ⚠️⚠️ A SEMANA DO CICLO NÃO SAI DO CALENDÁRIO. Ela é uma contagem que o PCP mantém, e por isso
  // precisa de uma ÂNCORA. A primeira versão usava a semana ISO módulo 4 e errava de duas formas:
  // dava semana 4 para a semana em que o Diego disse estarem na 3, e colide na virada de ano —
  // ano com 53 semanas faz duas semanas seguidas caírem no mesmo número.
  // Âncora informada pelo Diego em 25/11/2026: aquela semana é a SEMANA 3.
  // 📌 Ao ligar o ERP, esta âncora vem de lá (ou do primeiro slot importado), não daqui.
  var ANCORA_DOM = Date.UTC(2026,10,22);   // domingo 22/11/2026
  var ANCORA_SEM = 3;

  function semanaCiclo(d){
    // a semana da contagem começa no DOMINGO, porque o ciclo da casa é de domingo a quinta:
    // a noite de domingo abre a semana, não fecha a anterior.
    var t=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
    var dom=t-(new Date(t)).getUTCDay()*86400000;
    var dif=Math.round((dom-ANCORA_DOM)/(7*86400000));
    return ((((ANCORA_SEM-1+dif)%4)+4)%4)+1;
  }

  function rotuloSlot(l){
    if(!l.slotDia) return 'sem slot';
    return l.slotDia+' '+l.semanas.join('·');
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
  function ym(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2); }
  var MESES={};   // 'YYYY-MM' → quantas contagens caíram nele (preenchido por montar)
  var MESNOME=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro',
               'outubro','novembro','dezembro'];

  function montar(){
    var hoje=new Date(), linhas=[], totalGrupo={};
    MESES={};
    ITENS.forEach(function(it){
      var cod=it[0], nome=it[1], un=it[2], cl=it[3], custo=it[4], saldo=it[5], comp=it[6];
      var tolRef=Math.max(1, saldo*TOL_PADRAO[cl]/100);
      var r=rng(hash(cod)), serie=serieDe(comp,tolRef,r), tol=tolDe(cl,saldo);
      var intervalo = cl==='A'?7:(cl==='B'?14:28);
      // ⚠️ A contagem é de DOMINGO A QUINTA — sexta e sábado não existem no ciclo. Por isso a
      // série é ancorada numa dessas 5 noites, e não num deslocamento qualquer: como os intervalos
      // (7, 14, 28) são múltiplos de 7, todas as contagens do item caem sempre no mesmo dia, que é
      // justamente o que o cadastro do ERP guarda em `domingo1`…`quinta4`.
      var diaAlvo = hash(cod+'slot') % 5;                        // 0=dom … 4=qui
      var ancora = new Date(hoje.getTime());
      ancora.setDate(ancora.getDate() - ((ancora.getDay()-diaAlvo+7)%7));
      var i, datas=[];
      for(i=0;i<N_CONT;i++){
        var d=new Date(ancora.getTime()); d.setDate(d.getDate()-(N_CONT-1-i)*intervalo); datas.push(d);
        MESES[ym(datas[i])] = (MESES[ym(datas[i])]||0) + (serie[i]===null?0:1);
      }

      // ── recorte do período ───────────────────────────────────────────────────────────────
      // ⚠️ O mês muda os NÚMEROS (contagens, certas, divergentes, gap), **não a classificação**.
      // A situação continua saindo do histórico inteiro de propósito: sangria só se enxerga em
      // várias contagens seguidas, e julgar um item por 1 ou 2 noites de um mês daria respostas
      // que mudam de cor a cada troca de período — exatamente o que destrói a confiança no painel.
      var idx=[]; for(i=0;i<N_CONT;i++) if(!S.mes || ym(datas[i])===S.mes) idx.push(i);
      var serieP=idx.map(function(k){ return serie[k]; });
      var datasP=idx.map(function(k){ return datas[k]; });

      var feitas=0, certas=0, div=0, naoFeitas=0;
      serieP.forEach(function(x){
        if(x===null){ naoFeitas++; return; }
        feitas++; if(Math.abs(x)>tol) div++; else certas++;
      });
      var naoNulos=serieP.filter(function(x){ return x!==null; });
      var gapAtual = naoNulos.length ? naoNulos[naoNulos.length-1] : null;
      var ultIdx=-1; for(i=0;i<serieP.length;i++) if(serieP[i]!==null) ultIdx=i;  // última noite contada
      var variacao = naoNulos.length>1 ? gapAtual-naoNulos[naoNulos.length-2] : 0;
      var valor = saldo*custo;
      var grp = cod.split('-')[0];
      totalGrupo[grp]=(totalGrupo[grp]||0)+valor;
      // ⚠️ `IN-407` é o item SEM SLOT: nunca foi cadastrado em noite nenhuma, e é por isso que
      // nunca foi contado. O `MK-506` tem slot e mesmo assim nunca foi contado — são as duas
      // causas diferentes de "Sem contagem", e a tela precisa mostrar as duas.
      var semSlot = (cod==='IN-407');
      var semanas=[], dSem=null;
      if(!semSlot){
        datas.forEach(function(dd){ var s=semanaCiclo(dd); if(semanas.indexOf(s)<0) semanas.push(s); });
        semanas.sort(function(a,b){ return a-b; });
        dSem=DIAS[datas[N_CONT-1].getDay()];
      }
      var pf = classificar(serie,tol);                 // ⬅ histórico INTEIRO, não o recorte
      linhas.push({ slotDia:dSem, semanas:semanas,
        cod:cod, nome:nome, un:un, classe:cl, custo:custo, saldo:saldo, grp:grp,
        serie:serieP, datas:datasP,                    // ⬅ o que a tela desenha é o recorte
        foraPeriodo: idx.length===0,                   // item sem noite programada no mês escolhido
        tol:tol, feitas:feitas, certas:certas, div:div, naoFeitas:naoFeitas,
        pdiv: feitas? div/feitas*100 : 0, gap:gapAtual, variacao:variacao, valor:valor,
        gapRS: gapAtual==null?0:Math.abs(gapAtual)*custo,
        perfil: pf, nivel: NIVEL[pf]||'ajt',
        quem: CONTADORES[hash(cod)%CONTADORES.length],
        ultima: ultIdx>=0 ? datasP[ultIdx] : null });
    });
    linhas.forEach(function(l){ l.imp = totalGrupo[l.grp] ? l.valor/totalGrupo[l.grp]*100 : 0; });
    return linhas;
  }

  // ── filtros ───────────────────────────────────────────────────────────────────────────────
  function passa(l){
    // item cujo ciclo não caiu no mês escolhido não é "sem contagem": ele não era para ser contado
    if(l.foraPeriodo) return false;
    if(S.busca){ var q=norm(S.busca); if(norm(l.nome).indexOf(q)<0 && norm(l.cod).indexOf(q)<0) return false; }
    var gk=Object.keys(S.f.grupos).filter(function(k){ return S.f.grupos[k]; });
    if(gk.length && gk.indexOf(l.grp)<0) return false;
    var ck=Object.keys(S.f.classes).filter(function(k){ return S.f.classes[k]; });
    if(ck.length && ck.indexOf(l.classe)<0) return false;
    if(S.f.perfil && l.nivel!==S.f.perfil) return false;
    if(S.f.semSlot && l.slotDia) return false;
    var sk=Object.keys(S.f.semanas).filter(function(k){ return S.f.semanas[k]; });
    if(sk.length && !sk.some(function(k){ return l.semanas.indexOf(+k)>=0; })) return false;
    var dk=Object.keys(S.f.dias).filter(function(k){ return S.f.dias[k]; });
    if(dk.length && dk.indexOf(l.slotDia)<0) return false;
    if(S.ind==='divergindo' && !(l.gap!=null && Math.abs(l.gap)>l.tol)) return false;
    if(NIVEIS[S.ind] && l.nivel!==S.ind) return false;
    return true;
  }
  function temFiltro(){
    return !!(S.f.perfil || S.f.semSlot
      || Object.keys(S.f.grupos).some(function(k){return S.f.grupos[k];})
      || Object.keys(S.f.semanas).some(function(k){return S.f.semanas[k];})
      || Object.keys(S.f.dias).some(function(k){return S.f.dias[k];})
      || Object.keys(S.f.classes).some(function(k){return S.f.classes[k];})
      || S.tol.A!==TOL_PADRAO.A || S.tol.B!==TOL_PADRAO.B || S.tol.C!==TOL_PADRAO.C);
  }

  // ── onde estamos no ciclo ────────────────────────────────────────────────────────────────
  // A tela é de análise, mas quem abre precisa se situar: em que semana do ciclo estamos e qual é
  // a noite de hoje. Sem isso o Diego tinha de saber de cabeça que "estamos na semana 3" — foi
  // literalmente o que ele precisou me dizer para eu corrigir a âncora.
  // ⚠️ Sexta e sábado não têm contagem: nesses dias a faixa aponta a PRÓXIMA noite, em vez de
  // mostrar uma lista vazia e parecer defeito.
  // ⭐ O ciclo não ocupa mais faixa própria: a semana vai no TÍTULO e o resto no subtítulo, no
  // cabeçalho que a tela já tinha. Mesma informação, um bloco a menos.
  function cicloHoje(todas){
    var hoje=new Date(), dow=hoje.getDay(), temHoje=(dow>=0&&dow<=4);
    var alvo=new Date(hoje.getTime());
    if(!temHoje) alvo.setDate(alvo.getDate()+(7-dow));        // próximo domingo
    var dia=DIAS[alvo.getDay()], sem=semanaCiclo(alvo);
    var n=todas.filter(function(l){ return l.slotDia===dia && l.semanas.indexOf(sem)>=0; }).length;
    return { sem:sem, dia:dia, n:n, temHoje:temHoje,
      quando:alvo.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) };
  }

  // ── filtros ativos, visíveis onde o resultado está ───────────────────────────────────────
  // 🐞 O Diego filtrou e não conseguiu voltar: o "Limpar filtros" vivia DENTRO do funil fechado,
  // e o único sinal de que havia filtro era o ícone âmbar. Pior, o mês ficava gravado e sobrevivia
  // à recarga. Agora o que está filtrando aparece em chips ao lado do resultado, cada um com o seu
  // ×, mais um "limpar tudo". A linha só existe quando há filtro, então não pesa no estado normal.
  function chipsHTML(){
    var c=[], k;
    if(S.ind!=='todos') c.push(['ind', (NIVEIS[S.ind]||{}).l || 'Divergindo hoje']);
    if(S.mes) c.push(['mes', (mesesOpts().filter(function(o){return o[0]===S.mes;})[0]||[,S.mes])[1]]);
    if(S.busca) c.push(['busca', '“'+S.busca+'”']);
    for(k in S.f.semanas) if(S.f.semanas[k]) c.push(['sem:'+k, 'Semana '+k]);
    for(k in S.f.dias) if(S.f.dias[k]) c.push(['dia:'+k, k]);
    for(k in S.f.grupos) if(S.f.grupos[k]) c.push(['grp:'+k, (GRUPOS.filter(function(g){return g[0]===k;})[0]||[,k])[1]]);
    for(k in S.f.classes) if(S.f.classes[k]) c.push(['cls:'+k, 'Classe '+k]);
    if(S.f.perfil) c.push(['perfil', (NIVEIS[S.f.perfil]||{}).l||S.f.perfil]);
    if(S.f.semSlot) c.push(['semslot', 'sem slot']);
    var tolMex = S.tol.A!==TOL_PADRAO.A||S.tol.B!==TOL_PADRAO.B||S.tol.C!==TOL_PADRAO.C;
    if(tolMex) c.push(['tol', 'tolerância alterada']);
    if(!c.length) return '';
    return '<div class="cpc-chips"><span class="cpc-chl">filtrando por</span>'+
      c.map(function(x){ return '<button class="cpc-chip" data-off="'+esc(x[0])+'" title="remover">'+
        esc(x[1])+'<i class="ti ti-x"></i></button>'; }).join('')+
      '<button class="cpc-chlimpa" data-limpatudo>limpar tudo</button></div>';
  }

  function tirarFiltro(id){
    var p=id.split(':');
    if(id==='ind') S.ind='todos';
    else if(id==='mes'){ S.mes=''; persist(); }
    else if(id==='busca') S.busca='';
    else if(id==='perfil') S.f.perfil='';
    else if(id==='semslot') S.f.semSlot=false;
    else if(id==='tol'){ S.tol={A:TOL_PADRAO.A,B:TOL_PADRAO.B,C:TOL_PADRAO.C}; persist(); }
    else if(p[0]==='sem') delete S.f.semanas[p[1]];
    else if(p[0]==='dia') delete S.f.dias[p[1]];
    else if(p[0]==='grp') delete S.f.grupos[p[1]];
    else if(p[0]==='cls') delete S.f.classes[p[1]];
  }

  function limparTudo(){
    S.f={grupos:{},classes:{},perfil:'',semanas:{},dias:{},semSlot:false};
    S.ind='todos'; S.busca=''; S.mes='';            // ⚠️ o mês TAMBÉM: era o que ficava preso
    S.tol={A:TOL_PADRAO.A,B:TOL_PADRAO.B,C:TOL_PADRAO.C};
    persist();
  }

  // ── HTML ──────────────────────────────────────────────────────────────────────────────────
  function cardsHTML(todas){
    var vis=todas, ac=0, cert=0;
    vis.forEach(function(l){ ac+=l.feitas; cert+=l.certas; });
    var acur = ac? cert/ac*100 : 0;
    // ⚠️ Os cartões ganharam o ponto colorido da Situação — não é enfeite: liga o cartão à coluna
    // e faz o olho achar "Crítico" sem ler. E o Crítico, quando tem item, fica em destaque: a tela
    // precisa dizer para onde olhar primeiro, senão vira uma parede de números iguais.
    // ⚠️ SEM CAIXAS. Sete cartões com borda eram uma parede: o Diego disse duas vezes que a tela
    // estava cheia. Viraram uma linha de números com o ponto da Situação — o mesmo da coluna.
    // Clicar no que está aceso volta para todos (padrão da casa desde 26/09), então o cartão
    // "Todos os itens" deixou de ser necessário.
    var c=function(id,lab,val,niv){
      return '<button class="cpc-st'+(S.ind===id?' on':'')+(id==='perda'&&val!=='0'?' alerta':'')+
        '" data-ind="'+id+'" title="'+(S.ind===id?'clique para ver todos':'filtrar')+'">'+
        (niv?'<i class="cpc-dot cpc-'+niv+'"></i>':'')+'<b>'+val+'</b> '+lab+'</button>'; };
    var n=function(f){ return vis.filter(f).length; };
    return '<div class="cpc-stats">'+
      c('perda','Crítico',nf(n(function(l){ return l.nivel==='perda'; })),'n3') +
      c('ajt','Atenção',nf(n(function(l){ return l.nivel==='ajt'; })),'n2') +
      c('ok','Em ordem',nf(n(function(l){ return l.nivel==='ok'; })),'n1') +
      c('sem','Sem contagem',nf(n(function(l){ return l.nivel==='sem'; })),'n4') +
      c('divergindo','Divergindo hoje',nf(n(function(l){ return l.gap!=null&&Math.abs(l.gap)>l.tol; }))) +
      '<span class="cpc-st-kpi"><b>'+nf(acur,1)+'%</b> de acuracidade <i>('+nf(cert)+' de '+nf(ac)+')</i></span>'+
      '</div>';
  }

  // ── seletor de período ───────────────────────────────────────────────────────────────────
  // ⚠️ NÃO dá para chamar o `_cpPerBtn` daqui, e eu tentei: o CSS dele (`.cp-pop`, `.cp-perit`)
  // mora no `_cpCSS()`, que é injetado DENTRO do HTML de cada tela de Compras e só existe
  // enquanto uma delas está aberta. Fora dali o popover sai sem estilo nenhum — virou uma fileira
  // de botões atravessada na tela. E puxar o `_cpCSS` para cá seria pior: ele também remove o
  // `max-width` do `.main`. Então o DESENHO é o mesmo que o Diego padronizou em 26/09 (botão de
  // 34px com o período escrito + popover com a contagem por opção), só que com estilo próprio.
  function mesesOpts(){
    var ks=Object.keys(MESES).filter(function(k){ return MESES[k]>0; }).sort().reverse();
    return [['','Todo o histórico', null]].concat(ks.map(function(k){
      var p=k.split('-');
      return [k, MESNOME[+p[1]-1]+' de '+p[0], MESES[k]];
    }));
  }
  function perBtnHTML(){
    var opts=mesesOpts();
    var at=opts.filter(function(o){ return o[0]===S.mes; })[0]||opts[0];
    var itens=opts.map(function(o){
      return '<button class="cpc-perit'+(o[0]===S.mes?' on':'')+'" data-per="'+esc(o[0])+'">'+
        esc(o[1])+(o[2]!=null?'<span class="n">'+nf(o[2])+'</span>':'')+'</button>';
    }).join('');
    return '<span class="cpc-per">'+
      '<button class="cpc-perbtn'+(S.perAberto?' on':'')+'" data-pertoggle title="Período das contagens">'+
        '<i class="ti ti-calendar-stats"></i>'+esc(at[1])+'<i class="ti ti-chevron-down"></i></button>'+
      (S.perAberto?'<div class="cpc-perpop">'+itens+'</div>':'')+'</span>';
  }

  function funilHTML(){
    var g=GRUPOS.map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fg="'+x[0]+'"'+(S.f.grupos[x[0]]?' checked':'')+'> '+esc(x[1])+'</label>'; }).join('');
    var c=['A','B','C'].map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fc="'+x+'"'+(S.f.classes[x]?' checked':'')+'> Classe '+x+'</label>'; }).join('');
    var p='<option value="">Todas as situações</option>'+Object.keys(NIVEIS)
      .map(function(k){ return '<option value="'+k+'"'+(S.f.perfil===k?' selected':'')+'>'+NIVEIS[k].l+'</option>'; }).join('');
    var t=['A','B','C'].map(function(x){ return '<label class="cpc-tol">Classe '+x+' <input type="number" step="0.1" min="0" data-tol="'+x+'" value="'+S.tol[x]+'"> %</label>'; }).join('');
    // Semana e dia são o SLOT do cadastro (`quarta2` no ERP), não um período: filtram quais itens
    // caem naquela noite do ciclo. Marcar "qua" + "2" devolve exatamente a lista da quarta2.
    var sem=[1,2,3,4].map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fsem="'+x+'"'+(S.f.semanas[x]?' checked':'')+'> Semana '+x+'</label>'; }).join('');
    var dia=['dom','seg','ter','qua','qui'].map(function(x){ return '<label class="cpc-chk"><input type="checkbox" data-fdia="'+x+'"'+(S.f.dias[x]?' checked':'')+'> '+x+'</label>'; }).join('');
    var ss='<label class="cpc-chk"><input type="checkbox" data-fss'+(S.f.semSlot?' checked':'')+'> só itens <b>sem slot</b></label>';
    return '<div class="cpc-funil'+(S.fOpen?'':' hide')+'">'+
      '<div class="cpc-fs">Semana do ciclo</div>'+sem+
      '<div class="cpc-fs">Noite da contagem</div>'+dia+' '+ss+
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
      '<td class="cpc-it"><b>'+esc(l.nome)+'</b><span class="cpc-cod">'+esc(l.cod)+' · '+
        (l.slotDia?esc(rotuloSlot(l)):'<i class="cpc-semslot">sem slot</i>')+'</span></td>'+
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
    var nCol=linhas.reduce(function(m,l){ return Math.max(m,l.serie.length); },0)||1;
    var cab='<th class="cpc-mi">Item</th><th class="cpc-ms">Situação</th>'+
      '<th class="cpc-ch2" colspan="'+nCol+'">'+
      (S.mes ? 'as contagens do período' : 'as '+N_CONT+' últimas contagens de cada item')+
      ' · mais antiga à esquerda, mais recente à direita →</th>';
    var out='';
    GRUPOS.forEach(function(g){
      var da=linhas.filter(function(l){ return l.grp===g[0]; });
      if(!da.length) return;
      var fechado=!!S.fech[g[0]];
      out+='<tbody class="cpc-grp"><tr class="cpc-ghead" data-grp="'+g[0]+'"><td colspan="'+(nCol+2)+'">'+
        '<i class="ti ti-chevron-'+(fechado?'right':'down')+'"></i> '+esc(g[1])+
        '<span class="cpc-gc">'+da.length+' itens</span></td></tr></tbody>';
      if(fechado) return;
      out+='<tbody>'+ordena(da).map(function(l){
        var p=NIVEIS[l.nivel]||NIVEIS.ajt, cels='';
        for(var k=0;k<l.serie.length;k++) cels+=celMapa(l,k);
        // ⚠️ <td> e não <th> de propósito: `html[data-bs-theme] #task-container table:not(.tk-table) th`
        // (hub-telas.css) tem especificidade alta e pinta fundo + CAIXA ALTA em todo th. Como <td> o
        // nome do item sai igual ao da vista de tabela, sem precisar de três !important.
        return '<tr><td class="cpc-mi" title="'+esc(l.cod+' · tolerância ±'+nf(l.tol)+' '+l.un)+'">'+
          esc(l.nome)+'</td>'+
          '<td class="cpc-ms" title="'+esc(DETALHE[l.perfil]||'')+'"><span class="cpc-dot cpc-'+p.c+'"></span>'+p.l+'</td>'+
          cels+'</tr>';
      }).join('')+'</tbody>';
    });
    if(!out) out='<tbody><tr><td colspan="'+(nCol+2)+'" class="cpc-vazio">Nenhum item com esses filtros.</td></tr></tbody>';
    // ⚠️ A ajuda fica FECHADA por padrão, atrás do "?" da barra. Eram três linhas de texto coladas
    // no topo, e foi o que fez o Diego dizer "não sei pra onde olhar": explicação permanente é
    // tutorial, não interface.
    return (S.ajuda ? '<div class="cpc-leitura"><b>Como ler:</b> linha toda verde, item sob controle — '+
      'vermelho forte e depois verde, o lançamento entrou atrasado — '+
      '<b>o mesmo número repetido é um erro só, parado</b>, enquanto números crescendo são perda acontecendo — '+
      'hachurado é noite sem contagem. A coluna é a n-ésima contagem <i>daquele item</i>, não uma data comum.</div>' : '')+
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
    // ⭐ A BARRA VAI PARA DENTRO DO CABEÇALHO. O `hubHead` já tem um slot de ação à direita e não
    // escapa HTML — usá-lo elimina a linha de controles inteira. Sobram dois blocos antes do dado:
    // o cabeçalho e a linha de números.
    var cic=cicloHoje(DADOS);
    var titulo='Contagem <span class="cpc-tsem">Semana '+cic.sem+'</span>';
    var sub=(cic.temHoje?'hoje':'próxima contagem')+' · '+cic.dia+' '+cic.quando+' · '+
      '<button class="cpc-link" data-hoje>'+nf(cic.n)+' '+(cic.n===1?'item programado':'itens programados')+'</button>'+
      (S.mes?' · <b>'+esc(mesesOpts().filter(function(o){return o[0]===S.mes;}).map(function(o){return o[1];})[0]||S.mes)+'</b> nos números':'');
    var barra='<div class="cpc-bar2"><div class="cpc-busca"><i class="ti ti-search"></i>'+
        '<input type="text" placeholder="Buscar item ou código" value="'+esc(S.busca)+'" data-busca></div>'+
        perBtnHTML()+
        '<div class="cpc-seg">'+
          '<button data-vista="tabela"'+(S.vista==='tabela'?' class="on"':'')+'>Tabela</button>'+
          '<button data-vista="mapa"'+(S.vista==='mapa'?' class="on"':'')+'>Mapa</button></div>'+
        (S.vista==='mapa'?'<button class="cpc-fbtn'+(S.ajuda?' ativo':'')+'" data-ajuda title="Como ler o mapa"><i class="ti ti-help"></i></button>':'')+
        '<button class="cpc-fbtn'+(temFiltro()?' ativo':'')+'" data-funil title="Filtros"><i class="ti ti-filter"></i></button></div>';
    var head=(typeof hubHead==='function') ? hubHead(titulo,sub,barra) : '<h2>Contagem</h2>'+barra;
    MAIN.innerHTML='<div class="cpc" style="padding:20px 4px 40px;">'+head+
      cardsHTML(DADOS.filter(function(l){ return !l.foraPeriodo; }))+
      chipsHTML()+
      funilHTML()+
      (S.vista==='mapa' ? mapaHTML(vis) : tabelaHTML(vis))+'</div>';
    ligar();
  }

  function ligar(){
    var q=function(s){ return MAIN.querySelectorAll(s); };
    // clicar no filtro já aceso volta para todos — o padrão que a casa adotou em 26/09
    q('.cpc-st[data-ind]').forEach(function(b){ b.onclick=function(){
      var id=b.getAttribute('data-ind'); S.ind=(S.ind===id)?'todos':id; render(MAIN); }; });
    var bs=MAIN.querySelector('[data-busca]');
    if(bs) bs.oninput=function(){ S.busca=bs.value; var pos=bs.selectionStart; render(MAIN);
      var n=MAIN.querySelector('[data-busca]'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } };
    var fb=MAIN.querySelector('[data-funil]'); if(fb) fb.onclick=function(){ S.fOpen=!S.fOpen; render(MAIN); };
    var pt=MAIN.querySelector('[data-pertoggle]'); if(pt) pt.onclick=function(){ S.perAberto=!S.perAberto; render(MAIN); };
    var aj=MAIN.querySelector('[data-ajuda]'); if(aj) aj.onclick=function(){ S.ajuda=!S.ajuda; persist(); render(MAIN); };
    // "ver a lista desta noite" = os mesmos filtros de slot que o funil oferece, já marcados
    var hb=MAIN.querySelector('[data-hoje]'); if(hb) hb.onclick=function(){
      var h=new Date(), dow=h.getDay(), alvo=new Date(h.getTime());
      if(dow>4) alvo.setDate(alvo.getDate()+(7-dow));
      S.f.dias={}; S.f.dias[DIAS[alvo.getDay()]]=true;
      S.f.semanas={}; S.f.semanas[semanaCiclo(alvo)]=true;
      // não abre o funil: o botão dele já acende em âmbar quando há filtro, e um painel de 200px
      // empurrando a tabela para baixo é justamente o que a tela acabou de perder
      S.ind='todos'; S.fOpen=false; render(MAIN);
    };
    q('[data-per]').forEach(function(b){ b.onclick=function(){
      S.mes=b.getAttribute('data-per'); S.perAberto=false; persist(); render(MAIN); }; });
    q('[data-vista]').forEach(function(b){ b.onclick=function(){
      S.vista=b.getAttribute('data-vista'); persist(); render(MAIN); }; });
    q('[data-fg]').forEach(function(c){ c.onchange=function(){ S.f.grupos[c.getAttribute('data-fg')]=c.checked; render(MAIN); }; });
    q('[data-fc]').forEach(function(c){ c.onchange=function(){ S.f.classes[c.getAttribute('data-fc')]=c.checked; render(MAIN); }; });
    q('[data-fsem]').forEach(function(c){ c.onchange=function(){ S.f.semanas[c.getAttribute('data-fsem')]=c.checked; render(MAIN); }; });
    q('[data-fdia]').forEach(function(c){ c.onchange=function(){ S.f.dias[c.getAttribute('data-fdia')]=c.checked; render(MAIN); }; });
    var ss=MAIN.querySelector('[data-fss]'); if(ss) ss.onchange=function(){ S.f.semSlot=ss.checked; render(MAIN); };
    var fp=MAIN.querySelector('[data-fp]'); if(fp) fp.onchange=function(){ S.f.perfil=fp.value; render(MAIN); };
    q('[data-tol]').forEach(function(i){ i.onchange=function(){
      var v=parseFloat(i.value); if(isFinite(v)&&v>=0){ S.tol[i.getAttribute('data-tol')]=v; persist(); render(MAIN); } }; });
    var lp=MAIN.querySelector('[data-limpar]'); if(lp) lp.onclick=function(){ limparTudo(); render(MAIN); };
    var lt=MAIN.querySelector('[data-limpatudo]'); if(lt) lt.onclick=function(){ limparTudo(); render(MAIN); };
    q('[data-off]').forEach(function(b){ b.onclick=function(){
      tirarFiltro(b.getAttribute('data-off')); render(MAIN); }; });
    q('.cpc-ghead').forEach(function(tr){ tr.onclick=function(){
      var g=tr.getAttribute('data-grp'); S.fech[g]=!S.fech[g]; persist(); render(MAIN); }; });
    q('th[data-sort]').forEach(function(th){ th.onclick=function(){
      var k=th.getAttribute('data-sort');
      if(S.sort.k===k) S.sort.d=-S.sort.d; else { S.sort.k=k; S.sort.d = (k==='nome'?1:-1); }
      persist(); render(MAIN); }; });
  }

  window.CPC={
    render:render,
    togglePer:function(){ S.perAberto=!S.perAberto; render(MAIN); },
    setPer:function(v){ S.mes=String(v||''); S.perAberto=false; persist(); render(MAIN); },
    _classificar:classificar,          // exposto para conferência manual no console
    _dados:function(){ return DADOS?DADOS.slice():montar(); }
  };
})();
