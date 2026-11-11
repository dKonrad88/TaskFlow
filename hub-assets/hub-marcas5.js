/* ══ COMERCIAL › MARCAS PRÓPRIAS (hub-marcas5) ══
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
   · Dados no localStorage (chave taskflow_marcas_proprias), sempre via safeSetItem.
   · ⚠️ DADOS FICTÍCIOS: clientes, códigos e SKUs de exemplo foram inventados para o protótipo.
     As listas de opções (estados, frequências, bobina, notas, situação, empacotamento) são as do SisPro.
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
  var S={ tab:'clientes', pTab:'dados', sel:null, busca:'', f:{}, fOpen:false, skBusca:'', skLinha:'', skFOpen:false, skSort:{c:'criado',d:-1}, cliSort:{c:'nome',d:1}, pSkSort:{c:'codigo',d:1}, modal:null };

  // ── Render principal ──
  function render(main){
    main=main||document.getElementById('task-container'); if(!main) return;
    load();
    var nC=DB.clientes.length, nS=DB.skus.length;
    var acao='<span class="mp-head-acts" style="display:flex;gap:8px">'
      +'<button class="mp-btn gho" onclick="MP.novoSku()"><i class="ti ti-plus"></i><span>Novo SKU</span></button>'
      +'<button class="mp-btn pri" onclick="MP.novoCliente()"><i class="ti ti-plus"></i><span>Novo cliente</span></button></span>';
    var tabs='<div class="mp-tabs-row"><div class="mp-tabs">'
      +'<button class="mp-tab'+(S.tab==='clientes'?' on':'')+'" data-tab="clientes" onclick="MP.setTab(\'clientes\')"><i class="ti ti-building"></i>Clientes<span class="n">'+nC+'</span></button>'
      +'<button class="mp-tab'+(S.tab==='skus'?' on':'')+'" data-tab="skus" onclick="MP.setTab(\'skus\')"><i class="ti ti-barcode"></i>SKUs<span class="n">'+nS+'</span></button></div>'
      +'<div class="mp-tabs-tools">'+toolsHTML()+'</div></div>';
    var corpo='<div class="mp-wrap" id="mp-root">'+tabs+'<div id="mp-body">'+(S.tab==='skus'?skusHTML():clientesHTML())+'</div></div>';
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
    var tab=S.pTab==='embalagem'?'embalagem':(S.pTab==='skus'?'skus':'dados');
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
  function abrirModal(titulo, icone, corpo, onSalvar, rotSalvar){
    fecharModal();
    var ov=document.createElement('div'); ov.className='mp-ov mp-wrap'; ov.id='mp-modal';
    ov.innerHTML='<div class="mp-mod" role="dialog" aria-modal="true"><div class="mp-mod-h"><h3><i class="ti '+icone+'"></i>'+titulo+'</h3><button class="mp-x" title="Fechar" data-x="1">&times;</button></div>'
      +'<div class="mp-mod-b">'+corpo+'<div class="mp-err" id="mp-err"></div></div>'
      +'<div class="mp-mod-f"><button class="mp-btn gho" data-x="1">Cancelar</button><button class="mp-btn pri" id="mp-salvar"><i class="ti ti-check"></i>'+(rotSalvar||'Salvar')+'</button></div></div>';
    ov.addEventListener('mousedown',function(e){ if(e.target===ov) ov._down=true; });
    ov.addEventListener('click',function(e){ if((e.target===ov&&ov._down)||(e.target.closest&&e.target.closest('[data-x]'))) fecharModal(); ov._down=false; });
    ov.querySelector('#mp-salvar').onclick=onSalvar;
    var limpaErro=function(e){ var f=e.target.closest&&e.target.closest('.mp-f.err'); if(f&&String(e.target.value).trim()){ f.classList.remove('err');
      if(!ov.querySelector('.mp-f.err')){ var m=ov.querySelector('#mp-err'); if(m) m.textContent=''; } } };
    ov.addEventListener('input',limpaErro); ov.addEventListener('change',limpaErro);
    document.body.appendChild(ov);
    var f=ov.querySelector('input,select,textarea'); if(f) setTimeout(function(){ try{f.focus();}catch(e){} },30);
    document.addEventListener('keydown', escKey);
    return ov;
  }
  function escKey(e){ if(e.key==='Escape') fecharModal(); }
  function fecharModal(){ var o=document.getElementById('mp-modal'); if(o) o.remove(); document.removeEventListener('keydown', escKey); }
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
    setTab:function(t){ S.tab=(t==='skus')?'skus':'clientes'; S.fOpen=false; S.skFOpen=false; rerender(); },
    setPTab:function(t){ S.pTab=(t==='embalagem'||t==='skus')?t:'dados'; var p=document.getElementById('mp-panel'); if(p) p.innerHTML=painelHTML(); else rerender(); },
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
    // para testes/inspeção
    _db:function(){ return load(); },
    _reset:function(){ DB=seed(); save(); S.sel=null; rerender(); }
  };
})();
