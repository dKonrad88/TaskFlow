/* ══ COMERCIAL › MARCAS PRÓPRIAS (hub-marcas7) ══
   Leva para o HUB a tela "Marcas Próprias" do SisPro (Mockup 1 escolhido pelo Diego, 11/11/2026,
   SEM Dashboard): duas abas, Clientes (padrão) e SKUs.
   · Lista de clientes em tabela neutra (Código, Cliente, Cidade/UF, Frequência, Situação) — sem
     avatar nem pills coloridas; cabeçalhos ordenáveis no mesmo estilo da tabela de SKUs
     (clique alterna crescente/decrescente). Filtros no padrão da Cobertura: busca + funil
     com popover, alinhados à direita na mesma linha das abas Clientes/SKUs (não numa fileira abaixo). A aba SKUs lista todos os itens, sem seletor “Por página” e sem barra de paginação.
   · Ficha do cliente (Mockup 2): cabeçalho compacto com ações em ícone, abas internas
     Dados / Embalagem / SKUs. Dados em duas colunas + Informações operacionais em texto simples,
     com destaque amarelo bem sutil (fundo e borda em color-mix de âmbar baixo; rótulo levemente
     quente; texto do corpo na cor normal). Embalagem em tabela Tipo / Responsável / Notas.
     SKUs vinculados em tabela ordenável (Código, Produto, Linha, Empac.) com ícones de
     palete/editar/excluir e "+ SKU".
   · Ícone de palete nas ações de cada SKU (tabela de SKUs e SKUs vinculados do cliente) abre a
     Configuração do palete em modal; Confirmar grava na hora via safeSetItem. O formulário de
     Novo/Editar SKU não tem mais o bloco do palete; editar o SKU preserva a configuração já gravada.
   · v7 (13/11/2026): 4ª aba na ficha, "Negociação", com sub-abas Ativa | Enviadas e botão "Criar cotação".
     Ativa = a negociação fechada com o cliente (uma por vez); Enviadas = todas as cotações mandadas
     (Enviada / Vencida / Recusada / Substituída / Fechada / Encerrada), com "Marcar como fechada" e menu ⋯.
     "Criar cotação" monta a cotação no layout Klain (pré-visualização + PDF via pdfMake) e salva em Enviadas;
     "Anexar PDF" guarda cotações feitas fora (até 1,5 MB). Chave taskflow_marcas_cotacoes (v2).
   · Dados no localStorage (chave taskflow_marcas_proprias), sempre via safeSetItem.
   · ⚠️ DADOS FICTÍCIOS: clientes, códigos e SKUs de exemplo foram inventados para o protótipo.
     As listas de opções (estados, frequências, bobina, notas, situação, empacotamento) são as do SisPro.
   · Aba Contagem (13/11/2026): vive em hub-contagem1.js (window.CTG); aqui só o botão da aba,
     o setTab('contagem') e a troca de ações/ferramentas/corpo quando S.tab==='contagem'.
   · Entrada: renderComercial() chama MP.render(main) quando comercialView==='marcas'.
   · Regra P0 da base: funções de render NÃO gravam; só as ações (salvar/excluir/seed) gravam. */
(function(){
  'use strict';
  var LS_KEY='taskflow_marcas_proprias';

  // ── Listas de opções (iguais ao SisPro) ──
  var OPT={
    estado:['RS','SC','PR','SP'],
    frequencia:['Semanal','Quinzenal','Mensal','Anual - Baixa frequência'],
    materiaPrima:['Klain','Cliente'],
    notaCobranca:['Nota de Venda','Nota de Industrialização'],
    situacao:['Ativo','Inativo'],
    etiquetaTipo:['Com Etiqueta','Sem Etiqueta'],
    etiquetaNotas:['Não se aplica','Compra','Remessa - Retorno','Sem Nota'],
    bobinaTipo:['Lisa - Transparente','Própria - Impressa'],
    bobinaNotas:['Remessa - Retorno','Compra','Sem Nota'],
    caixaTipo:['Klain','Própria do cliente','Fardo'],
    caixaNotas:['Não se aplica','Compra','Remessa - Retorno','Sem Nota'],
    responsavel:['Não se aplica','Klain','Cliente'],
    empacotamento:['Bobina','Etiqueta','Bobina + Etiqueta'],
    linha:['Amendoim','Palitinhos','Suspiro','Pão de Mel','Salgadão','Polvilho','Chocolovers','Biscoitos Salgados',
      'Biscoitos Doces','Clássicos','Econômica','Rosquinhas','Monodose','Aperitivos','Pipocas','Bolinhas','Batatas',
      'Intensus','Mega Milho','Proteico','Bitz','Flocos de Arroz','Massa Caseira','Pasta de Amendoim','Premium',
      'Coberturas','Recheio Forneável'],
    paleteModelo:['mod. 810 (5+3+5)','mod. 610 (4+2+4)','mod. A14 (6+6)','PBR 1,00 × 1,20'],
    orientacao:['Meio','Direita','Esquerda']
  };
  var FILTROS=[
    ['estado','Estado','estado'],['frequencia','Frequência','frequencia'],['bobina','Bobina','bobinaTipo'],
    ['nota','Notas','notaCobranca'],['notaBobina','Nota bobina','bobinaNotas'],
    ['notaEtiqueta','Nota etiqueta','etiquetaNotas'],['situacao','Situação','situacao']
  ];
  // ── Utilitários ──
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function uid(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function pad(n){ return (n<10?'0':'')+n; }
  function fmtDt(iso){ if(!iso) return '—'; var d=new Date(iso); if(isNaN(d)) return '—';
    return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes()); }
  function toastMsg(m){ try{ if(typeof toast==='function') toast(m); }catch(e){} }
  function lsSet(k,v){ return (typeof safeSetItem==='function') ? safeSetItem(k,v) : (localStorage.setItem(k,v),true); }

  // ── Seed fictício ──
  function seed(){
    var C=[
      ['8801','Aurora Snacks','Aurora Snacks Indústria e Comércio Ltda','Caxias do Sul','RS','Klain','Nota de Venda','Mensal',15,40,'Ativo',['Com Etiqueta','Cliente','Sem Nota'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],'Coletar na indústria — avisar com 12 dias. Palete padrão mod. A14.'],
      ['8802','Porto Doce Distribuidora','Porto Doce Distribuidora de Alimentos Ltda','Porto Alegre','RS','Klain','Nota de Venda','Quinzenal',10,60,'Ativo',['Sem Etiqueta','Não se aplica','Não se aplica'],['Própria - Impressa','Cliente','Remessa - Retorno'],['Klain','Klain','Compra'],'Entrega na doca 3, das 7h às 11h.'],
      ['8803','Vale Cereais','Vale Cereais Comércio Ltda','Bento Gonçalves','RS','Cliente','Nota de Industrialização','Mensal',20,30,'Ativo',['Com Etiqueta','Cliente','Remessa - Retorno'],['Própria - Impressa','Cliente','Remessa - Retorno'],['Própria do cliente','Cliente','Remessa - Retorno'],'Matéria-prima do cliente chega com 5 dias de antecedência.'],
      ['8804','Serra & Cia Alimentos','Serra e Cia Alimentos Ltda','Gramado','RS','Klain','Nota de Venda','Semanal',7,25,'Ativo',['Com Etiqueta','Klain','Compra'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],''],
      ['8805','Litoral Mix','Litoral Mix Comércio de Alimentos Ltda','Torres','RS','Klain','Nota de Venda','Mensal',15,20,'Ativo',['Com Etiqueta','Cliente','Sem Nota'],['Lisa - Transparente','Klain','Compra'],['Fardo','Klain','Não se aplica'],'Fardo com 6 pacotes.'],
      ['8806','Campo Verde Alimentos','Campo Verde Alimentos S.A.','Passo Fundo','RS','Klain','Nota de Industrialização','Quinzenal',12,50,'Ativo',['Sem Etiqueta','Não se aplica','Não se aplica'],['Própria - Impressa','Cliente','Remessa - Retorno'],['Klain','Klain','Compra'],''],
      ['8807','Costa Brava Foods','Costa Brava Foods Ltda','Florianópolis','SC','Klain','Nota de Venda','Mensal',18,40,'Ativo',['Com Etiqueta','Cliente','Compra'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],'Etiqueta enviada pelo cliente em rolo de 1.000 un.'],
      ['8808','Planalto Doces','Planalto Doces e Biscoitos Ltda','Lages','SC','Klain','Nota de Venda','Quinzenal',15,20,'Ativo',['Com Etiqueta','Klain','Compra'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],''],
      ['8809','Atlântico Snacks','Atlântico Snacks Distribuidora Ltda','Itajaí','SC','Klain','Nota de Venda','Semanal',7,80,'Ativo',['Sem Etiqueta','Não se aplica','Não se aplica'],['Própria - Impressa','Cliente','Remessa - Retorno'],['Própria do cliente','Cliente','Remessa - Retorno'],'Pedido fechado toda segunda-feira.'],
      ['8810','Rio Claro Alimentos','Rio Claro Alimentos Eireli','Curitiba','PR','Klain','Nota de Venda','Mensal',20,40,'Ativo',['Com Etiqueta','Cliente','Sem Nota'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],''],
      ['8811','Oficina do Palito','Oficina do Palito Comércio Ltda','São Paulo','SP','Klain','Nota de Venda','Semanal',10,100,'Ativo',['Sem Etiqueta','Não se aplica','Não se aplica'],['Própria - Impressa','Cliente','Remessa - Retorno'],['Klain','Klain','Compra'],'Transportadora do cliente retira na fábrica.'],
      ['8812','Recanto do Milho','Recanto do Milho Alimentos Ltda','Pelotas','RS','Klain','Nota de Venda','Anual - Baixa frequência',30,15,'Inativo',['Com Etiqueta','Klain','Compra'],['Lisa - Transparente','Klain','Compra'],['Klain','Klain','Compra'],'Sem pedido desde o último semestre.']
    ];
    var base=new Date(2026,9,20,9,0).getTime();
    var clientes=C.map(function(c,i){ return {id:'mpc'+c[0], codigo:c[0], nome:c[1], razao:c[2], cidade:c[3], estado:c[4], materiaPrima:c[5],
      notaCobranca:c[6], frequencia:c[7], prazoDias:c[8], pedidoMin:c[9], situacao:c[10],
      etiqueta:{tipo:c[11][0],resp:c[11][1],notas:c[11][2]}, bobina:{tipo:c[12][0],resp:c[12][1],notas:c[12][2]},
      caixa:{tipo:c[13][0],resp:c[13][1],notas:c[13][2]}, info:c[14], atualizado:new Date(base+i*86400000*1.3).toISOString()}; });
    // [cliente, código, produto, linha, empacotamento, gramagem, caixa]
    var S=[
      ['8801','44120','Salgadinho Palitinho sabor Original 50g','Palitinhos','Etiqueta','50g','mod. A14'],
      ['8801','44121','Salgadinho Palitinho sabor Queijo 50g','Palitinhos','Etiqueta','50g','mod. A14'],
      ['8801','44128','Biscoito de Amendoim com Chocolate ao Leite 250g','Amendoim','Bobina','250g','Caixa própria'],
      ['8801','44135','Pão de Mel com Chocolate ao Leite 250g','Pão de Mel','Etiqueta','250g','Caixa própria'],
      ['8802','44400','Pipoca Doce 100g','Pipocas','Bobina','100g','Fardo'],
      ['8802','44401','Pipoca Salgada 100g','Pipocas','Bobina','100g','Fardo'],
      ['8802','44402','Biscoito Rosquinha de Coco 500g','Rosquinhas','Bobina','500g','mod. 810'],
      ['8803','44630','Pão de Mel com Chocolate Branco 250g','Pão de Mel','Bobina + Etiqueta','250g','mod. C12'],
      ['8803','44631','Biscoito de Milho 240g','Clássicos','Bobina + Etiqueta','240g','mod. C12'],
      ['8803','44632','Biscoito Amanteigado 240g','Clássicos','Bobina + Etiqueta','240g','mod. C12'],
      ['8804','44812','Rosquinha de Coco 240g','Rosquinhas','Bobina + Etiqueta','240g','mod. E10'],
      ['8804','44813','Rosquinha de Leite 240g','Rosquinhas','Bobina + Etiqueta','240g','mod. E10'],
      ['8804','44814','Suspiro Tradicional 100g','Suspiro','Etiqueta','100g','mod. D08'],
      ['8805','44901','Salgadinho de Bolinhas sabor Churrasco 138g','Bolinhas','Etiqueta','138g','Fardo'],
      ['8805','44902','Salgadinho de Bolinhas sabor Queijo 138g','Bolinhas','Etiqueta','138g','Fardo'],
      ['8806','45010','Biscoito de Polvilho sabor Tradicional 60g','Polvilho','Bobina','60g','mod. 810'],
      ['8806','45011','Biscoito de Polvilho sabor Queijo 60g','Polvilho','Bobina','60g','mod. 810'],
      ['8807','44310','Biscoito de Amendoim com Chocolate Branco 250g','Amendoim','Etiqueta','250g','mod. B10'],
      ['8807','44311','Biscoito Broa de Amendoim 250g','Amendoim','Etiqueta','250g','mod. B10'],
      ['8808','44700','Suspiro Tradicional 100g','Suspiro','Etiqueta','100g','mod. D08'],
      ['8808','44701','Suspiro com Chocolate ao Leite 100g','Suspiro','Etiqueta','100g','mod. D08'],
      ['8809','44520','Salgadinho Palitinho sabor Orégano 138g','Palitinhos','Bobina','138g','Caixa própria'],
      ['8809','44521','Salgadinho Palitinho sabor Calabresa 138g','Palitinhos','Bobina','138g','Caixa própria'],
      ['8809','44522','Salgadão sabor Bacon 100g','Salgadão','Bobina','100g','Caixa própria'],
      ['8810','45120','Biscoito Mignon com Chocolate ao Leite 180g','Chocolovers','Etiqueta','180g','mod. 810'],
      ['8810','45121','Biscoito Mignon sabor Tradicional 180g','Biscoitos Salgados','Etiqueta','180g','mod. 810'],
      ['8811','44201','Salgadinho Palitinho sabor Churrasco 138g','Palitinhos','Bobina','138g','Caixa própria'],
      ['8811','44202','Salgadinho Palitinho sabor Bacon 138g','Palitinhos','Bobina','138g','Caixa própria'],
      ['8811','44203','Salgadinho Aperitivo sabor Churrasco 140g','Aperitivos','Bobina','140g','Caixa própria'],
      ['8812','45300','Flocos de Arroz Tradicional 100g','Flocos de Arroz','Etiqueta','100g','Fardo']
    ];
    var t0=new Date(2026,10,8,14,20).getTime();
    var skus=S.map(function(s,i){ var lastros=5+(i%3);
      return {id:'mps'+s[1], clienteId:'mpc'+s[0], codigo:s[1], nome:s[2], linha:s[3], empacotamento:s[4], gramagem:s[5], caixa:s[6],
        palete:(i%4===3)?null:{modelo:OPT.paleteModelo[i%OPT.paleteModelo.length], lastros:lastros,
          orientacao:Array.apply(null,Array(lastros)).map(function(_,k){return i%2?(k%2?'Direita':'Esquerda'):'Meio';}),
          chapas:Array.apply(null,Array(lastros)).map(function(_,k){return k<2?1:0;})},
        criado:new Date(t0-i*3600000*7.5).toISOString()}; });
    return {v:1, clientes:clientes, skus:skus};
  }

  // ── Persistência ──
  var DB=null;
  function load(){
    if(DB) return DB;
    var raw=null; try{ raw=localStorage.getItem(LS_KEY); }catch(e){}
    if(raw){ try{ DB=JSON.parse(raw); }catch(e){ DB=null; } }
    if(!DB||!Array.isArray(DB.clientes)||!Array.isArray(DB.skus)){ DB=seed(); save(); }
    return DB;
  }
  function save(){ lsSet(LS_KEY, JSON.stringify(DB)); }
  function cliById(id){ return load().clientes.find(function(c){return c.id===id;})||null; }
  function skusDe(id){ return load().skus.filter(function(s){return s.clienteId===id;}); }

  // ── Estado de tela (não persiste) ──
  var S={ tab:'clientes', pTab:'dados', sel:null, busca:'', f:{}, fOpen:false, skBusca:'', skLinha:'', skFOpen:false, skSort:{c:'criado',d:-1}, cliSort:{c:'nome',d:1}, pSkSort:{c:'codigo',d:1}, nTab:'ativa', modal:null };

  // ── Render principal ──
  function render(main){
    main=main||document.getElementById('task-container'); if(!main) return;
    load();
    var nC=DB.clientes.length, nS=DB.skus.length;
    var CT=(S.tab==='contagem' && window.CTG)?window.CTG:null; // aba Contagem (hub-contagem1)
    var acao=CT?CT.acaoHTML():'<span class="mp-head-acts" style="display:flex;gap:8px">'
      +'<button class="mp-btn gho" onclick="MP.novoSku()"><i class="ti ti-plus"></i><span>Novo SKU</span></button>'
      +'<button class="mp-btn pri" onclick="MP.novoCliente()"><i class="ti ti-plus"></i><span>Novo cliente</span></button></span>';
    var tabs='<div class="mp-tabs-row"><div class="mp-tabs">'
      +'<button class="mp-tab'+(S.tab==='clientes'?' on':'')+'" data-tab="clientes" onclick="MP.setTab(\'clientes\')"><i class="ti ti-building"></i>Clientes<span class="n">'+nC+'</span></button>'
      +'<button class="mp-tab'+(S.tab==='skus'?' on':'')+'" data-tab="skus" onclick="MP.setTab(\'skus\')"><i class="ti ti-barcode"></i>SKUs<span class="n">'+nS+'</span></button>'
      +(window.CTG?window.CTG.tabHTML(!!CT):'')+'</div>'
      +'<div class="mp-tabs-tools">'+(CT?CT.toolsHTML():toolsHTML())+'</div></div>';
    var corpo='<div class="mp-wrap" id="mp-root">'+tabs+'<div id="mp-body">'+(CT?CT.bodyHTML():S.tab==='skus'?skusHTML():clientesHTML())+'</div></div>';
    var titulo='<span style="display:inline-flex;align-items:center;gap:8px"><i class="ti ti-tags" style="color:var(--blue-mid);font-size:22px"></i>Marcas Próprias</span>';
    var sub='Clientes e SKUs de marca própria — Klain';
    main.innerHTML=(typeof _cpTela==='function') ? _cpTela(titulo, sub, corpo, null, acao)
      : '<div style="padding:20px 4px 60px"><h2>'+titulo+'</h2>'+corpo+'</div>';
    bindFiltroCloser();
  }
  function rerender(){ render(document.getElementById('task-container')); }

  // ── CLIENTES ──
  function filtrados(){
    var q=norm(S.busca);
    var L=load().clientes.filter(function(c){
      if(q && norm(c.nome+' '+c.cidade+' '+c.codigo+' '+c.razao).indexOf(q)<0) return false;
      var f=S.f;
      if(f.estado && c.estado!==f.estado) return false;
      if(f.frequencia && c.frequencia!==f.frequencia) return false;
      if(f.bobina && c.bobina.tipo!==f.bobina) return false;
      if(f.nota && c.notaCobranca!==f.nota) return false;
      if(f.notaBobina && c.bobina.notas!==f.notaBobina) return false;
      if(f.notaEtiqueta && c.etiqueta.notas!==f.notaEtiqueta) return false;
      if(f.situacao && c.situacao!==f.situacao) return false;
      return true;
    });
    var so=S.cliSort||{c:'nome',d:1};
    L.sort(function(a,b){ var x=cliAcc(a,so.c), y=cliAcc(b,so.c);
      return String(x).localeCompare(String(y),'pt-BR',{numeric:true,sensitivity:'base'})*so.d; });
    return L;
  }
  function cliAcc(c,col){ if(col==='cidade') return (c.cidade||'')+' / '+(c.estado||''); return c[col]==null?'':c[col]; }
  var CLI_COLS=[['codigo','Código'],['nome','Cliente'],['cidade','Cidade/UF'],['frequencia','Frequência'],['situacao','Situação']];
  var PSK_COLS=[['codigo','Código'],['nome','Produto'],['linha','Linha'],['empacotamento','Empac.']];
  function sortTh(cols,sort,fn){ return cols.map(function(c){ var on=sort.c===c[0];
    return '<th class="so'+(on?' on':'')+'" data-col="'+c[0]+'" onclick="'+fn+'(\''+c[0]+'\')">'+c[1]+'<i class="ti ti-'+(on?(sort.d>0?'arrow-up':'arrow-down'):'arrows-sort')+'"></i></th>'; }).join('');
  }
  function selOpts(lista, val, vazio){
    return (vazio!=null?'<option value="">'+esc(vazio)+'</option>':'')+lista.map(function(o){return '<option value="'+esc(o)+'"'+(o===val?' selected':'')+'>'+esc(o)+'</option>';}).join('');
  }
  function nFiltros(){ return Object.keys(S.f).filter(function(k){return S.f[k];}).length; }
  function buscaCampo(id, val, fn, ph){
    if(typeof _cpBuscaCampo==='function') return _cpBuscaCampo(val, fn, id, ph);
    return '<input class="mp-in" id="'+id+'" placeholder="'+esc(ph)+'" value="'+esc(val)+'" oninput="'+fn+'(this)">';
  }
  function funilBtn(fn, on){
    if(typeof _cpIcoBtn==='function') return _cpIcoBtn(fn+'()', 'Filtros', 'filter', !!on, '');
    return '<button class="mp-btn gho sm'+(on?' on':'')+'" title="Filtros" onclick="'+fn+'()"><i class="ti ti-filter"></i></button>';
  }
  function filtroPopHTML(kind){
    var aberto=(kind==='sku')?S.skFOpen:S.fOpen;
    if(!aberto) return '';
    var ativo, limpar, grupos;
    if(kind==='sku'){
      var linhas=OPT.linha.filter(function(l){return load().skus.some(function(s){return s.linha===l;});});
      load().skus.forEach(function(s){ if(s.linha && linhas.indexOf(s.linha)<0) linhas.push(s.linha); });
      ativo=!!S.skLinha; limpar='MP.limparSkFiltro()';
      grupos='<div class="mp-fgrp"><b>Linha</b><select class="mp-fsel" onchange="MP.skLinha(this.value)">'+selOpts(linhas,S.skLinha,'Todas as linhas')+'</select></div>';
    } else {
      ativo=nFiltros()>0; limpar='MP.limparFiltros()';
      grupos=FILTROS.map(function(fl){
        return '<div class="mp-fgrp"><b>'+esc(fl[1])+'</b><select class="mp-fsel" onchange="MP.filtro(\''+fl[0]+'\',this.value)">'+selOpts(OPT[fl[2]],S.f[fl[0]]||'','Todos')+'</select></div>';
      }).join('');
    }
    return '<div class="cp-pop mp-fpop">'+(ativo?'<div class="mp-fpop-h"><u onclick="'+limpar+'">Limpar</u></div>':'')+grupos+'</div>';
  }
  function funilWrap(id, kind, on, toggleFn){
    return '<span class="cp-pop-wrap" id="'+id+'" style="position:relative;display:inline-flex">'+funilBtn(toggleFn,on)+filtroPopHTML(kind)+'</span>';
  }
  function syncFunil(id, on, limparFn){
    var wrap=document.getElementById(id); if(!wrap) return;
    var btn=wrap.querySelector('.cp-abtn,button'); if(btn) btn.classList.toggle('on', !!on);
    var pop=wrap.querySelector('.mp-fpop'); if(!pop) return;
    var h=pop.querySelector('.mp-fpop-h');
    if(on && !h) pop.insertAdjacentHTML('afterbegin','<div class="mp-fpop-h"><u onclick="'+limparFn+'">Limpar</u></div>');
    if(!on && h) h.remove();
  }
  function bindFiltroCloser(){
    if(window.__mpFiltroCloser) return;
    window.__mpFiltroCloser=true;
    document.addEventListener('mousedown', function(e){
      if(!S.fOpen && !S.skFOpen) return;
      if(e.target && e.target.closest && e.target.closest('.cp-pop-wrap')) return;
      fecharFiltros();
    }, true);
    document.addEventListener('keydown', function(e){
      if(e.key!=='Escape') return;
      if(document.getElementById('mp-modal')) return;
      if(!S.fOpen && !S.skFOpen) return;
      fecharFiltros();
    });
  }
  function fecharFiltros(){
    if(!S.fOpen && !S.skFOpen) return;
    S.fOpen=false; S.skFOpen=false;
    var c=document.querySelector('#mp-fwrap .mp-fpop'); if(c) c.remove();
    var s=document.querySelector('#mp-skfwrap .mp-fpop'); if(s) s.remove();
  }
  function toolsHTML(){
    if(S.tab==='skus'){
      return buscaCampo('mp-skbusca',S.skBusca,'MP.skBuscaEl','Buscar produto, código ou cliente...')
        +funilWrap('mp-skfwrap','sku',!!S.skLinha,'MP.toggleSkFiltro');
    }
    return buscaCampo('mp-busca',S.busca,'MP.buscaEl','Buscar cliente ou cidade...')
      +funilWrap('mp-fwrap','cli',nFiltros()>0,'MP.toggleFiltro');
  }
  function clientesHTML(){
    return '<div class="mp-split"><div class="mp-card mp-list" id="mp-list">'+listaHTML()+'</div><div class="mp-card mp-panel" id="mp-panel">'+painelHTML()+'</div></div>';
  }
  function listaHTML(){
    var L=filtrados();
    if(S.sel && !L.some(function(c){return c.id===S.sel;})) { /* mantém seleção mesmo fora do filtro */ }
    if(!S.sel && L.length) S.sel=L[0].id;
    var h='<div class="mp-list-h">'+L.length+' cliente'+(L.length===1?'':'s')+'</div>';
    if(!L.length) return h+'<div class="mp-empty"><i class="ti ti-search"></i>Nenhum cliente para esse filtro.</div>';
    return h+'<div class="mp-tw"><table class="mp-t"><thead><tr>'+sortTh(CLI_COLS,S.cliSort,'MP.cliSort')+'</tr></thead><tbody>'
      +L.map(function(c){
        return '<tr class="mp-cli'+(c.id===S.sel?' on':'')+'" data-id="'+esc(c.id)+'" onclick="MP.sel(\''+esc(c.id)+'\')">'
          +'<td class="mu">'+esc(c.codigo||'—')+'</td>'
          +'<td class="pr">'+esc(c.nome)+'</td>'
          +'<td>'+esc(c.cidade||'—')+' / '+esc(c.estado||'—')+'</td>'
          +'<td>'+esc(c.frequencia||'—')+'</td>'
          +'<td>'+esc(c.situacao||'—')+'</td></tr>';
      }).join('')+'</tbody></table></div>';
  }
  function painelHTML(){
    var c=S.sel?cliById(S.sel):null;
    if(!c) return '<div class="mp-empty"><i class="ti ti-building"></i>Selecione um cliente na lista.</div>';
    var tab=(S.pTab==='embalagem'||S.pTab==='skus'||S.pTab==='negociacao')?S.pTab:'dados';
    var nCot=cotDe(c.id).lista.length;
    var so=S.pSkSort||{c:'codigo',d:1};
    var sk=skusDe(c.id).slice().sort(function(a,b){ var x=skAcc(a,so.c), y=skAcc(b,so.c);
      return String(x).localeCompare(String(y),'pt-BR',{numeric:true,sensitivity:'base'})*so.d; });
    var h='<div class="mp-ph"><div class="tt"><h3>'+(c.codigo?'<span class="cd">'+esc(c.codigo)+' · </span>':'')+esc(c.nome)+'</h3>'
      +'<div class="rz">'+esc(c.razao||'')+'</div>'
      +'<div class="ci">'+esc(c.cidade||'—')+' / '+esc(c.estado)+' · atualizado em '+fmtDt(c.atualizado)+'</div></div>'
      +'<div class="ac">'
      +'<button class="mp-act" title="Excluir" onclick="MP.excluirCliente(\''+esc(c.id)+'\')"><i class="ti ti-trash"></i></button>'
      +'<button class="mp-act" title="Editar" onclick="MP.editarCliente(\''+esc(c.id)+'\')"><i class="ti ti-pencil"></i></button>'
      +'</div></div>';
    h+='<div class="mp-itabs">'
      +'<button class="mp-itab'+(tab==='dados'?' on':'')+'" onclick="MP.setPTab(\'dados\')">Dados</button>'
      +'<button class="mp-itab'+(tab==='embalagem'?' on':'')+'" onclick="MP.setPTab(\'embalagem\')">Embalagem</button>'
      +'<button class="mp-itab'+(tab==='skus'?' on':'')+'" onclick="MP.setPTab(\'skus\')">SKUs<span class="n">'+sk.length+'</span></button>'
      +'<button class="mp-itab'+(tab==='negociacao'?' on':'')+'" data-ptab="negociacao" onclick="MP.setPTab(\'negociacao\')">Negociação<span class="n">'+nCot+'</span></button>'
      +'</div><div class="mp-pb">';
    if(tab==='dados'){
      var prazo=(c.prazoDias!==''&&c.prazoDias!=null)?c.prazoDias+' dias':'—';
      var pmin=(c.pedidoMin!==''&&c.pedidoMin!=null)?c.pedidoMin+' caixas':'—';
      var kv=function(k,v){ return '<div class="mp-kv-row"><div class="mp-kv-k">'+k+'</div><div class="mp-kv-v">'+esc(v==null||v===''?'—':v)+'</div></div>'; };
      h+='<div class="mp-kv2"><div class="mp-kv">'
        +kv('Matéria-prima',c.materiaPrima)+kv('Nota de cobrança',c.notaCobranca)+kv('Frequência',c.frequencia)
        +'</div><div class="mp-kv">'
        +kv('Prazo de entrega',prazo)+kv('Pedido mínimo',pmin)+kv('Situação',c.situacao)
        +'</div></div>';
      if(c.info) h+='<div class="mp-obs"><div class="mp-sec-n">Informações operacionais</div><p>'+esc(c.info)+'</p></div>';
    } else if(tab==='embalagem'){
      var cell=function(v){ var t=(v==null||v==='')?'—':String(v); var na=t==='—'||/^n[aã]o se aplica$/i.test(t);
        return '<td'+(na?' class="na"':'')+'>'+esc(t)+'</td>'; };
      var row=function(rot,o){ o=o||{}; return '<tr><td class="k">'+rot+'</td>'+cell(o.tipo)+cell(o.resp)+cell(o.notas)+'</tr>'; };
      h+='<table class="mp-emb"><thead><tr><th></th><th>Tipo</th><th>Responsável compra</th><th>Notas</th></tr></thead><tbody>'
        +row('Etiqueta',c.etiqueta)+row('Bobina',c.bobina)+row('Caixa / Fardo',c.caixa)+'</tbody></table>';
    } else if(tab==='negociacao'){
      h+=negHTML(c);
    } else {
      h+='<div class="mp-sku-h"><span class="mp-sec-n">SKUs vinculados</span><span class="mp-sec-count">'+sk.length+'</span><span class="sp"></span>'
        +'<button class="mp-add-sku" type="button" onclick="MP.novoSku(\''+esc(c.id)+'\')"><i class="ti ti-plus"></i>SKU</button></div>';
      if(!sk.length) h+='<div class="mp-empty">Nenhum SKU cadastrado para este cliente.</div>';
      else h+='<div class="mp-tw"><table class="mp-t"><thead><tr>'+sortTh(PSK_COLS,S.pSkSort,'MP.pSkSort')+'<th></th></tr></thead><tbody>'
        +sk.map(function(s){
          return '<tr data-id="'+esc(s.id)+'"><td class="mu">'+esc(s.codigo||'—')+'</td><td class="pr">'+esc(s.nome)+'</td>'
            +'<td class="mu">'+esc(s.linha||'—')+'</td><td>'+esc(s.empacotamento||'—')+'</td><td>'+actsHTML(s.id,{discreto:true})+'</td></tr>';
        }).join('')+'</tbody></table></div>';
    }
    return h+'</div>';
  }
  // ── NEGOCIAÇÃO (cotações por cliente) ──
  // Duas visões dentro da aba: "Ativa" (a negociação fechada com o cliente — só uma por vez) e
  // "Enviadas" (todas as cotações mandadas: Enviada / Vencida / Recusada / Substituída / Fechada / Encerrada).
  // "Criar cotação" monta a cotação no layout Klain (pré-visualização + PDF via pdfMake, o mesmo já usado
  // nas Atas/OS) e salva como enviada; "Anexar PDF" guarda cotações feitas fora (data URL, até 1,5 MB).
  // Cotações geradas aqui guardam só os dados — o PDF é remontado igual a cada download (não ocupa espaço).
  // Chave taskflow_marcas_cotacoes (v2). ⚠️ Seed fictício: pessoas e contatos inventados.
  var LS_COT='taskflow_marcas_cotacoes';
  var COT_MAX=1536*1024, COT_TOTAL=4*1024*1024;
  var FAIXAS=[['Faixa 1','50–100 cx','50 à 100cx'],['Faixa 2','100–1.000 cx','100 à 1.000cx'],['Faixa 3','> 1.000 cx','Acima de 1.000cx']];
  var FORN=['Fornecida pela indústria','Fornecida pelo cliente','Não incluso'];
  var EMB_ROWS=[['primaria','Primária'],['secundaria','Secundária'],['etiqueta','Etiqueta'],['aplicacao','Aplicação de etiqueta']];
  var INFO_PAD='** Para gramagens diferentes da indústria, o pedido mínimo é 1 mil fardos.';
  var OBS_PAD=['a) Somos do Regime Tributário Lucro Real; informação a título de aproveitamento de impostos.',
    'b) Quando em caixa, todos os produtos têm como base 10 unidades na caixa. Esta quantidade pode variar conforme a acomodação dos produtos na caixa; temos 6 modelos de caixa à disposição. Caso queiram uma caixa impressa ou diferente dos nossos modelos, é possível; a compra dela fica a cargo do cliente, que ganha o desconto no produto.',
    'c) Personalização de pesos a partir de 1 mil caixas por sabor.',
    'd) Valores sem troca. Realizamos trocas somente se houver alguma inconformidade no produto.',
    'e) Prazo de pagamento condicionado à análise de crédito do setor financeiro. O prazo de 14/21 dias só será aplicado caso o CNPJ esteja sem restrições.'].join('\n');
  function condPad(){ return {frete:'CIF',descRet:'2',entrega:'10 dias após pedido',pagto:'Boleto bancário',prazo:'14/21 dias'}; }
  function embPad(){ return {primaria:{desc:'Plástico transparente / impresso',forn:'Fornecida pela indústria'},secundaria:{desc:'Caixa de papelão sem impressão',forn:'Fornecida pela indústria'},
    etiqueta:{desc:'Da embalagem',forn:'Não incluso'},aplicacao:{desc:'Aplicação de etiqueta na embalagem',forn:'Não incluso'}}; }
  function freteTxt(cd){ cd=cd||{}; if(cd.frete==='FOB') return 'FOB (retirada na fábrica)'; return 'CIF'+(cd.descRet?' (desc. retirada '+cd.descRet+'%)':''); }
  function slug(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,''); }
  function arqNome(num,cli){ return 'Cotacao_'+String(num).replace(/\//g,'-')+'_'+slug(cli&&cli.nome||'cliente')+'.pdf'; }
  function cotSeed(){
    var it=function(d,cx,mn,f){ return {desc:d,cx:cx,min:mn,f:f}; };
    var mk=function(o){ return Object.assign({origem:'gerada',validade:10,info:INFO_PAD,obs:OBS_PAD,cond:condPad(),emb:embPad(),arquivo:null,st:'enviada',criado:o.data+'T10:00:00'},o); };
    var at=function(a,b){ return [it('Salgadinho Palitinho sabor Orégano 138g',20,'50 cx',a),it('Salgadinho Palitinho sabor Calabresa 138g',20,'50 cx',a),it('Salgadão sabor Bacon 100g',24,'50 cx',b)]; };
    var cb=function(a,b){ return [it('Biscoito de Amendoim com Chocolate Branco 250g',12,'50 cx',a),it('Biscoito Broa de Amendoim 250g',12,'50 cx',b)]; };
    var cA={nome:'Atlântico Snacks'}, cB={nome:'Costa Brava Foods'};
    var A=[
      mk({id:'cot8809f',numero:'0097/26',data:'2026-08-18',por:'Marina Couto',contato:'Rafael Nunes',fone:'(47) 90000-1001',itens:at([3.52,3.41,3.33],[3.05,2.96,2.88]),
        cond:Object.assign(condPad(),{prazo:'21 dias'}),fechadaEm:'2026-08-25',nota:'Fechada por telefone; pedido inicial de 380 cx.'}),
      mk({id:'cot8809a',numero:'0118/26',data:'2026-09-22',por:'Marina Couto',contato:'Rafael Nunes',fone:'(47) 90000-1001',itens:at([3.40,3.30,3.22],[2.95,2.86,2.79]),st:'recusada',nota:'Cliente achou o prazo de 14 dias curto.'}),
      mk({id:'cot8809b',numero:'0131/26',data:'2026-10-14',por:'Marina Couto',contato:'Rafael Nunes',fone:'(47) 90000-1001',itens:at([3.28,3.18,3.10],[2.89,2.80,2.73]),cond:Object.assign(condPad(),{prazo:'21 dias'}),st:'substituida'}),
      mk({id:'cot8809c',numero:'0142/26',data:'2026-11-10',por:'Marina Couto',contato:'Rafael Nunes',fone:'(47) 90000-1001',itens:at([3.19,3.09,3.02],[2.84,2.75,2.68]),cond:Object.assign(condPad(),{prazo:'21 dias'}),nota:'Revisão para 400 cx/mês — aguardando retorno.'})
    ];
    var B=[
      mk({id:'cot8807a',numero:'0125/26',data:'2026-10-02',por:'Paulo Henrique Lima',contato:'Juliana Rocha',fone:'(48) 90000-2002',itens:cb([4.10,3.98,3.89],[3.75,3.64,3.55]),st:'substituida'}),
      mk({id:'cot8807b',numero:'0136/26',data:'2026-10-20',por:'Paulo Henrique Lima',contato:'Juliana Rocha',fone:'(48) 90000-2002',itens:cb([3.96,3.85,3.77],[3.62,3.52,3.44]),cond:Object.assign(condPad(),{frete:'FOB',descRet:''})})
    ];
    A.concat(B).forEach(function(c){ c.arquivo={nome:arqNome(c.numero,c.id.indexOf('8809')>0?cA:cB),tam:0}; });
    return {v:2, m:{mpc8809:{ativa:'cot8809f',lista:A}, mpc8807:{ativa:null,lista:B}}};
  }
  var COT=null;
  function cotLoad(){
    if(COT) return COT;
    var raw=null; try{ raw=localStorage.getItem(LS_COT); }catch(e){}
    if(raw){ try{ COT=JSON.parse(raw); }catch(e){ COT=null; } }
    if(!COT||COT.v!==2||typeof COT.m!=='object'||!COT.m){ COT=cotSeed(); cotSave(); }
    return COT;
  }
  function cotSave(){ var s=JSON.stringify(COT); if(s.length>COT_TOTAL) return false; return lsSet(LS_COT, s)!==false; }
  function cotDe(id){ var r=cotLoad().m[id]; return r&&Array.isArray(r.lista)?r:{ativa:null,lista:[]}; }
  function cotReg(id){ var db=cotLoad(); return db.m[id]||(db.m[id]={ativa:null,lista:[]}); }
  function cotOrd(id){ return cotDe(id).lista.slice().sort(function(a,b){ return String(b.data+b.criado).localeCompare(String(a.data+a.criado)); }); }
  function dParse(s){ if(!s) return null; var p=String(s).slice(0,10).split('-'); var d=new Date(+p[0],(+p[1])-1,+p[2]); return isNaN(d)?null:d; }
  function dBr(d){ return d?pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear():'—'; }
  function dCurta(d){ return d?pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(2):'—'; }
  function dPonto(d){ return d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():'—'; }
  function hoje0(){ var d=new Date(); d.setHours(0,0,0,0); return d; }
  function hojeIso(){ var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function cotAte(c){ var d=dParse(c.data); if(!d) return null; d.setDate(d.getDate()+(parseInt(c.validade,10)||0)); return d; }
  function cotVencida(c){ var a=cotAte(c); return !!a && a<hoje0(); }
  function cotStatus(c,reg){ if(reg && c.id===reg.ativa) return 'Fechada'; if(c.st==='encerrada') return 'Encerrada'; if(c.st==='recusada') return 'Recusada';
    if(c.st==='substituida') return 'Substituída'; return cotVencida(c)?'Vencida':'Enviada'; }
  var ST_CLS={'Fechada':'a','Enviada':'e','Vencida':'v','Recusada':'v','Substituída':'x','Encerrada':'x'};
  function brl(n){ if(n==null||n===''||isNaN(n)) return '—'; return 'R$ '+Number(n).toFixed(2).replace('.',','); }
  function kb(n){ if(!n) return ''; return n>=1048576?(n/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB'; }
  function nPrice(s){ s=String(s==null?'':s).replace(/[^\d,.-]/g,''); if(!s) return null; if(s.indexOf(',')>=0) s=s.replace(/\./g,'').replace(',','.'); var n=parseFloat(s); return isNaN(n)?null:Math.round(n*100)/100; }
  function cotById(id){ var m=cotLoad().m; for(var k in m){ var f=(m[k].lista||[]).find(function(c){return c.id===id;}); if(f) return {c:f,cli:k,reg:m[k]}; } return null; }
  function proxNumero(){ var mx=0, yy=String(new Date().getFullYear()).slice(2); var m=cotLoad().m;
    Object.keys(m).forEach(function(k){ (m[k].lista||[]).forEach(function(c){ var n=parseInt(String(c.numero).split('/')[0],10); if(n>mx) mx=n; }); });
    var s=String(mx+1); while(s.length<4) s='0'+s; return s+'/'+yy; }
  function arqBtns(c){
    return '<button class="mp-act" title="Ver cotação" onclick="MP.cotVer(\''+esc(c.id)+'\')"><i class="ti ti-eye"></i></button>'
      +'<button class="mp-act" title="Baixar PDF" onclick="MP.cotBaixar(\''+esc(c.id)+'\')"><i class="ti ti-download"></i></button>'; }
  function itensTabHTML(c){
    if(!c.itens||!c.itens.length) return '<div class="mp-cot-dl">Itens e preços estão no PDF anexado.</div>';
    return '<table class="mp-emb mp-cot-it"><thead><tr><th>Descrição</th><th class="n">Cx</th><th class="n">Ped. mín.</th>'
      +FAIXAS.map(function(f){ return '<th class="n" title="'+f[1]+'">'+f[0]+'<small>'+f[1]+'</small></th>'; }).join('')+'</tr></thead><tbody>'
      +c.itens.map(function(i){ return '<tr><td>'+esc(i.desc)+'</td><td class="n">'+esc(i.cx==null||i.cx===''?'—':i.cx)+'</td><td class="n">'+esc(i.min||'—')+'</td>'
        +[0,1,2].map(function(k){ return '<td class="n pz">'+brl(i.f&&i.f[k])+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table>'; }
  function negHTML(cli){
    var reg=cotDe(cli.id), L=cotOrd(cli.id), vw=S.nTab==='enviadas'?'enviadas':'ativa';
    var h='<input type="file" id="mp-cot-file" accept="application/pdf,.pdf" style="display:none" onchange="MP.cotArquivo(this)">'
      +'<div class="mp-neg-bar"><div class="mp-seg" role="tablist">'
      +'<button type="button" class="'+(vw==='ativa'?'on':'')+'" data-ntab="ativa" onclick="MP.negTab(\'ativa\')">Ativa</button>'
      +'<button type="button" class="'+(vw==='enviadas'?'on':'')+'" data-ntab="enviadas" onclick="MP.negTab(\'enviadas\')">Enviadas<span class="n">'+L.length+'</span></button></div>'
      +'<span class="sp"></span>'
      +(vw==='enviadas'?'<button class="mp-btn gho sm" type="button" id="mp-cot-add" title="Anexar PDF de cotação feita fora do HUB" onclick="MP.cotAnexar()"><i class="ti ti-paperclip"></i>Anexar PDF</button>':'')
      +'<button class="mp-btn pri sm" type="button" id="mp-cot-new" onclick="MP.cotCriar(\''+esc(cli.id)+'\')"><i class="ti ti-plus"></i>Criar cotação</button></div>';
    return h+(vw==='enviadas'?enviadasHTML(cli,reg,L):ativaHTML(cli,reg,L));
  }
  function ativaHTML(cli,reg,L){
    var a=L.find(function(c){return c.id===reg.ativa;})||null;
    if(!a) return '<div class="mp-cot mp-cot-vz"><i class="ti ti-file-certificate"></i><div>Nenhuma negociação fechada</div>'
      +'<div class="mu">Quando o cliente aceitar uma cotação, abra <u class="mp-lk" onclick="MP.negTab(\'enviadas\')">Enviadas</u> e use “Marcar como fechada”.'
      +(L.length?'':' Ainda não há cotações enviadas para este cliente.')+'</div></div>';
    var kv=function(k,v,cls){ return '<div class="mp-kv-row"><div class="mp-kv-k">'+k+'</div><div class="mp-kv-v'+(cls?' '+cls:'')+'">'+esc(v==null||v===''?'—':v)+'</div></div>'; };
    var cd=a.cond||{};
    var nova=L.filter(function(c){ return c.data>a.data && cotStatus(c,reg)==='Enviada'; })[0];
    return '<div class="mp-cot" id="mp-cot-ativa"><div class="mp-cot-t"><div class="nb">Nº '+esc(a.numero)+'</div>'
      +'<span class="mp-cot-st">Ativa</span><span class="sp"></span>'
      +'<span class="mp-cot-arq" title="'+esc(a.arquivo&&a.arquivo.nome||'')+'"><i class="ti ti-file-type-pdf"></i><span class="nm">'+esc(a.arquivo&&a.arquivo.nome||'—')+'</span></span>'
      +'<span class="mp-acts">'+arqBtns(a)+'</span></div>'
      +'<div class="mp-kv2"><div class="mp-kv">'
      +kv('Vigente desde',dBr(dParse(a.fechadaEm)))+kv('Enviada em',dBr(dParse(a.data)))+kv('Elaborada por',a.por)+kv('Contato',a.contato)
      +'</div><div class="mp-kv">'+kv('Frete',freteTxt(cd))+kv('Entrega',cd.entrega)+kv('Pagamento',cd.pagto)+kv('Prazo',cd.prazo)+'</div></div>'
      +itensTabHTML(a)
      +(a.nota?'<div class="mp-cot-obs"><b>Nota:</b> '+esc(a.nota)+'</div>':'')+'</div>'
      +(nova?'<div class="mp-cot-hint mp-cot-nova"><i class="ti ti-info-circle"></i>A cotação '+esc(nova.numero)+' (enviada em '+dBr(dParse(nova.data))+') está aguardando retorno — <u class="mp-lk" onclick="MP.negTab(\'enviadas\')">ver em Enviadas</u>.</div>':'');
  }
  function enviadasHTML(cli,reg,L){
    if(!L.length) return '<div class="mp-cot mp-cot-vz"><i class="ti ti-send"></i><div>Nenhuma cotação enviada</div>'
      +'<div class="mu">Crie a cotação aqui no HUB ou anexe o PDF de uma cotação feita fora.</div></div>';
    return '<div class="mp-tw mp-cot-tw"><table class="mp-t mp-cot-hist"><thead><tr><th>Nº</th><th>Envio</th><th>Validade</th><th class="c-por">Elaborada por</th><th class="c">PDF</th><th>Status</th><th></th></tr></thead><tbody>'
      +L.map(function(c){ var st=cotStatus(c,reg), on=c.id===reg.ativa;
        return '<tr data-id="'+esc(c.id)+'"'+(on?' class="on"':'')+'><td class="'+(on?'pr':'mu')+'">'+esc(c.numero)+'</td><td>'+dCurta(dParse(c.data))+'</td><td>'+dCurta(cotAte(c))+'</td>'
          +'<td class="mp-cot-por c-por" title="'+esc(c.por||'')+'">'+esc(c.por||'—')+'</td>'
          +'<td class="c"><button class="mp-act" title="Ver '+esc(c.arquivo&&c.arquivo.nome||'cotação')+'" onclick="MP.cotVer(\''+esc(c.id)+'\')"><i class="ti ti-file-type-pdf"></i></button></td>'
          +'<td><span class="mp-cot-s s-'+ST_CLS[st]+'">'+st+'</span></td>'
          +'<td><div class="mp-acts">'+(on?'':'<button class="mp-act" title="Marcar como fechada" onclick="MP.cotFechar(\''+esc(cli.id)+'\',\''+esc(c.id)+'\')"><i class="ti ti-circle-check"></i></button>')
          +'<button class="mp-act" title="Mais ações" onclick="MP.cotMenu(this,\''+esc(cli.id)+'\',\''+esc(c.id)+'\')"><i class="ti ti-dots"></i></button></div></td></tr>';
      }).join('')+'</tbody></table></div>'
      +'<div class="mp-cot-hint">Enviada → aguardando retorno · Vencida → passou da validade · Substituída → houve uma cotação mais nova · Fechada → é a negociação ativa.</div>';
  }
  // menu "⋯" das linhas de Enviadas
  function fecharMenu(){ var m=document.getElementById('mp-cot-menu'); if(m) m.remove(); document.removeEventListener('mousedown',menuFora,true); window.removeEventListener('scroll',fecharMenu,true); }
  function menuFora(e){ if(e.target.closest && e.target.closest('#mp-cot-menu')) return; fecharMenu(); }
  // ── Layout Klain (pré-visualização HTML; o PDF segue a mesma estrutura) ──
  function cotDados(c,cliId){ var cli=cliById(cliId)||{}; return {c:c,cli:cli}; }
  function layoutHTML(c,cli){
    var itens=(c.itens||[]).slice(); var n=Math.max(itens.length,6);
    var rows=''; for(var i=0;i<n;i++){ var it=itens[i];
      rows+='<tr><td class="i">'+(i+1)+'</td><td class="d">'+(it?esc(it.desc):'')+'</td><td class="c">'+(it?esc(it.cx==null?'':it.cx):'')+'</td><td class="c">'+(it?esc(it.min||''):'')+'</td>'
        +[0,1,2].map(function(k){ return '<td class="c b">'+(it&&it.f&&it.f[k]!=null?brl(it.f[k]):'')+'</td>'; }).join('')+'</tr>'; }
    var emb=c.emb||embPad(), cd=c.cond||{};
    var obs=String(c.obs||'').split('\n').filter(function(x){return x.trim();}).map(function(l){ return '<li>'+esc(l)+'</li>'; }).join('');
    return '<div class="kq"><div class="kq-h"><div class="kq-logo"><b>Klain</b><i>Feito com amor.</i></div>'
      +'<div class="kq-sl"><b>SUA MARCA FORTE COM PRODUTOS DE ALTO GIRO!</b><span>TERCEIRIZAÇÃO COM KLAIN ALIMENTOS</span><span>DO SEU JEITO, NO SEU TEMPO!</span><span>LOGÍSTICA PRÓPRIA PARA MELHOR LHE ATENDER.</span><span>40 ANOS DE EXPERIÊNCIA.</span></div>'
      +'<div class="kq-box"><div><span>COTAÇÃO</span><span>DATA</span></div><div><b>'+esc(c.numero||'—')+'</b><b>'+dPonto(dParse(c.data))+'</b></div></div></div>'
      +'<table class="kq-cli"><tr><td colspan="2"><span>CLIENTE:</span> '+esc((cli.nome||'').toUpperCase())+'</td></tr>'
      +'<tr><td><span>CIDADE:</span> '+esc((cli.cidade||'').toUpperCase())+'</td><td><span>CONTATO:</span> '+esc((c.contato||'').toUpperCase())+'</td></tr>'
      +'<tr><td><span>ESTADO:</span> '+esc(cli.estado||'')+'</td><td><span>FONE:</span> '+esc(c.fone||'')+'</td></tr></table>'
      +'<table class="kq-it"><thead><tr><th class="i"></th><th>Descrição</th><th class="c">Quantidade<br>na caixa</th><th class="c">Pedido mínimo<br>por sabor</th>'
      +FAIXAS.map(function(f){ return '<th class="c">'+f[0].toUpperCase()+'<br><small>'+f[2]+'</small></th>'; }).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>'
      +(c.info?'<div class="kq-info"><b>INFORMAÇÕES COMPLEMENTARES:</b><p>'+esc(c.info).replace(/\n/g,'<br>')+'</p></div>':'')
      +(obs?'<div class="kq-sec">OBSERVAÇÕES</div><ul class="kq-obs">'+obs+'</ul>':'')
      +'<div class="kq-sec">EMBALAGENS</div><table class="kq-g"><tr>'+EMB_ROWS.map(function(r){ return '<th>'+r[1].toUpperCase()+'<small>'+esc(emb[r[0]]&&emb[r[0]].desc||'')+'</small></th>'; }).join('')+'</tr>'
      +'<tr>'+EMB_ROWS.map(function(r){ return '<td>'+esc(emb[r[0]]&&emb[r[0]].forn||'—')+'</td>'; }).join('')+'</tr></table>'
      +'<table class="kq-g kq-cd"><tr><th>Condições de envio</th><th>Data de entrega</th><th>Condições de pagamento</th><th>Data de vencimento</th></tr>'
      +'<tr><td>'+(cd.frete==='FOB'?'Valores da cotação com frete FOB<br><small>(retirada na fábrica)</small>':'Valores da cotação com frete CIF'+(cd.descRet?'<br><small>(desc. de retirada: '+esc(cd.descRet)+'%)</small>':''))+'</td>'
      +'<td>'+esc(cd.entrega||'—')+'</td><td>'+esc(cd.pagto||'—')+'</td><td>'+esc(cd.prazo||'—')+'</td></tr></table>'
      +'<div class="kq-ft"><p>Esta é uma cotação referente às mercadorias acima citadas e está sujeita às condições indicadas acima.</p>'
      +'<p><b>VALIDADE DA PROPOSTA:</b> '+esc(c.validade)+' dias a partir da data de elaboração.</p>'
      +'<p>OBS.: mensalmente todas as tabelas de preço são revistas e atualizadas (para mais ou para menos) se necessário.</p>'
      +'<p class="by">Cotação elaborada por: '+esc((c.por||'').toUpperCase())+'</p><p>Agradecemos a preferência.</p>'
      +'<p class="co">KLAIN ALIMENTOS · Terceirização de marcas próprias</p></div></div>';
  }
  // ── PDF (pdfMake, carregado sob demanda pelo HUB) ──
  function pdfDoc(c,cli){
    var RED='#c8202e', G='#555', L='#bbbbbb';
    var grid={hLineWidth:function(){return .6;},vLineWidth:function(){return .6;},hLineColor:function(){return L;},vLineColor:function(){return L;},paddingTop:function(){return 3;},paddingBottom:function(){return 3;}};
    var itens=(c.itens||[]).slice(), n=Math.max(itens.length,6), body=[];
    body.push([{text:''},{text:'Descrição',bold:true,alignment:'center'},{text:'Quantidade\nna caixa',bold:true,alignment:'center'},{text:'Pedido mínimo\npor sabor',bold:true,alignment:'center'}]
      .concat(FAIXAS.map(function(f){ return {text:[{text:f[0].toUpperCase()+'\n',bold:true},{text:f[2],fontSize:7}],alignment:'center'}; })));
    for(var i=0;i<n;i++){ var it=itens[i];
      body.push([{text:String(i+1),alignment:'center',color:G},{text:it?it.desc:''},{text:it?String(it.cx==null?'':it.cx):'',alignment:'center'},{text:it?(it.min||''):'',alignment:'center'}]
        .concat([0,1,2].map(function(k){ return {text:it&&it.f&&it.f[k]!=null?brl(it.f[k]):'',alignment:'center',bold:true}; }))); }
    var emb=c.emb||embPad(), cd=c.cond||{};
    var cli3=function(a,b){ return {text:[{text:a+' ',bold:true,fontSize:7.5,color:G},{text:b||''}]}; };
    var sec=function(t){ return {table:{widths:['*'],body:[[{text:t,bold:true,alignment:'center',fontSize:8}]]},layout:grid,margin:[0,10,0,0]}; };
    var obs=String(c.obs||'').split('\n').filter(function(x){return x.trim();});
    var freteC=cd.frete==='FOB'?[{text:'Valores da cotação com frete FOB\n'},{text:'(retirada na fábrica)',fontSize:7.5}]
      :[{text:'Valores da cotação com frete CIF\n'}].concat(cd.descRet?[{text:'(Desc. de retirada: '+cd.descRet+'%)',fontSize:7.5}]:[]);
    return {pageSize:'A4',pageMargins:[32,28,32,34],defaultStyle:{fontSize:8.5,color:'#222'},
      info:{title:'Cotação '+(c.numero||'')+' · '+(cli.nome||''),author:'Klain Alimentos'},
      content:[
        {columns:[
          {width:110,stack:[{text:'Klain',fontSize:30,bold:true,italics:true,color:RED},{text:'Feito com amor.',italics:true,color:RED,fontSize:8,margin:[2,-2,0,0]}]},
          {width:'*',margin:[6,2,0,0],stack:[{text:'SUA MARCA FORTE COM PRODUTOS DE ALTO GIRO!',bold:true,fontSize:9},{text:'TERCEIRIZAÇÃO COM KLAIN ALIMENTOS',bold:true,fontSize:8},{text:'DO SEU JEITO, NO SEU TEMPO!',bold:true,fontSize:8},{text:'LOGÍSTICA PRÓPRIA PARA MELHOR LHE ATENDER.',bold:true,fontSize:8},{text:'40 ANOS DE EXPERIÊNCIA.',bold:true,fontSize:8}]},
          {width:130,table:{widths:['*','*'],body:[[{text:'COTAÇÃO',fontSize:7,color:G,alignment:'center'},{text:'DATA',fontSize:7,color:G,alignment:'center'}],[{text:c.numero||'—',fontSize:12,bold:true,alignment:'center'},{text:dPonto(dParse(c.data)),fontSize:12,bold:true,alignment:'center'}]]},layout:grid}
        ]},
        {margin:[0,12,0,0],table:{widths:['*','*'],body:[[Object.assign(cli3('CLIENTE:',(cli.nome||'').toUpperCase()),{colSpan:2}),{}],[cli3('CIDADE:',(cli.cidade||'').toUpperCase()),cli3('CONTATO:',(c.contato||'').toUpperCase())],[cli3('ESTADO:',cli.estado||''),cli3('FONE:',c.fone||'')]]},layout:grid},
        {margin:[0,10,0,0],table:{headerRows:1,widths:[14,'*',52,58,58,58,64],body:body},layout:grid},
        c.info?{margin:[0,8,0,0],stack:[{text:'INFORMAÇÕES COMPLEMENTARES:',bold:true},{text:c.info,margin:[0,3,0,0]}]}:'',
        obs.length?sec('OBSERVAÇÕES'):'',
        obs.length?{margin:[6,4,0,0],stack:obs.map(function(l){ return {text:l,margin:[0,1,0,1],fontSize:8}; })}:'',
        sec('EMBALAGENS'),
        {table:{widths:['*','*','*','*'],body:[EMB_ROWS.map(function(r){ return {text:[{text:r[1].toUpperCase()+'\n',bold:true,fontSize:7.5},{text:emb[r[0]]&&emb[r[0]].desc||'',fontSize:7,color:G}],alignment:'center'}; }),
          EMB_ROWS.map(function(r){ return {text:emb[r[0]]&&emb[r[0]].forn||'—',alignment:'center'}; })]},layout:grid},
        {margin:[0,8,0,0],table:{widths:['*','*','*','*'],body:[['Condições de envio','Data de entrega','Condições de pagamento','Data de vencimento'].map(function(t){ return {text:t,bold:true,fontSize:7.5,alignment:'center'}; }),
          [{text:freteC,alignment:'center'},{text:cd.entrega||'—',alignment:'center'},{text:cd.pagto||'—',alignment:'center'},{text:cd.prazo||'—',alignment:'center'}]]},layout:grid},
        {margin:[0,16,0,0],alignment:'center',fontSize:8,stack:[
          'Esta é uma cotação referente às mercadorias acima citadas e está sujeita às condições indicadas acima.',
          {text:[{text:'VALIDADE DA PROPOSTA: ',bold:true},c.validade+' dias a partir da data de elaboração.']},
          'OBS.: mensalmente todas as tabelas de preço são revistas e atualizadas (para mais ou para menos) se necessário.',
          {text:'Cotação elaborada por: '+(c.por||'').toUpperCase(),fontSize:9.5,margin:[0,10,0,0]},'Agradecemos a preferência.']}
      ],
      footer:function(){ return {text:'KLAIN ALIMENTOS · Terceirização de marcas próprias',alignment:'center',fontSize:7.5,color:G,margin:[0,10,0,0]}; }};
  }
  function comPdf(fn){
    var go=function(){ if(window.pdfMake&&pdfMake.createPdf){ try{ fn(); }catch(e){ console.error(e); toastMsg('Não foi possível gerar o PDF.'); } } else toastMsg('Biblioteca de PDF não carregou. Tente de novo em instantes.'); };
    if(window.pdfMake&&pdfMake.createPdf) return go();
    if(typeof ensurePdfMakeLoaded==='function') ensurePdfMakeLoaded().then(go,function(){ toastMsg('Não foi possível carregar a biblioteca de PDF.'); });
    else go();
  }
  function baixarPdf(c,cli,nome){ comPdf(function(){ pdfMake.createPdf(pdfDoc(c,cli)).download(nome||arqNome(c.numero,cli)); }); }
  function dataUrlBlob(u){ var p=String(u).split(','), bin=atob(p[1]||''), a=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i);
    var mt=(p[0].match(/data:([^;]+)/)||[])[1]||'application/pdf'; return new Blob([a],{type:mt}); }
  // ── Form Criar cotação ──
  function itRowHTML(i){ i=i||{desc:'',cx:'',min:'',f:[null,null,null]};
    var pv=function(k){ var n=i.f&&i.f[k]; return n==null?'':Number(n).toFixed(2).replace('.',','); };
    return '<tr><td><input class="mp-in ci-d" value="'+esc(i.desc)+'" placeholder="Produto e gramagem"></td>'
      +'<td><input class="mp-in ci-cx" value="'+esc(i.cx==null?'':i.cx)+'" inputmode="numeric"></td>'
      +'<td><input class="mp-in ci-min" value="'+esc(i.min||'')+'"></td>'
      +[0,1,2].map(function(k){ return '<td><input class="mp-in ci-f'+k+'" value="'+pv(k)+'" inputmode="decimal" placeholder="0,00"></td>'; }).join('')
      +'<td><button class="mp-act" type="button" title="Remover item" onclick="MP.cotItRm(this)"><i class="ti ti-x"></i></button></td></tr>'; }
  function lerItens(){ return [].slice.call(document.querySelectorAll('#cf-it tr')).map(function(tr){ var g=function(s){ var e=tr.querySelector(s); return e?String(e.value).trim():''; };
      return {desc:g('.ci-d'),cx:g('.ci-cx')?(parseInt(g('.ci-cx'),10)||g('.ci-cx')):'',min:g('.ci-min'),f:[nPrice(g('.ci-f0')),nPrice(g('.ci-f1')),nPrice(g('.ci-f2'))]}; })
      .filter(function(i){ return i.desc||i.f.some(function(x){return x!=null;}); }); }
  var CF=null; // {cliId}
  function cfLer(){ var emb={}; EMB_ROWS.forEach(function(r){ emb[r[0]]={desc:v('cf-e-'+r[0]+'-d'),forn:v('cf-e-'+r[0]+'-f')}; });
    return {numero:v('cf-num'),data:v('cf-data'),validade:parseInt(v('cf-val'),10)||'',por:v('cf-por'),contato:v('cf-cont'),fone:v('cf-fone'),itens:lerItens(),info:v('cf-info'),
      cond:{frete:v('cf-frete')||'CIF',descRet:v('cf-desc'),entrega:v('cf-ent'),pagto:v('cf-pag'),prazo:v('cf-prazo')},emb:emb,obs:v('cf-obs')}; }
  function cfValida(d){ var req=[['cf-num',d.numero],['cf-data',d.data],['cf-val',d.validade],['cf-por',d.por],['cf-ent',d.cond.entrega],['cf-pag',d.cond.pagto],['cf-prazo',d.cond.prazo]]
      .filter(function(x){ return !x[1]; }).map(function(x){ return x[0]; });
    var itOk=d.itens.length && d.itens.every(function(i){ return i.desc && i.f[0]!=null; });
    if(req.length||!itOk){ cfForm(true); marcaErro(itOk?req:req.concat(['cf-itens']), itOk?'Preencha os campos obrigatórios.':'Informe ao menos um item com descrição e preço da Faixa 1.'); return false; }
    marcaErro([],''); return true; }
  function cfForm(show){ var f=document.getElementById('cf-form'), p=document.getElementById('cf-prev'), b=document.getElementById('cf-pv-btn'); if(!f||!p) return;
    f.style.display=show?'':'none'; p.style.display=show?'none':''; if(b) b.innerHTML=show?'<i class="ti ti-eye"></i>Pré-visualizar':'<i class="ti ti-pencil"></i>Voltar ao formulário'; }
  function formCriar(cliId, baseId){
    var cli=cliById(cliId); if(!cli) return;
    var L=cotOrd(cliId), base=baseId?(cotById(baseId)||{}).c:L.find(function(c){ return c.itens&&c.itens.length; });
    var prev=function(desc){ var src=base&&base.itens||[]; return src.find(function(i){ return norm(i.desc)===norm(desc); }); };
    var itens=baseId&&base?base.itens.slice():skusDe(cliId).map(function(s){ var p=prev(s.nome); return p?Object.assign({},p):{desc:s.nome,cx:'',min:'',f:[null,null,null]}; });
    if(!itens.length) itens=[null];
    var cd=Object.assign(condPad(),base&&base.cond||{}), emb=Object.assign(embPad(),base&&base.emb||{});
    var embRow=function(r){ var e=emb[r[0]]||{}; return '<tr><td class="k">'+r[1]+'</td><td><input class="mp-in" id="cf-e-'+r[0]+'-d" value="'+esc(e.desc||'')+'"></td>'
      +'<td><select class="mp-sel" id="cf-e-'+r[0]+'-f">'+selOpts(FORN,e.forn||FORN[0])+'</select></td></tr>'; };
    var b='<div id="cf-form">'
      +'<div class="mp-cot-cli"><div><span>Cliente</span><b>'+esc(cli.nome)+'</b></div><div><span>Cidade/UF</span><b>'+esc((cli.cidade||'—')+' / '+(cli.estado||'—'))+'</b></div><div><span>Código</span><b>'+esc(cli.codigo||'—')+'</b></div></div>'
      +'<div class="mp-g c4">'+fIn('cf-num','Nº da cotação',proxNumero(),{req:true})+fIn('cf-data','Data',hojeIso(),{req:true,type:'date'})
      +fIn('cf-val','Validade',base?base.validade:10,{req:true,type:'number',min:1,suf:'dias'})+fIn('cf-por','Elaborada por',base?base.por:'',{req:true})+'</div>'
      +'<div class="mp-g c2" style="margin-top:10px">'+fIn('cf-cont','Contato no cliente <i class="op">(Opcional)</i>',base?base.contato:'')+fIn('cf-fone','Fone <i class="op">(Opcional)</i>',base?base.fone:'')+'</div>'
      +'<div class="mp-cot-fh"><span class="mp-sec-n">Itens</span><span class="sp"></span><button class="mp-add-sku" type="button" onclick="MP.cotItAdd()"><i class="ti ti-plus"></i>Item</button></div>'
      +'<div class="mp-f" data-f="cf-itens"><table class="mp-cot-ed"><thead><tr><th>Descrição <b>*</b></th><th>Qtd na caixa</th><th>Ped. mín. por sabor</th>'
      +FAIXAS.map(function(f,k){ return '<th title="'+f[2]+'">'+f[0]+(k===0?' <b>*</b>':'')+'<small>'+f[1]+'</small></th>'; }).join('')+'<th></th></tr></thead><tbody id="cf-it">'
      +itens.map(itRowHTML).join('')+'</tbody></table></div>'
      +'<div class="mp-cot-hint">'+(baseId&&base?'Itens copiados da cotação '+esc(base.numero)+'.':'Itens vindos dos SKUs do cliente'+(base?'; preços da cotação '+esc(base.numero)+' quando o item é o mesmo.':'.'))+'</div>'
      +'<div style="margin-top:10px">'+fIn('cf-info','Informações complementares <i class="op">(Opcional)</i>',base?base.info:INFO_PAD,{area:true})+'</div>'
      +'<div class="mp-sec-n" style="margin:14px 0 6px">Condições</div>'
      +'<div class="mp-g c5">'+fSel('cf-frete','Frete',[['CIF','CIF'],['FOB','FOB (retirada)']],cd.frete,{req:true})+fIn('cf-desc','Desc. retirada <i class="op">(Opcional)</i>',cd.descRet,{suf:'%'})
      +fIn('cf-ent','Entrega',cd.entrega,{req:true})+fIn('cf-pag','Pagamento',cd.pagto,{req:true})+fIn('cf-prazo','Prazo',cd.prazo,{req:true})+'</div>'
      +'<div class="mp-sec-n" style="margin:14px 0 6px">Embalagens</div>'
      +'<table class="mp-cot-emb"><thead><tr><th></th><th>Descrição</th><th>Fornecida por</th></tr></thead><tbody>'+EMB_ROWS.map(embRow).join('')+'</tbody></table>'
      +'<div style="margin-top:12px">'+fIn('cf-obs','Observações <i class="op">(Opcional)</i>',base&&base.obs?base.obs:OBS_PAD,{area:true})+'</div>'
      +'</div><div id="cf-prev" style="display:none"></div>'
      +'<div class="mp-cot-hint" style="margin-top:8px">“Salvar como enviada” coloca a cotação em Enviadas'+(L.some(function(c){return cotStatus(c,cotDe(cliId))==='Enviada';})?' e marca a anterior em aberto como substituída':'')+'.</div>';
    CF={cliId:cliId};
    var ov=abrirModal('Criar cotação · '+esc(cli.nome),'ti-file-plus',b,function(){ MP.cotSalvarCriada(); },'Salvar como enviada');
    ov.querySelector('.mp-mod').classList.add('mp-mod-xl');
    var obsEl=document.getElementById('cf-obs'); if(obsEl) obsEl.rows=6;
    var sv=ov.querySelector('#mp-salvar');
    sv.insertAdjacentHTML('beforebegin','<button class="mp-btn gho" type="button" id="cf-pv-btn" onclick="MP.cotPrevia()"><i class="ti ti-eye"></i>Pré-visualizar</button>'
      +'<button class="mp-btn gho" type="button" id="cf-pdf-btn" onclick="MP.cotGerarPdf()"><i class="ti ti-file-download"></i>Gerar PDF</button>');
  }
  function formAnexar(cliId, arq){
    var cli=cliById(cliId); if(!cli) return; var base=cotOrd(cliId)[0];
    var b='<div class="mp-cot-file"><i class="ti ti-file-type-pdf"></i><span class="nm">'+esc(arq.nome)+'</span><span class="tm">'+kb(arq.tam)+'</span></div>'
      +'<div class="mp-g c4">'+fIn('cf-num','Nº da cotação',proxNumero(),{req:true})+fIn('cf-data','Data de envio',hojeIso(),{req:true,type:'date'})
      +fIn('cf-val','Validade',10,{req:true,type:'number',min:1,suf:'dias'})+fIn('cf-por','Elaborada por',base?base.por:'',{req:true})+'</div>'
      +'<div class="mp-g c2" style="margin-top:10px">'+fIn('cf-cont','Contato no cliente <i class="op">(Opcional)</i>',base?base.contato:'')+fIn('cf-nota','Nota <i class="op">(Opcional)</i>','')+'</div>'
      +'<div class="mp-cot-hint" style="margin-top:8px">Cotação feita fora do HUB: os itens e preços ficam no PDF. Ela entra em Enviadas.</div>';
    abrirModal('Anexar PDF · '+esc(cli.nome),'ti-paperclip',b,function(){
      var req=['cf-num','cf-data','cf-val','cf-por'].filter(function(id){ return !v(id); });
      if(req.length){ marcaErro(req,'Preencha os campos obrigatórios.'); return; }
      salvarEnviada(cliId,{numero:v('cf-num'),data:v('cf-data'),validade:parseInt(v('cf-val'),10)||10,por:v('cf-por'),contato:v('cf-cont'),nota:v('cf-nota'),
        itens:[],origem:'anexada',arquivo:{nome:arq.nome,tam:arq.tam,data:arq.data}});
    },'Salvar em enviadas');
  }
  function salvarEnviada(cliId,d){
    var reg=cotReg(cliId), mudou=[];
    reg.lista.forEach(function(c){ if(c.id!==reg.ativa && (!c.st||c.st==='enviada') && !cotVencida(c)){ c.st='substituida'; mudou.push(c); } });
    var novo=Object.assign({id:uid('cot'),st:'enviada',origem:'gerada',criado:new Date().toISOString()},d);
    if(!novo.arquivo) novo.arquivo={nome:arqNome(novo.numero,cliById(cliId)),tam:0};
    reg.lista.push(novo);
    if(!cotSave()){ reg.lista.pop(); mudou.forEach(function(c){ c.st='enviada'; }); marcaErro([],'Sem espaço para guardar no navegador. Use um PDF menor ou exclua cotações antigas.'); return false; }
    CF=null; fecharModal(); S.nTab='enviadas'; refreshPanel(); toastMsg('Cotação '+novo.numero+' salva em Enviadas'); return true;
  }
  function refreshPanel(){ var p=document.getElementById('mp-panel'); if(p) p.innerHTML=painelHTML(); else rerender(); }
  function hasPalete(s){ return !!(s && s.palete && s.palete.modelo); }
  function actsHTML(id, opt){
    var s=load().skus.find(function(x){return x.id===id;});
    var on=hasPalete(s);
    var del=opt&&opt.discreto?'':' del';
    return '<div class="mp-acts">'
      +'<button class="mp-act'+(on?' set':'')+'" title="Configuração do palete" onclick="event.stopPropagation();MP.abrirPalete(\''+esc(id)+'\')"><i class="ti ti-box"></i></button>'
      +'<button class="mp-act" title="Editar SKU" onclick="MP.editarSku(\''+esc(id)+'\')"><i class="ti ti-pencil"></i></button>'
      +'<button class="mp-act'+del+'" title="Excluir SKU" onclick="MP.excluirSku(\''+esc(id)+'\')"><i class="ti ti-trash"></i></button></div>';
  }
  function refreshClientes(){
    var l=document.getElementById('mp-list'), p=document.getElementById('mp-panel');
    if(l&&p){ l.innerHTML=listaHTML(); p.innerHTML=painelHTML(); } else rerender();
  }

  // ── SKUs ──
  var SK_COLS=[['criado','Criado'],['codigo','Código'],['nome','Produto'],['cliente','Cliente'],['linha','Linha'],['empacotamento','Empacotamento'],['caixa','Caixa']];
  function skAcc(s,c){ if(c==='cliente'){ var k=cliById(s.clienteId); return k?k.nome:''; } return s[c]==null?'':s[c]; }
  function skFiltrados(){
    var q=norm(S.skBusca);
    var L=load().skus.filter(function(s){
      if(S.skLinha && s.linha!==S.skLinha) return false;
      if(q){ var k=cliById(s.clienteId); if(norm([s.codigo,s.nome,s.linha,s.empacotamento,s.caixa,k?k.nome:''].join(' ')).indexOf(q)<0) return false; }
      return true; });
    var so=S.skSort;
    L.sort(function(a,b){ var x=skAcc(a,so.c), y=skAcc(b,so.c);
      return String(x).localeCompare(String(y),'pt-BR',{numeric:true,sensitivity:'base'})*so.d; });
    return L;
  }
  function skusHTML(){
    return '<div id="mp-sktab">'+skTabelaHTML()+'</div>';
  }
  function skTabelaHTML(){
    var L=skFiltrados();
    var th=sortTh(SK_COLS,S.skSort,'MP.skSort')+'<th></th>';
    var body=L.length?L.map(function(s){ var k=cliById(s.clienteId);
      return '<tr data-id="'+esc(s.id)+'"><td class="mu">'+fmtDt(s.criado)+'</td><td class="mu">'+esc(s.codigo||'—')+'</td><td class="pr">'+esc(s.nome)+'</td>'
        +'<td>'+(k?'<button class="lk" onclick="MP.abrirCliente(\''+esc(k.id)+'\')">'+esc(k.nome)+'</button>':'<span class="mu">—</span>')+'</td>'
        +'<td class="mu">'+esc(s.linha)+'</td><td>'+esc(s.empacotamento||'—')+'</td><td class="mu">'+esc(s.caixa||'—')+'</td><td>'+actsHTML(s.id)+'</td></tr>'; }).join('')
      :'<tr><td colspan="8"><div class="mp-empty"><i class="ti ti-search"></i>Nenhum SKU para esse filtro.</div></td></tr>';
    return '<div class="mp-tw"><table class="mp-t"><thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table></div>';
  }
  function refreshSkus(){ var t=document.getElementById('mp-sktab'); if(t) t.innerHTML=skTabelaHTML(); else rerender(); }

  // ── Modal genérico ──
  function abrirModal(titulo, icone, corpo, onSalvar, rotSalvar, opts){
    opts=opts||{};
    fecharModal();
    var ov=document.createElement('div'); ov.className='mp-ov mp-wrap'; ov.id='mp-modal';
    var foot=opts.ro
      ?'<div class="mp-mod-f"><button class="mp-btn gho" data-x="1">Fechar</button></div>'
      :'<div class="mp-mod-f"><button class="mp-btn gho" data-x="1">Cancelar</button><button class="mp-btn pri" id="mp-salvar"><i class="ti ti-check"></i>'+(rotSalvar||'Salvar')+'</button></div>';
    ov.innerHTML='<div class="mp-mod" role="dialog" aria-modal="true"><div class="mp-mod-h"><h3><i class="ti '+icone+'"></i>'+titulo+'</h3><button class="mp-x" title="Fechar" data-x="1">&times;</button></div>'
      +'<div class="mp-mod-b">'+corpo+'<div class="mp-err" id="mp-err"></div></div>'
      +foot+'</div>';
    ov.addEventListener('mousedown',function(e){ if(e.target===ov) ov._down=true; });
    ov.addEventListener('click',function(e){ if((e.target===ov&&ov._down)||(e.target.closest&&e.target.closest('[data-x]'))) fecharModal(); ov._down=false; });
    var sav=ov.querySelector('#mp-salvar'); if(sav) sav.onclick=onSalvar;
    var limpaErro=function(e){ var f=e.target.closest&&e.target.closest('.mp-f.err'); if(f&&String(e.target.value).trim()){ f.classList.remove('err');
      if(!ov.querySelector('.mp-f.err')){ var m=ov.querySelector('#mp-err'); if(m) m.textContent=''; } } };
    ov.addEventListener('input',limpaErro); ov.addEventListener('change',limpaErro);
    document.body.appendChild(ov);
    var f=ov.querySelector('input,select,textarea'); if(f) setTimeout(function(){ try{f.focus();}catch(e){} },30);
    document.addEventListener('keydown', escKey);
    return ov;
  }
  function escKey(e){ if(e.key==='Escape') fecharModal(); }
  function fecharModal(){ var o=document.getElementById('mp-modal'); if(o) o.remove(); document.removeEventListener('keydown', escKey); PAL_RO=false; }
  function fIn(id,rot,val,opt){ opt=opt||{};
    var ctl=opt.area?'<textarea class="mp-in" id="'+id+'" placeholder="'+esc(opt.ph||'')+'">'+esc(val||'')+'</textarea>'
      :'<input class="mp-in" id="'+id+'" type="'+(opt.type||'text')+'"'+(opt.min!=null?' min="'+opt.min+'"':'')+' placeholder="'+esc(opt.ph||'')+'" value="'+esc(val==null?'':val)+'">';
    if(opt.suf) ctl='<div class="mp-suf">'+ctl+'<em>'+opt.suf+'</em></div>';
    return '<label class="mp-f" data-f="'+id+'"><span>'+rot+(opt.req?' <b>*</b>':'')+'</span>'+ctl+'</label>'; }
  function fSel(id,rot,lista,val,opt){ opt=opt||{};
    return '<label class="mp-f" data-f="'+id+'"><span>'+rot+(opt.req?' <b>*</b>':'')+'</span><select class="mp-sel" id="'+id+'"'+(opt.on?' onchange="'+opt.on+'"':'')+'>'+(opt.vazio!=null?'<option value="">'+esc(opt.vazio)+'</option>':'')
      +lista.map(function(o){ var v=Array.isArray(o)?o[0]:o, r=Array.isArray(o)?o[1]:o; return '<option value="'+esc(v)+'"'+(String(v)===String(val==null?'':val)?' selected':'')+'>'+esc(r)+'</option>'; }).join('')+'</select></label>'; }
  function v(id){ var e=document.getElementById(id); return e?String(e.value).trim():''; }
  function marcaErro(ids,msg){
    document.querySelectorAll('#mp-modal .mp-f.err').forEach(function(x){x.classList.remove('err');});
    ids.forEach(function(id){ var l=document.querySelector('#mp-modal .mp-f[data-f="'+id+'"]'); if(l) l.classList.add('err'); });
    var e=document.getElementById('mp-err'); if(e) e.textContent=msg||'';
  }

  // ── Form de cliente ──
  function formCliente(id){
    var c=id?cliById(id):null;
    var d=c||{codigo:'',nome:'',razao:'',cidade:'',estado:'',materiaPrima:'Klain',notaCobranca:'Nota de Venda',frequencia:'Mensal',prazoDias:'',pedidoMin:'',situacao:'Ativo',
      etiqueta:{tipo:'Com Etiqueta',resp:'Não se aplica',notas:''},bobina:{tipo:'Lisa - Transparente',resp:'Klain',notas:''},caixa:{tipo:'Klain',resp:'Klain',notas:''},info:''};
    var b='<div class="mp-sec">Dados do cliente</div>'
      +'<div class="mp-g c3">'+fIn('mpf-codigo','Código do cliente',d.codigo)+fIn('mpf-nome','Nome',d.nome,{req:1})+fIn('mpf-razao','Razão social',d.razao)+'</div>'
      +'<div class="mp-g c3">'+fSel('mpf-estado','Estado',OPT.estado,d.estado,{req:1,vazio:'Selecione...'})+fIn('mpf-cidade','Cidade',d.cidade)+fSel('mpf-situacao','Situação',OPT.situacao,d.situacao)+'</div>'
      +'<div class="mp-g c3">'+fSel('mpf-mp','Matéria-prima',OPT.materiaPrima,d.materiaPrima)+fSel('mpf-nota','Nota de cobrança',OPT.notaCobranca,d.notaCobranca)+fSel('mpf-freq','Frequência de pedidos',OPT.frequencia,d.frequencia)+'</div>'
      +'<div class="mp-g c3">'+fIn('mpf-prazo','Prazo de entrega',d.prazoDias,{type:'number',min:0,suf:'dias'})+fIn('mpf-min','Pedido mínimo',d.pedidoMin,{type:'number',min:0,suf:'cx'})+'<span></span></div>'
      +'<div class="mp-sec">Etiqueta</div><div class="mp-g c3">'+fSel('mpf-et-t','Etiqueta',OPT.etiquetaTipo,d.etiqueta.tipo)+fSel('mpf-et-r','Responsável compra',OPT.responsavel,d.etiqueta.resp)+fSel('mpf-et-n','Notas',OPT.etiquetaNotas,d.etiqueta.notas,{vazio:'—'})+'</div>'
      +'<div class="mp-sec">Bobina</div><div class="mp-g c3">'+fSel('mpf-bo-t','Bobina',OPT.bobinaTipo,d.bobina.tipo)+fSel('mpf-bo-r','Responsável compra',OPT.responsavel,d.bobina.resp)+fSel('mpf-bo-n','Notas',OPT.bobinaNotas,d.bobina.notas,{vazio:'—'})+'</div>'
      +'<div class="mp-sec">Caixa / Fardo</div><div class="mp-g c3">'+fSel('mpf-cx-t','Caixa / Fardo',OPT.caixaTipo,d.caixa.tipo)+fSel('mpf-cx-r','Responsável compra',OPT.responsavel,d.caixa.resp)+fSel('mpf-cx-n','Notas',OPT.caixaNotas,d.caixa.notas,{vazio:'—'})+'</div>'
      +'<div class="mp-g">'+fIn('mpf-info','Informações operacionais',d.info,{area:1,ph:'Observações sobre embalagem, entrega, sistema...'})+'</div>';
    abrirModal(c?'Editar cliente':'Novo cliente','ti-user-plus',b,function(){
      var nome=v('mpf-nome'), uf=v('mpf-estado'), falta=[];
      if(!nome) falta.push('mpf-nome'); if(!uf) falta.push('mpf-estado');
      if(falta.length){ marcaErro(falta,'Preencha os campos obrigatórios (*).'); return; }
      var cod=v('mpf-codigo');
      if(cod && load().clientes.some(function(x){return x.codigo===cod && (!c||x.id!==c.id);})){ marcaErro(['mpf-codigo'],'Já existe um cliente com esse código.'); return; }
      var num=function(id){ var x=v(id); return x===''?'':Math.max(0,parseInt(x,10)||0); };
      var o={codigo:cod,nome:nome,razao:v('mpf-razao'),cidade:v('mpf-cidade'),estado:uf,situacao:v('mpf-situacao'),materiaPrima:v('mpf-mp'),
        notaCobranca:v('mpf-nota'),frequencia:v('mpf-freq'),prazoDias:num('mpf-prazo'),pedidoMin:num('mpf-min'),
        etiqueta:{tipo:v('mpf-et-t'),resp:v('mpf-et-r'),notas:v('mpf-et-n')},bobina:{tipo:v('mpf-bo-t'),resp:v('mpf-bo-r'),notas:v('mpf-bo-n')},
        caixa:{tipo:v('mpf-cx-t'),resp:v('mpf-cx-r'),notas:v('mpf-cx-n')},info:v('mpf-info'),atualizado:new Date().toISOString()};
      if(c){ Object.assign(c,o); } else { o.id=uid('mpc'); load().clientes.push(o); c=o; }
      save(); fecharModal(); S.tab='clientes'; S.sel=c.id;
      // garante que o cliente salvo apareça na lista (limpa filtros que o esconderiam)
      if(!filtrados().some(function(x){return x.id===c.id;})){ S.busca=''; S.f={}; }
      rerender(); toastMsg(id?'Cliente atualizado':'Cliente cadastrado');
    }, c?'Salvar':'Salvar cliente');
  }

  // ── Form de SKU (com Configuração do Palete) ──
  var PAL=null;   // rascunho do palete enquanto o modal está aberto
  var PAL_DIRECT=false; // true quando o modal é só a configuração do palete
  var PAL_RO=false;     // true = visualização somente leitura (Terceiros reusa este modal)
  function palDraft(src){
    PAL={on:!!(src&&src.modelo), modelo:(src&&src.modelo)||OPT.paleteModelo[0], lastros:(src&&src.lastros)||7,
      orientacao:(src&&src.orientacao||[]).slice(), chapas:(src&&src.chapas||[]).slice()};
    palAjusta(PAL.lastros);
    if(!PAL.on){ PAL.chapas[0]=1; if(PAL.lastros>1) PAL.chapas[1]=1; }
  }
  function palValor(){
    return PAL.on?{modelo:PAL.modelo,lastros:PAL.lastros,orientacao:PAL.orientacao.slice(),chapas:PAL.chapas.map(function(n){return Math.max(0,parseInt(n,10)||0);})}:null;
  }
  function palResumo(p){ if(!p||!p.modelo) return 'Não configurado';
    var ch=[]; (p.chapas||[]).forEach(function(n,i){ if(+n>0) ch.push((i===0?'Palete–L1':'L'+i+'–L'+(i+1))+(+n>1?' ×'+n:'')); });
    return p.modelo+' · '+p.lastros+' lastro'+(p.lastros===1?'':'s')+(ch.length?' · chapas: '+ch.join(', '):' · sem chapas'); }
  function palAjusta(n){ n=Math.max(1,Math.min(15,parseInt(n,10)||1)); PAL.lastros=n;
    PAL.orientacao=(PAL.orientacao||[]).slice(0,n); while(PAL.orientacao.length<n) PAL.orientacao.push('Meio');
    PAL.chapas=(PAL.chapas||[]).slice(0,n); while(PAL.chapas.length<n) PAL.chapas.push(0); }
  function palBodyHTML(){
    var p=PAL;
    var ori=p.orientacao.map(function(o,i){ return '<label>L'+(i+1)+'<select class="mp-sel" data-ori="'+i+'" onchange="MP.palOri('+i+',this.value)">'+selOpts(OPT.orientacao,o)+'</select></label>'; }).join('');
    var chp=p.chapas.map(function(n,i){ return '<label><input class="mp-in" type="number" min="0" max="9" value="'+(+n||0)+'" data-chp="'+i+'" oninput="MP.palChp('+i+',this.value)">'+(i===0?'Palete–L1':'L'+i+'–L'+(i+1))+'</label>'; }).join('');
    var vz=[];
    vz.push('<div class="pb"></div>');
    for(var i=0;i<p.lastros;i++){ for(var k=0;k<(+p.chapas[i]||0);k++) vz.push('<div class="ch"></div>'); vz.push('<div class="ls"><i class="'+esc(p.orientacao[i])+'"></i></div>'); }
    return '<div><div class="mp-g c2" style="margin-bottom:8px">'+fSel('mpp-modelo','Modelo de palete',OPT.paleteModelo,p.modelo,{on:'MP.palModelo(this.value)'})
      +fIn('mpp-lastros','Número de lastros',p.lastros,{type:'number',min:1})+'</div>'
      +'<div class="mp-f" style="margin-bottom:6px"><span>Orientação por lastro <span style="font-weight:400">(posição da fileira de 3)</span></span></div>'
      +'<div class="mp-qk"><button type="button" onclick="MP.palTodos(\'Meio\')">Todos Meio</button><button type="button" onclick="MP.palTodos(\'Direita\')">Todos Direita</button><button type="button" onclick="MP.palTodos(\'Esquerda\')">Todos Esquerda</button><button type="button" onclick="MP.palTodos(\'alt\')">Alternado</button></div>'
      +'<div class="mp-ori">'+ori+'</div>'
      +'<div class="mp-f" style="margin:10px 0 6px"><span>Folhas de papelão</span></div><div class="mp-chp">'+chp+'</div></div>'
      +'<div><div class="mp-viz">'+vz.join('')+'</div><div class="mp-viz-l">vista lateral</div></div>';
  }
  function palRefresh(){ var b=document.getElementById('mp-pal-b'), s=document.getElementById('mp-pal-s');
    if(b) b.innerHTML=palBodyHTML(); if(s) s.textContent=palResumo(PAL&&PAL.on?PAL:null);
    var l=document.getElementById('mpp-lastros'); if(l) l.onchange=function(){ if(this.value==='') return; palAjusta(this.value); palRefresh(); };
    if(PAL_RO){
      var ov=document.getElementById('mp-modal');
      if(ov){ ov.querySelectorAll('select,input,textarea,.mp-qk button').forEach(function(el){ el.disabled=true; });
        var q=ov.querySelector('.mp-qk'); if(q) q.style.display='none'; }
    }
  }
  function formSku(id, clienteId){
    var s=id?load().skus.find(function(x){return x.id===id;}):null;
    var d=s||{clienteId:clienteId||'',linha:'',empacotamento:'Etiqueta',codigo:'',nome:'',gramagem:'',caixa:'',palete:null};
    var clis=load().clientes.slice().sort(function(a,b){return a.nome.localeCompare(b.nome,'pt-BR');}).map(function(c){return [c.id,(c.codigo?c.codigo+' · ':'')+c.nome];});
    var linhas=OPT.linha.slice(); if(d.linha && linhas.indexOf(d.linha)<0) linhas.push(d.linha);
    var b='<div class="mp-g">'+fSel('mps-cli','Cliente',clis,d.clienteId,{req:1,vazio:'Selecione...'})+'</div>'
      +'<div class="mp-g c3">'+fIn('mps-codigo','Código',d.codigo,{ph:'Ex: 44120'})+'<div style="grid-column:span 2">'+fIn('mps-nome','Nome do produto',d.nome,{req:1,ph:'Ex: Pão de Mel com Chocolate ao Leite 250g'})+'</div></div>'
      +'<div class="mp-g c3">'+fIn('mps-gram','Gramagem',d.gramagem,{ph:'Ex: 250g'})+fSel('mps-linha','Linha',linhas,d.linha,{req:1,vazio:'Selecione...'})+fSel('mps-emp','Empacotamento',OPT.empacotamento,d.empacotamento)+'</div>'
      +'<div class="mp-g">'+fIn('mps-caixa','Caixa / Modelo',d.caixa,{ph:'Ex: mod. 810, Fardo, Própria'})+'</div>';
    abrirModal(s?'Editar SKU':'Novo SKU','ti-package',b,function(){
      var falta=[]; if(!v('mps-cli')) falta.push('mps-cli'); if(!v('mps-linha')) falta.push('mps-linha'); if(!v('mps-nome')) falta.push('mps-nome');
      if(falta.length){ marcaErro(falta,'Preencha os campos obrigatórios (*).'); return; }
      var cod=v('mps-codigo');
      if(cod && load().skus.some(function(x){return x.codigo===cod && (!s||x.id!==s.id);})){ marcaErro(['mps-codigo'],'Já existe um SKU com esse código.'); return; }
      var o={clienteId:v('mps-cli'),codigo:cod,nome:v('mps-nome'),gramagem:v('mps-gram'),linha:v('mps-linha'),empacotamento:v('mps-emp'),caixa:v('mps-caixa')};
      if(s) Object.assign(s,o); // não mexe no palete — ele só muda pelo ícone/modal dedicado
      else { o.id=uid('mps'); o.criado=new Date().toISOString(); o.palete=null; load().skus.push(o); s=o; }
      var cl=cliById(s.clienteId); if(cl) cl.atualizado=new Date().toISOString();
      save(); fecharModal(); rerender(); toastMsg(id?'SKU atualizado':'SKU cadastrado');
    }, s?'Salvar':'Salvar SKU');
  }

  // ── Configuração do palete (modal direto, a partir da tabela) ──
  function refreshAposSku(){
    if(S.tab==='skus') refreshSkus(); else refreshClientes();
  }
  function formPalete(id){
    var s=load().skus.find(function(x){return x.id===id;}); if(!s) return;
    palDraft(s.palete); PAL_DIRECT=true; PAL.on=true;
    var sub=(s.codigo?s.codigo+' · ':'')+s.nome;
    var b='<div class="mp-pal-sku">'+esc(sub)+'</div>'
      +'<div class="mp-pal open" id="mp-pal"><div class="mp-pal-b" id="mp-pal-b"></div>'
      +'<div id="mp-pal-rm" style="margin-top:8px"><button type="button" class="mp-limpar" onclick="MP.palRemover()">Remover configuração do palete</button></div></div>'
      +'<div id="mp-pal-off" class="mp-pal-off" style="display:none">Esta configuração será removida ao confirmar.<button type="button" class="mp-limpar" onclick="MP.palRestaurar()">Configurar novamente</button></div>';
    abrirModal('Configuração do palete','ti-box',b,function(){
      s.palete=palValor();
      var cl=cliById(s.clienteId); if(cl) cl.atualizado=new Date().toISOString();
      save(); fecharModal(); PAL=null; PAL_DIRECT=false;
      refreshAposSku(); toastMsg(s.palete?'Configuração do palete salva':'Configuração do palete removida');
    }, 'Confirmar configuração');
    palRefresh();
  }
  function palDirectUI(){
    var p=document.getElementById('mp-pal'), off=document.getElementById('mp-pal-off');
    if(p) p.style.display=PAL.on?'':'none';
    if(off) off.style.display=PAL.on?'none':'';
    if(PAL.on){ var pal=document.getElementById('mp-pal'); if(pal) pal.classList.add('open'); palRefresh(); }
  }

  // ── Exclusões (com confirmação) ──
  function confirma(t,m,ok){
    if(typeof confirmModal==='function') confirmModal({title:t,message:m,confirmLabel:'Excluir',danger:true,icon:'ti-trash',onConfirm:ok});
    else if(window.confirm(m)) ok();
  }
  function escMsg(s){ return esc(s); }

  // ── API pública (onclicks) ──
  window.MP={
    render:render,
    setTab:function(t){ S.tab=(t==='skus')?'skus':(t==='contagem'&&window.CTG)?'contagem':'clientes'; S.fOpen=false; S.skFOpen=false; rerender(); },
    setPTab:function(t){ S.pTab=(t==='embalagem'||t==='skus'||t==='negociacao')?t:'dados'; var p=document.getElementById('mp-panel'); if(p) p.innerHTML=painelHTML(); else rerender(); },
    sel:function(id){ S.sel=id; refreshClientes(); },
    abrirCliente:function(id){ S.tab='clientes'; S.sel=id; S.fOpen=false; S.skFOpen=false; if(!filtrados().some(function(x){return x.id===id;})){ S.busca=''; S.f={}; } rerender();
      var el=document.querySelector('.mp-cli.on'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'nearest'}); },
    buscaEl:function(el){ MP.busca(el?el.value:''); },
    busca:function(q){ S.busca=q; var L=filtrados(); if(L.length && !L.some(function(c){return c.id===S.sel;})) S.sel=L[0].id; refreshClientes(); },
    toggleFiltro:function(){ S.fOpen=!S.fOpen; S.skFOpen=false; var w=document.getElementById('mp-fwrap'); if(!w){ rerender(); return; }
      var p=w.querySelector('.mp-fpop'); if(p) p.remove(); if(S.fOpen) w.insertAdjacentHTML('beforeend', filtroPopHTML('cli')); },
    filtro:function(k,val){ S.f[k]=val; var L=filtrados(); if(L.length && !L.some(function(c){return c.id===S.sel;})) S.sel=L[0].id; refreshClientes(); syncFunil('mp-fwrap', nFiltros()>0, 'MP.limparFiltros()'); },
    limparFiltros:function(){ S.f={}; var L=filtrados(); if(L.length && !L.some(function(c){return c.id===S.sel;})) S.sel=L[0].id; refreshClientes();
      document.querySelectorAll('#mp-fwrap .mp-fsel').forEach(function(s){ s.value=''; }); syncFunil('mp-fwrap', false, 'MP.limparFiltros()'); },
    limpar:function(){ S.busca=''; S.f={}; S.fOpen=false; rerender(); },
    skBuscaEl:function(el){ MP.skBusca(el?el.value:''); },
    skBusca:function(q){ S.skBusca=q; refreshSkus(); },
    toggleSkFiltro:function(){ S.skFOpen=!S.skFOpen; S.fOpen=false; var w=document.getElementById('mp-skfwrap'); if(!w){ rerender(); return; }
      var p=w.querySelector('.mp-fpop'); if(p) p.remove(); if(S.skFOpen) w.insertAdjacentHTML('beforeend', filtroPopHTML('sku')); },
    skLinha:function(l){ S.skLinha=l; refreshSkus(); syncFunil('mp-skfwrap', !!S.skLinha, 'MP.limparSkFiltro()'); },
    limparSkFiltro:function(){ S.skLinha=''; refreshSkus();
      document.querySelectorAll('#mp-skfwrap .mp-fsel').forEach(function(s){ s.value=''; }); syncFunil('mp-skfwrap', false, 'MP.limparSkFiltro()'); },
    skSort:function(c){ if(S.skSort.c===c) S.skSort.d*=-1; else S.skSort={c:c,d:(c==='criado'?-1:1)}; refreshSkus(); },
    cliSort:function(c){ if(S.cliSort.c===c) S.cliSort.d*=-1; else S.cliSort={c:c,d:1}; var l=document.getElementById('mp-list'); if(l) l.innerHTML=listaHTML(); else refreshClientes(); },
    pSkSort:function(c){ if(S.pSkSort.c===c) S.pSkSort.d*=-1; else S.pSkSort={c:c,d:1}; var p=document.getElementById('mp-panel'); if(p) p.innerHTML=painelHTML(); else rerender(); },
    novoCliente:function(){ formCliente(null); },
    editarCliente:function(id){ formCliente(id); },
    excluirCliente:function(id){ var c=cliById(id); if(!c) return; var n=skusDe(id).length;
      confirma('Excluir cliente','Excluir "'+escMsg(c.nome)+'"?'+(n?'\n\nOs '+n+' SKU'+(n===1?'':'s')+' vinculado'+(n===1?'':'s')+' também serão excluídos.':'')+'\n\nEssa ação não pode ser desfeita.',function(){
        DB.clientes=DB.clientes.filter(function(x){return x.id!==id;}); DB.skus=DB.skus.filter(function(x){return x.clienteId!==id;});
        save(); if(S.sel===id) S.sel=null; rerender(); toastMsg('Cliente excluído'); }); },
    novoSku:function(cid){ formSku(null, cid||(S.tab==='clientes'?S.sel:'')); },
    editarSku:function(id){ formSku(id); },
    abrirPalete:function(id){ formPalete(id); },
    /* Visualização somente leitura — usada por Terceiros (mesmo modal e CSS). */
    verPalete:function(palete, label){
      palDraft(palete||null); PAL_DIRECT=true; PAL.on=!!(palete && palete.modelo);
      var b='<div class="mp-pal-sku">'+esc(label||'')+'</div>';
      if(PAL.on) b+='<div class="mp-pal open" id="mp-pal"><div class="mp-pal-b" id="mp-pal-b"></div></div>';
      else b+='<div class="mp-pal-off"><i class="ti ti-box" style="font-size:28px"></i>Este item ainda não tem configuração de palete.</div>';
      abrirModal('Configuração do palete','ti-box',b,null,'',{ro:true});
      PAL_RO=true; PAL_DIRECT=true; // abrirModal chama fecharModal, que zera as flags
      if(PAL.on) palRefresh();
    },
    excluirSku:function(id){ var s=load().skus.find(function(x){return x.id===id;}); if(!s) return;
      confirma('Excluir SKU','Excluir o SKU "'+escMsg((s.codigo?s.codigo+' · ':'')+s.nome)+'"?\n\nEssa ação não pode ser desfeita.',function(){
        DB.skus=DB.skus.filter(function(x){return x.id!==id;}); save(); rerender(); toastMsg('SKU excluído'); }); },
    // palete
    palToggle:function(){ var p=document.getElementById('mp-pal'); if(!p) return; var abre=!p.classList.contains('open'); p.classList.toggle('open',abre);
      if(abre && !PAL.on){ PAL.on=true; var r=document.getElementById('mp-pal-rm'); if(r) r.style.display='block'; var a=document.getElementById('mp-pal-acao'); if(a) a.textContent=''; palRefresh(); } },
    palRemover:function(){ PAL.on=false;
      if(PAL_DIRECT){ palDirectUI(); return; }
      var p=document.getElementById('mp-pal'); if(p) p.classList.remove('open'); var r=document.getElementById('mp-pal-rm'); if(r) r.style.display='none';
      var a=document.getElementById('mp-pal-acao'); if(a) a.textContent='Configurar'; palRefresh(); },
    palRestaurar:function(){ PAL.on=true; palDirectUI(); },
    palModelo:function(m){ PAL.modelo=m; palRefresh(); },
    palOri:function(i,o){ PAL.orientacao[i]=o; palRefresh(); },
    palChp:function(i,n){ PAL.chapas[i]=Math.max(0,Math.min(9,parseInt(n,10)||0)); var s=document.getElementById('mp-pal-s'); if(s) s.textContent=palResumo(PAL);
      var vz=document.querySelector('#mp-pal-b .mp-viz'); if(vz){ var tmp=document.createElement('div'); tmp.innerHTML=palBodyHTML(); var nv=tmp.querySelector('.mp-viz'); if(nv) vz.innerHTML=nv.innerHTML; } },
    palTodos:function(o){ PAL.orientacao=PAL.orientacao.map(function(_,i){ return o==='alt'?(i%2?'Direita':'Esquerda'):o; }); palRefresh(); },
    // negociação
    negTab:function(t){ S.nTab=t==='enviadas'?'enviadas':'ativa'; fecharMenu(); refreshPanel(); },
    cotCriar:function(cliId,baseId){ fecharMenu(); formCriar(cliId||S.sel, baseId); },
    cotPrevia:function(){ var f=document.getElementById('cf-form'), p=document.getElementById('cf-prev'); if(!f||!p||!CF) return;
      if(f.style.display==='none'){ cfForm(true); return; }
      var d=cfLer(); p.innerHTML=layoutHTML(d,cliById(CF.cliId)||{}); cfForm(false); var mb=document.querySelector('#mp-modal .mp-mod-b'); if(mb) mb.scrollTop=0; var ov=document.getElementById('mp-modal'); if(ov) ov.scrollTop=0; },
    cotGerarPdf:function(){ if(!CF) return; var d=cfLer(); if(!cfValida(d)) return; baixarPdf(d,cliById(CF.cliId)||{}); },
    cotSalvarCriada:function(){ if(!CF) return; var d=cfLer(); if(!cfValida(d)) return; salvarEnviada(CF.cliId,d); },
    cotAnexar:function(){ var i=document.getElementById('mp-cot-file'); if(i){ i.value=''; i.click(); } },
    cotArquivo:function(inp){ var f=inp&&inp.files&&inp.files[0]; if(!f||!S.sel) return; var cid=S.sel;
      if(!/pdf$/i.test(f.type||'') && !/\.pdf$/i.test(f.name||'')){ toastMsg('Anexe a cotação em PDF.'); inp.value=''; return; }
      if(f.size>COT_MAX){ toastMsg('PDF com '+kb(f.size)+' — o limite no protótipo é '+kb(COT_MAX)+'. Reduza o arquivo e tente de novo.'); inp.value=''; return; }
      var rd=new FileReader();
      rd.onload=function(){ inp.value=''; formAnexar(cid,{nome:f.name,tam:f.size,data:String(rd.result||'')}); };
      rd.onerror=function(){ toastMsg('Não foi possível ler o arquivo.'); };
      rd.readAsDataURL(f); },
    cotItAdd:function(){ var t=document.getElementById('cf-it'); if(!t) return; t.insertAdjacentHTML('beforeend',itRowHTML()); var l=t.lastElementChild.querySelector('input'); if(l) l.focus(); },
    cotItRm:function(btn){ var tr=btn&&btn.closest('tr'), t=document.getElementById('cf-it'); if(!tr||!t) return; if(t.children.length<=1){ tr.querySelectorAll('input').forEach(function(i){i.value='';}); return; } tr.remove(); },
    cotFechar:function(cliId,id){ fecharMenu(); var reg=cotReg(cliId), x=reg.lista.find(function(c){return c.id===id;}); if(!x) return;
      var ant=reg.lista.find(function(c){return c.id===reg.ativa;}), bk=JSON.stringify(reg);
      if(ant && ant.id!==id){ ant.st='encerrada'; ant.encerradaEm=hojeIso(); }
      x.st='fechada'; x.fechadaEm=hojeIso(); reg.ativa=id;
      if(!cotSave()){ COT.m[cliId]=JSON.parse(bk); return; }
      S.nTab='ativa'; refreshPanel(); toastMsg('Cotação '+x.numero+' marcada como fechada'+(ant&&ant.id!==id?' · '+ant.numero+' encerrada':'')); },
    cotSt:function(cliId,id,st){ fecharMenu(); var reg=cotReg(cliId), x=reg.lista.find(function(c){return c.id===id;}); if(!x) return;
      if(reg.ativa===id){ reg.ativa=null; x.fechadaEm=''; }
      x.st=st; cotSave(); refreshPanel(); toastMsg('Cotação '+x.numero+': '+(st==='recusada'?'recusada':(st==='encerrada'?'negociação encerrada':'voltou para enviada'))); },
    cotMenu:function(btn,cliId,id){ var aberto=document.getElementById('mp-cot-menu'); var mesmo=aberto&&aberto.getAttribute('data-id')===id; fecharMenu(); if(mesmo) return;
      var x=cotById(id); if(!x) return; var st=cotStatus(x.c,x.reg), q=function(s){ return '\''+esc(s)+'\''; };
      var it=function(ic,t,fn,cls){ return '<button type="button"'+(cls?' class="'+cls+'"':'')+' onclick="'+fn+'"><i class="ti ti-'+ic+'"></i>'+t+'</button>'; };
      var h=(st!=='Fechada'?it('circle-check','Marcar como fechada','MP.cotFechar('+q(cliId)+','+q(id)+')'):it('circle-minus','Encerrar negociação','MP.cotSt('+q(cliId)+','+q(id)+',\'encerrada\')'))
        +(st==='Enviada'||st==='Vencida'?it('circle-x','Marcar como recusada','MP.cotSt('+q(cliId)+','+q(id)+',\'recusada\')'):'')
        +(st==='Recusada'||st==='Substituída'||st==='Encerrada'?it('arrow-back-up','Voltar para enviada','MP.cotSt('+q(cliId)+','+q(id)+',\'enviada\')'):'')
        +(x.c.itens&&x.c.itens.length?it('copy','Nova cotação a partir desta','MP.cotCriar('+q(cliId)+','+q(id)+')'):'')
        +it('download','Baixar PDF','MP.cotBaixar('+q(id)+')')
        +'<hr>'+it('trash','Excluir','MP.cotExcluir('+q(cliId)+','+q(id)+')','dng');
      var m=document.createElement('div'); m.id='mp-cot-menu'; m.className='mp-cot-menu mp-wrap'; m.setAttribute('data-id',id); m.innerHTML=h; document.body.appendChild(m);
      var r=btn.getBoundingClientRect(), mw=m.offsetWidth, mh=m.offsetHeight;
      var top=r.bottom+4; if(top+mh>window.innerHeight-8) top=Math.max(8,r.top-mh-4);
      m.style.top=top+'px'; m.style.left=Math.max(8,r.right-mw)+'px';
      setTimeout(function(){ document.addEventListener('mousedown',menuFora,true); window.addEventListener('scroll',fecharMenu,true); },0); },
    cotExcluir:function(cliId,id){ fecharMenu(); var reg=cotDe(cliId), x=reg.lista.find(function(c){return c.id===id;}); if(!x) return;
      confirma('Excluir cotação','Excluir a cotação '+escMsg(x.numero)+'?'+(reg.ativa===id?'\n\nEla é a negociação ativa; o cliente fica sem negociação fechada.':'')+'\n\nEssa ação não pode ser desfeita.',function(){
        reg.lista=reg.lista.filter(function(c){return c.id!==id;}); if(reg.ativa===id) reg.ativa=null;
        cotSave(); refreshPanel(); toastMsg('Cotação excluída'); }); },
    cotVer:function(id){ fecharMenu(); var x=cotById(id); if(!x) return;
      if(x.c.arquivo&&x.c.arquivo.data){ try{ var u=URL.createObjectURL(dataUrlBlob(x.c.arquivo.data)); var w=window.open(u,'_blank'); if(!w) MP.cotBaixar(id); setTimeout(function(){ URL.revokeObjectURL(u); },60000); }catch(e){ toastMsg('Não foi possível abrir o PDF.'); } return; }
      var ov=abrirModal('Cotação '+esc(x.c.numero)+' · '+esc((cliById(x.cli)||{}).nome||''),'ti-file-invoice',layoutHTML(x.c,cliById(x.cli)||{}),function(){ MP.cotBaixar(id); },'Baixar PDF');
      ov.querySelector('.mp-mod').classList.add('mp-mod-xl'); var sv=ov.querySelector('#mp-salvar'); if(sv) sv.innerHTML='<i class="ti ti-download"></i>Baixar PDF';
      var cn=ov.querySelector('.mp-mod-f [data-x]'); if(cn) cn.textContent='Fechar'; },
    cotBaixar:function(id){ fecharMenu(); var x=cotById(id); if(!x) return;
      if(x.c.arquivo&&x.c.arquivo.data){ var a=document.createElement('a'); a.href=URL.createObjectURL(dataUrlBlob(x.c.arquivo.data)); a.download=x.c.arquivo.nome||arqNome(x.c.numero,cliById(x.cli));
        document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000); return; }
      baixarPdf(x.c,cliById(x.cli)||{},x.c.arquivo&&x.c.arquivo.nome); },
    _cotDb:function(){ return cotLoad(); },
    _cotPdfDoc:function(id){ var x=cotById(id); return x?pdfDoc(x.c,cliById(x.cli)||{}):null; },
    _cotReset:function(){ COT=cotSeed(); cotSave(); refreshPanel(); },
    // para testes/inspeção
    _db:function(){ return load(); },
    _reset:function(){ DB=seed(); save(); S.sel=null; rerender(); }
  };
})();
