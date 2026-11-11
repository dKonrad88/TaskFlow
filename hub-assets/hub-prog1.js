/* hub-prog1.js — Programação: busca + funil (Exibição / Ações / Edição)
   sobre a apresentação atual (hub-fase6). Instala depois do hook do fase6 e
   marca _h6 para ele não reassumir o render. */
(function(){
  var LS='taskflow_prod_view';
  var S={busca:'', fam:'', klain:true, terc:true, valores:'todas'};
  var funilAberto=false, buscaFocus=false, buscaSel=[0,0];
  var DOWF={Seg:'Segunda',Ter:'Terça',Qua:'Quarta',Qui:'Quinta',Sex:'Sexta','Sáb':'Sábado'};
  function esc(s){ return typeof escapeHTML==='function' ? escapeHTML(s) : String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function attr(s){ return typeof escapeAttr==='function' ? escapeAttr(s) : esc(s); }

  (function load(){
    try{
      var o=typeof safeJSON==='function' ? safeJSON(LS,null) : JSON.parse(localStorage.getItem(LS)||'null');
      if(o&&typeof o==='object'){
        if(typeof o.klain==='boolean') S.klain=o.klain;
        if(typeof o.terc==='boolean') S.terc=o.terc;
        if(o.valores==='todas'||o.valores==='subtotais') S.valores=o.valores;
        if(typeof o.fam==='string') S.fam=o.fam;
      }
    }catch(e){}
  })();
  function persist(){
    try{
      var payload=JSON.stringify({klain:S.klain,terc:S.terc,valores:S.valores,fam:S.fam});
      if(typeof safeSetItem==='function') safeSetItem(LS,payload);
      else localStorage.setItem(LS,payload);
    }catch(e){}
  }
  function funilAtivo(){ return !S.klain || !S.terc || S.valores!=='todas'; }
  function norm(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
  function famOf(name){ try{ return (_prodItemFam()||{})[name]||''; }catch(e){ return ''; } }
  function itemVisivel(it, opts){
    if(!it) return false;
    var terc=!!it.t;
    if(!S.klain && !terc) return false;
    if(!S.terc && terc) return false;
    if(S.busca && norm(it.p).indexOf(norm(S.busca))<0) return false;
    if(!(opts&&opts.skipFam) && S.fam && famOf(it.p)!==S.fam) return false;
    return true;
  }
  function visiveis(arr, opts){
    var out=[];
    (arr||[]).forEach(function(it,i){ if(itemVisivel(it,opts)) out.push({p:it.p,t:it.t,i:i}); });
    return out;
  }
  function contaSemana(off){
    var P=_prodProg(), dias=_prodDias(off), n=0;
    dias.forEach(function(d){ PROD_LINHAS.forEach(function(l){ n+=_prodCellArr(P,d.iso+'|'+l.k).length; }); });
    return n;
  }
  function contaFam(famNome, prog, dias){
    var n=0;
    PROD_LINHAS.forEach(function(l){
      dias.forEach(function(d){
        _prodCellArr(prog,d.iso+'|'+l.k).forEach(function(it){
          if(!itemVisivel(it,{skipFam:true})) return;
          if(!famNome || famOf(it.p)===famNome) n++;
        });
      });
    });
    return n;
  }

  function capturaBusca(){
    var el=document.getElementById('prod-busca');
    if(!el) return;
    S.busca=el.value||'';
    buscaFocus=document.activeElement===el;
    try{ buscaSel=[el.selectionStart||0, el.selectionEnd||0]; }catch(e){ buscaSel=[S.busca.length,S.busca.length]; }
  }
  function restauraBusca(){
    var el=document.getElementById('prod-busca');
    if(!el) return;
    el.value=S.busca||'';
    if(buscaFocus){
      el.focus();
      try{ el.setSelectionRange(buscaSel[0], buscaSel[1]); }catch(e){}
    }
  }

  function popoverHTML(){
    if(!funilAberto) return '';
    var leitor=typeof _prodModo==='function' && _prodModo()==='leitor';
    var limpar=funilAtivo()?'<div class="mp-fpop-h"><u onclick="PROG1.limpar()">Limpar</u></div>':'';
    return '<div class="cp-pop prod-fpop mp-fpop" role="dialog" aria-label="Filtros e ações">'
      +limpar
      +'<div class="prod-fgrp"><b>Exibição</b>'
      +'<div class="prod-frow"><span class="prod-flab">Produtos:</span>'
      +'<button type="button" class="prod-sw'+(S.klain?' on':'')+'" onclick="PROG1.setShow(\'klain\')"><i class="kn"></i> Klain</button>'
      +'<button type="button" class="prod-sw'+(S.terc?' on':'')+'" onclick="PROG1.setShow(\'terc\')"><i class="kn"></i> Terceiros</button>'
      +'</div>'
      +'<button type="button" class="prod-radio'+(S.valores==='todas'?' on':'')+'" onclick="PROG1.setValores(\'todas\')"><span class="dot"></span> Todas as informações do produto</button>'
      +'<button type="button" class="prod-radio'+(S.valores==='subtotais'?' on':'')+'" onclick="PROG1.setValores(\'subtotais\')"><span class="dot"></span> Subtotais e totais</button>'
      +'</div>'
      +'<div class="prod-fgrp"><b>Ações</b>'
      +'<button type="button" class="prod-act" onclick="PROG1.acao(\'massadas\')"><i class="ti ti-chart-dots"></i> Massadas</button>'
      +'<button type="button" class="prod-act" onclick="PROG1.acao(\'consumo\')"><i class="ti ti-send"></i> Enviar consumo</button>'
      +'<button type="button" class="prod-act" onclick="PROG1.acao(\'planilha\')"><i class="ti ti-refresh"></i> Atualizar planilha</button>'
      +'</div>'
      +'<div class="prod-fgrp"><b>Edição</b>'
      +'<label class="prod-modo h6-modo" title="'+(leitor?'Modo leitor — só exibe o que tem produto no dia':'Modo PCP — edita a programação')+'">'
      +'<input type="checkbox" '+(leitor?'':'checked')+' onchange="_prodSetModo(this.checked?\'pcp\':\'leitor\')"> Modo edição (PCP)</label>'
      +'</div>'
      +'</div>';
  }
  function toolsHTML(){
    var on=funilAberto||funilAtivo();
    var btn=typeof _cpIcoBtn==='function'
      ? _cpIcoBtn('PROG1.toggleFunil()', 'Filtros e ações', 'filter', on, '')
      : '<button class="cp-abtn'+(on?' on':'')+'" onclick="PROG1.toggleFunil()" title="Filtros e ações"><i class="ti ti-filter"></i></button>';
    var busca='<span class="cp-buscaw"><i class="ti ti-search"></i>'
      +'<input id="prod-busca" class="cp-busca" value="'+attr(S.busca)+'" oninput="PROG1.busca(this)" placeholder="Buscar produto..."></span>';
    return '<div class="prod-tools">'+busca
      +'<span class="cp-pop-wrap" id="prod-fwrap" style="position:relative;display:inline-flex">'+btn+popoverHTML()+'</span>'
      +'</div>';
  }
  function catsHTML(prog, dias){
    var fams=typeof _prodFamilias==='function'?_prodFamilias():[];
    if(S.fam && fams.indexOf(S.fam)<0) S.fam='';
    var tabs=[{id:'',label:'Todos',n:contaFam('',prog,dias)}].concat(fams.map(function(f){ return {id:f,label:f,n:contaFam(f,prog,dias)}; }));
    return '<div class="prod-cats">'+tabs.map(function(t){
      return '<button type="button" class="prod-cat'+(t.id===S.fam?' on':'')+'" data-fam="'+attr(t.id)+'" onclick="PROG1.setFam(this)">'+esc(t.label)+' <span class="n">'+t.n+'</span></button>';
    }).join('')+'</div>';
  }

  function cardHTML(key, it, leitor, linhaNome){
    return '<div class="h6-pc'+(it.t?' terc':'')+'">'
      +'<div class="h6-pc-t"'+(leitor?'':' onclick="_prodPickReplace(this,\''+key+'\','+it.i+')" title="Trocar item"')+'>'+esc(it.p)+'</div>'
      +'<div class="h6-pc-m"><span><i class="ti ti-building-factory-2"></i> '+esc(linhaNome)+'</span>'
      +(it.t?'<span class="h6-terc"><i class="ti ti-tag"></i> terceiros</span>':'')+'</div>'
      +(leitor?'':'<div class="h6-pc-a"><button title="Produção para terceiros" class="'+(it.t?'on':'')+'" onclick="event.stopPropagation();_prodToggleTerc(\''+key+'\','+it.i+')"><i class="ti ti-tag"></i></button><button title="Remover" onclick="event.stopPropagation();_prodDelAt(\''+key+'\','+it.i+')"><i class="ti ti-x"></i></button></div>')
      +'</div>';
  }
  function subcell(n){
    if(!n) return '<div class="prod-subcell empty">—</div>';
    return '<div class="prod-subcell">'+n+'<small>'+(n===1?'item':'itens')+'</small></div>';
  }

  function render(orig){
    if(typeof _prodProg!=='function') return orig?orig():'';
    var P=_prodProg(), sem=(typeof prodSemana!=='undefined'?prodSemana:0), dias=_prodDias(sem);
    var leitor=_prodModo()==='leitor', L=PROD_LINHAS;
    var hoje=(typeof today!=='undefined'?today:'');
    var pills='<div class="h6-pills">'+[0,1].map(function(i){
      var d=_prodDias(i);
      return '<button class="h6-pill'+(sem===i?' on':'')+'" onclick="_prodSetSemana('+i+')">Semana '+(i+1)+' · '+_prodRange(d)+' <span class="h6-pill-n">'+contaSemana(i)+'</span></button>';
    }).join('')+'</div>';
    var topbar='<div class="h6-top">'+pills+'</div>';
    var catsRow='<div class="prod-cats-row">'+catsHTML(P,dias)+toolsHTML()+'</div>';
    var head='<tr><th class="h6-corner">Linha</th>'+dias.map(function(d){
      return '<th class="'+(d.iso===hoje?'hoje':'')+'">'+d.dd+' - '+(DOWF[d.dow]||d.dow)+'</th>';
    }).join('')+'</tr>';
    var tot=dias.map(function(){ return {p:0,l:0,t:0}; });
    var body=L.map(function(l){
      var tem=false;
      var cs=dias.map(function(d,i){
        var key=d.iso+'|'+l.k, arr=_prodCellArr(P,key), vis=visiveis(arr);
        if(vis.length){ tem=true; tot[i].p+=vis.length; tot[i].l++; vis.forEach(function(x){ if(x.t) tot[i].t++; }); }
        var inner;
        if(S.valores==='subtotais') inner=subcell(vis.length);
        else inner=vis.map(function(it){ return cardHTML(key,it,leitor,l.n); }).join('');
        var dnd=leitor?'':' ondragover="_prodDragOver(event)" ondragleave="_prodDragLeave(event)" ondrop="_prodDrop(event,\''+key+'\')"';
        return '<td class="'+(d.iso===hoje?'hoje':'')+'"'+dnd+'>'+inner+(leitor||S.valores==='subtotais'?'':'<button class="h6-add" onclick="_prodPickAdd(this,\''+key+'\')"><i class="ti ti-plus"></i></button>')+'</td>';
      }).join('');
      if(leitor&&!tem) return '';
      return '<tr class="'+(tem?'':'h6-dim')+'"><td class="h6-ln"><span>'+esc(l.n)+'</span></td>'+cs+'</tr>';
    }).join('');
    var foot='<tr class="h6-tot"><td class="h6-ln"><span>Totais</span></td>'+tot.map(function(t){
      return '<td><div><b>'+t.p+'</b> produto(s)</div><div><b>'+t.l+'</b> linha(s) ativas</div>'+(t.t?'<div><b>'+t.t+'</b> p/ terceiros</div>':'')+'</td>';
    }).join('')+'</tr>';
    var grid='<div class="h6-gridwrap"><table class="h6-prog"><thead>'+head+'</thead><tbody>'+(body||'<tr><td colspan="7" class="tk-notif-vazio">Nada programado nesta semana.</td></tr>')+foot+'</tbody></table></div>';
    var cad='';
    if(!leitor && typeof orig==='function'){
      try{ var tmp=document.createElement('div'); tmp.innerHTML=orig(); var c=tmp.querySelector('.prod-cad'); if(c) cad=c.outerHTML; }catch(e){}
    }
    var hint=S.valores==='subtotais'
      ? '<div class="prod-hint"><i class="ti ti-info-circle"></i> Subtotais contam os itens visíveis por célula e por dia. Para editar a grade, volte em “Todas as informações do produto” no funil.</div>'
      : '';
    return topbar+catsRow+(cad?'<div class="h6-2col">'+grid+cad+'</div>':grid)+hint;
  }

  function install(){
    if(typeof window._prodProgramacaoHTML!=='function') return;
    var cur=window._prodProgramacaoHTML;
    if(cur._prog1) return;
    var orig=cur._orig||cur;
    var f=function(){ try{ return render(orig); }catch(e){ console.error(e); return orig.apply(this,arguments); } };
    f._prog1=1;
    f._h6=1; // impede o hub-fase6 de reassumir o render
    f._orig=orig;
    window._prodProgramacaoHTML=f;
  }

  var _rerenderOrig=null;
  function wrapRerender(){
    if(typeof _prodRerender!=='function') return;
    if(_prodRerender._prog1) return;
    _rerenderOrig=_prodRerender;
    var w=function(){ capturaBusca(); _rerenderOrig(); restauraBusca(); };
    w._prog1=1;
    window._prodRerender=w;
  }

  function boot(){ install(); wrapRerender(); }
  boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot, 700); });

  function rerender(){ if(typeof _prodRerender==='function') _prodRerender(); }

  window.PROG1={
    busca:function(el){ S.busca=el&&el.value||''; buscaFocus=true; try{ buscaSel=[el.selectionStart||0,el.selectionEnd||0]; }catch(e){} rerender(); },
    setFam:function(el){ S.fam=(el&&el.getAttribute('data-fam'))||''; persist(); rerender(); },
    toggleFunil:function(){ funilAberto=!funilAberto; rerender(); },
    setShow:function(kind){
      if(kind==='klain') S.klain=!S.klain;
      else if(kind==='terc') S.terc=!S.terc;
      persist(); rerender();
    },
    setValores:function(v){ S.valores=(v==='subtotais')?'subtotais':'todas'; persist(); rerender(); },
    limpar:function(){ S.klain=true; S.terc=true; S.valores='todas'; persist(); rerender(); },
    acao:function(kind){
      var msg={
        massadas:'A visão de massadas ainda não está ligada nesta tela.',
        consumo:'O envio de consumo ainda não está ligado nesta tela.',
        planilha:'A programação foi atualizada nesta tela. A planilha externa ainda não está ligada.'
      };
      if(kind==='planilha') rerender();
      if(typeof toast==='function') toast(msg[kind]||'');
    }
  };

  if(!window.__prog1Closer){
    window.__prog1Closer=true;
    document.addEventListener('mousedown', function(e){
      if(!funilAberto) return;
      var t=e&&e.target;
      if(t && t.closest && t.closest('#prod-fwrap')) return;
      funilAberto=false;
      rerender();
    }, true);
  }
})();
