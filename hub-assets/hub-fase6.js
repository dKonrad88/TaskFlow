/* hub-fase6.js — Programação em colunas por dia, multi-janelas e ajustes finos. Só apresentação sobre os dados do TaskFlow. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var DOWF={Seg:'Segunda',Ter:'Terça',Qua:'Quarta',Qui:'Quinta',Sex:'Sexta','Sáb':'Sábado'};
/* ---------- Programação: colunas por dia, cards de produto e totais ---------- */
function prog(){var orig=window._prodProgramacaoHTML._orig;
  var P=_prodProg(),sem=(typeof prodSemana!=='undefined'?prodSemana:0),dias=_prodDias(sem),leitor=_prodModo()==='leitor',L=PROD_LINHAS;
  var hoje=(typeof today!=='undefined'?today:'');
  var pills='<div class="h6-pills">'+[0,1].map(function(i){var d=_prodDias(i);var n=0;d.forEach(function(x){L.forEach(function(l){n+=_prodCellArr(P,x.iso+'|'+l.k).length;});});return '<button class="h6-pill'+(sem===i?' on':'')+'" onclick="_prodSetSemana('+i+')">Semana '+(i+1)+' · '+_prodRange(d)+' <span class="h6-pill-n">'+n+'</span></button>';}).join('')+'</div>';
  var modo='<label class="h6-modo"><input type="checkbox" '+(leitor?'':'checked')+' onchange="_prodSetModo(this.checked?\'pcp\':\'leitor\')"> Modo edição (PCP)</label>';
  var head='<tr><th class="h6-corner">Linha</th>'+dias.map(function(d){return '<th class="'+(d.iso===hoje?'hoje':'')+'">'+d.dd+' - '+(DOWF[d.dow]||d.dow)+'</th>';}).join('')+'</tr>';
  var tot=dias.map(function(){return {p:0,l:0,t:0};});
  var body=L.map(function(l){var tem=false;var cs=dias.map(function(d,i){var key=d.iso+'|'+l.k,a=_prodCellArr(P,key);if(a.length){tem=true;tot[i].p+=a.length;tot[i].l++;a.forEach(function(x){if(x.t)tot[i].t++;});}
      var cards=a.map(function(it,idx){return '<div class="h6-pc'+(it.t?' terc':'')+'"><div class="h6-pc-t"'+(leitor?'':' onclick="_prodPickReplace(this,\''+key+'\','+idx+')" title="Trocar item"')+'>'+esc(it.p)+'</div><div class="h6-pc-m"><span><i class="ti ti-building-factory-2"></i> '+esc(l.n)+'</span>'+(it.t?'<span class="h6-terc"><i class="ti ti-tag"></i> terceiros</span>':'')+'</div>'+
        (leitor?'':'<div class="h6-pc-a"><button title="Produção para terceiros" class="'+(it.t?'on':'')+'" onclick="event.stopPropagation();_prodToggleTerc(\''+key+'\','+idx+')"><i class="ti ti-tag"></i></button><button title="Remover" onclick="event.stopPropagation();_prodDelAt(\''+key+'\','+idx+')"><i class="ti ti-x"></i></button></div>')+'</div>';}).join('');
      var dnd=leitor?'':' ondragover="_prodDragOver(event)" ondragleave="_prodDragLeave(event)" ondrop="_prodDrop(event,\''+key+'\')"';
      return '<td class="'+(d.iso===hoje?'hoje':'')+'"'+dnd+'>'+cards+(leitor?'':'<button class="h6-add" onclick="_prodPickAdd(this,\''+key+'\')"><i class="ti ti-plus"></i></button>')+'</td>';}).join('');
    if(leitor&&!tem)return '';return '<tr class="'+(tem?'':'h6-dim')+'"><td class="h6-ln"><span>'+esc(l.n)+'</span></td>'+cs+'</tr>';}).join('');
  var foot='<tr class="h6-tot"><td class="h6-ln"><span>Totais</span></td>'+tot.map(function(t){return '<td><div><b>'+t.p+'</b> produto(s)</div><div><b>'+t.l+'</b> linha(s) ativas</div>'+(t.t?'<div><b>'+t.t+'</b> p/ terceiros</div>':'')+'</td>';}).join('')+'</tr>';
  var grid='<div class="h6-gridwrap"><table class="h6-prog"><thead>'+head+'</thead><tbody>'+(body||'<tr><td colspan="7" class="tk-notif-vazio">Nada programado nesta semana.</td></tr>')+foot+'</tbody></table></div>';
  var cad='';if(!leitor){var tmp=document.createElement('div');tmp.innerHTML=orig();var c=tmp.querySelector('.prod-cad');cad=c?c.outerHTML:'';}
  return '<div class="h6-top">'+pills+'<span style="flex:1"></span>'+modo+'</div>'+(cad?'<div class="h6-2col">'+grid+cad+'</div>':grid);}
function progHook(){if(typeof window._prodProgramacaoHTML==='function'&&!window._prodProgramacaoHTML._h6){var o=window._prodProgramacaoHTML;var f=function(){try{return prog();}catch(e){console.error(e);return o.apply(this,arguments);}};f._h6=1;f._orig=o;window._prodProgramacaoHTML=f;}}

/* ---------- Multi-janelas (como o protótipo oficial: cada janela é o app em ?embed=1) ---------- */
var EMB=/[?&]embed=1/.test(location.search);
if(EMB){document.documentElement.classList.add('hub-embed-html');document.addEventListener('DOMContentLoaded',function(){document.body.classList.add('hub-embed');});
  window.addEventListener('load',function(){var m=/[#&]run=([^&]+)/.exec(location.hash);if(m){setTimeout(function(){try{(new Function(decodeURIComponent(m[1])))();}catch(e){console.error(e);}},700);}});}
var Z=960,N=0;
function janela(titulo,code){var w=document.createElement('div');w.className='hub-win';N++;w.style.left=(240+N*28%240)+'px';w.style.top=(90+N*28%200)+'px';w.style.zIndex=++Z;
  w.innerHTML='<div class="hub-win-bar"><span><i class="ti ti-app-window"></i> '+esc(titulo)+'</span><span><button title="Maximizar" data-a="max"><i class="ti ti-maximize"></i></button><button title="Fechar" data-a="x"><i class="ti ti-x"></i></button></span></div><iframe src="./?embed=1#run='+encodeURIComponent(code)+'"></iframe>';
  document.body.appendChild(w);var bar=w.firstChild;
  w.addEventListener('mousedown',function(){w.style.zIndex=++Z;});
  bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='x')w.remove();else w.classList.toggle('max');});
  bar.addEventListener('mousedown',function(e){if(e.target.closest('button'))return;var sx=e.clientX,sy=e.clientY,ox=w.offsetLeft,oy=w.offsetTop;document.body.classList.add('hub-win-drag');
    function mv(ev){w.style.left=(ox+ev.clientX-sx)+'px';w.style.top=Math.max(59,oy+ev.clientY-sy)+'px';}function up(){document.body.classList.remove('hub-win-drag');document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}
window.hubJanelas=function(){var on=document.body.classList.toggle('hub-janelas');var b=document.getElementById('hub-jan-btn');if(b)b.classList.toggle('on',on);
  if(typeof toast==='function')toast(on?'Modo janelas: clique num item do menu para abri-lo numa janela.':'Modo janelas desligado.');};
document.addEventListener('click',function(e){if(EMB||!document.body.classList.contains('hub-janelas'))return;var b=e.target.closest('#sidebar .sbnav-item[onclick]');if(!b||b.id==='hub-jan-btn')return;
  var code=b.getAttribute('onclick')||'';if(!code||/toggleAllSbnavGroups|hubToggleRail|hubJanelas/.test(code))return;e.preventDefault();e.stopPropagation();
  var l=b.querySelector('.sbnav-label');janela(l?l.textContent.trim():'Janela',code);},true);
/* ---------- Destaque do menu: só um item ativo ---------- */
function hlHook(){if(typeof window.hubScreen==='function'&&!window.hubScreen._h6){var o=window.hubScreen;window.hubScreen=function(id){var x=o.apply(this,arguments);document.querySelectorAll('#sidebar .sbnav-item.active').forEach(function(b){if(b.dataset.hub!==id)b.classList.remove('active');});return x;};window.hubScreen._h6=1;}}
function init(){progHook();hlHook();}
init();window.addEventListener('load',function(){init();setTimeout(init,600);});
})();
