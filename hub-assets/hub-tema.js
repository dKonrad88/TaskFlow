/* hub-tema.js — tema/fundo/véu do Hub Klain para o TaskFlow (novo.html).
   Persistência própria em localStorage 'hub_aparencia' (não toca nas chaves do TaskFlow). */
(function(){
  var KEY='hub_aparencia';
  var TEMAS=[
    ['Essenciais',[['light','Claro','ti-sun',0],['dark','Escuro','ti-moon',1],['minimal','Minimalista','ti-circle',0],['klain','Klain','ti-heart',0]]],
    ['Terminal',[['matrix','Matrix','ti-terminal-2',1],['tokyonight','Tokyo Night','ti-building-skyscraper',1],['dracula','Dracula','ti-ghost',1]]],
    ['Filmes, séries e jogos',[['stitch','Stitch','ti-alien',1],['strangerthings','Stranger Things','ti-bulb',1],['scooby','Scooby-Doo','ti-dog',1],['barbie','Barbie','ti-sparkles',0],['monstros','Monstros SA','ti-eye',0],['bibble','Bibble','ti-feather',0],['asiimov','Asiimov','ti-target',0]]],
    ['Cores e sabores',[['biscoito','Cookies','ti-cookie',0],['cafe','Café','ti-coffee',1],['amarelo','Milho','ti-plant',0],['rosa','Vick','ti-cloud',0],['pastel','Candy','ti-candy',0],['luxury','Flame','ti-flame',1],['coral','Coral','ti-ripple',1]]],
    ['Datas especiais',[['copa','Copa','ti-trophy',1],['halloween','Halloween','ti-pumpkin-scary',1]]]
  ];
  var FUNDOS=[['nenhum','Nenhum',''],['biscoito','Biscoitos','background-cookies.png'],['vick','Vick','background-vick.png'],['vick2','Vick 2','background-vick2.png'],['amarelo','Milho','background-milho.png'],['klain','Klain','background-klain.png']];
  var DEF={tema:'dark',fundo:'nenhum',veu:{on:true,cor:'#448887',alpha:0.90}};
  var ESC={}; TEMAS.forEach(function(g){g[1].forEach(function(t){ESC[t[0]]=!!t[3];});});
  function get(){ try{ var s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&ESC.hasOwnProperty(s.tema)) return Object.assign({},DEF,s,{veu:Object.assign({},DEF.veu,s.veu||{})}); }catch(e){} return JSON.parse(JSON.stringify(DEF)); }
  function save(s){ try{ localStorage.setItem(KEY,JSON.stringify(s)); }catch(e){} }
  function hexRgb(h){ h=(h||'#000').replace('#',''); if(h.length===3)h=h.replace(/./g,'$&$&'); var n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255].join(', '); }
  function apply(s){
    var r=document.documentElement;
    r.setAttribute('data-bs-theme',s.tema);
    if(s.fundo&&s.fundo!=='nenhum') r.setAttribute('data-bg',s.fundo); else r.removeAttribute('data-bg');
    if(s.veu&&s.veu.on){ r.setAttribute('data-hub-veu','1'); r.style.setProperty('--hub-veu-rgb',hexRgb(s.veu.cor)); r.style.setProperty('--hub-veu-alpha',String(s.veu.alpha)); }
    else { r.removeAttribute('data-hub-veu'); }
    syncDark();
  }
  // TaskFlow usa body.dark para os ajustes de modo escuro: acompanha o tema escolhido.
  function syncDark(){ var b=document.body; if(!b) return; var want=!!ESC[document.documentElement.getAttribute('data-bs-theme')];
    if(b.classList.contains('dark')!==want) b.classList.toggle('dark',want);
    if(b.hasAttribute('data-theme')) b.removeAttribute('data-theme'); }
  window.hubAparencia={get:get,apply:apply,TEMAS:TEMAS,FUNDOS:FUNDOS,ESC:ESC};
  apply(get());
  function boot(){
    syncDark();
    try{ new MutationObserver(syncDark).observe(document.body,{attributes:true,attributeFilter:['class','data-theme']}); }catch(e){}
    if(localStorage.getItem('hub_sb_rail')==='1') document.body.classList.add('hub-rail');
    montarModal();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();

  var filtro='todos';
  function montarModal(){
    if(document.getElementById('hub-tema-ov')) return;
    var ov=document.createElement('div'); ov.id='hub-tema-ov';
    ov.addEventListener('click',function(e){ if(e.target===ov) fechar(); });
    ov.innerHTML='<div id="hub-tema-box" role="dialog" aria-label="Personalização"></div>';
    document.body.appendChild(ov);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&ov.classList.contains('open')) fechar(); });
  }
  function render(){
    var s=get(), box=document.getElementById('hub-tema-box'); if(!box) return;
    var h='<div class="ht-head"><i class="ti ti-palette"></i> Personalização <button onclick="hubTemaFechar()" title="Fechar"><i class="ti ti-x"></i></button></div><div class="ht-body">';
    h+='<div class="ht-cat" style="margin-top:0">Cor</div><div class="ht-filtro">'+[['todos','Todos',''],['claros','Claros','ti-sun'],['escuros','Escuros','ti-moon']].map(function(f){return '<button class="'+(filtro===f[0]?'on':'')+'" onclick="hubTemaFiltro(\''+f[0]+'\')">'+(f[2]?'<i class="ti '+f[2]+'"></i> ':'')+f[1]+'</button>';}).join('')+'</div>';
    TEMAS.forEach(function(g){
      var itens=g[1].filter(function(t){ return filtro==='todos'||(filtro==='escuros')===!!t[3]; }); if(!itens.length) return;
      h+='<div class="ht-cat">'+g[0]+'</div><div class="ht-grid">';
      itens.forEach(function(t){
        h+='<button class="ht-card'+(s.tema===t[0]?' sel':'')+'" onclick="hubTemaSet(\''+t[0]+'\')"><div class="ht-sw" data-bs-theme="'+t[0]+'" style="background:var(--bs-body-bg)"><i style="background:var(--bs-primary)"></i><i style="background:var(--bs-secondary-color)"></i></div>'
          +'<div class="ht-nome"><i class="ti '+t[2]+'"></i><span>'+t[1]+'</span><i class="ti '+(t[3]?'ti-moon':'ti-sun')+'"></i></div></button>';
      });
      h+='</div>';
    });
    h+='<div class="ht-cat">Fundo</div><div class="ht-bgs">'+FUNDOS.map(function(f){ return '<button class="ht-bg'+((s.fundo||'nenhum')===f[0]?' sel':'')+'" style="'+(f[2]?'background-image:url(hub-assets/'+f[2]+')':'')+'" onclick="hubFundoSet(\''+f[0]+'\')">'+f[1]+'</button>'; }).join('')+'</div>';
    h+='<div class="ht-cat">Véu do fundo</div><div class="ht-veu"><label><input type="checkbox" '+(s.veu.on?'checked':'')+' onchange="hubVeuSet({on:this.checked})"> Véu personalizado</label>'
      +'<input type="color" value="'+s.veu.cor+'" oninput="hubVeuSet({on:true,cor:this.value})">'
      +'<label>Opacidade <input type="range" min="0" max="1" step="0.05" value="'+s.veu.alpha+'" oninput="hubVeuSet({on:true,alpha:parseFloat(this.value)});this.nextElementSibling.textContent=Math.round(this.value*100)+\'%\'"> <span>'+Math.round(s.veu.alpha*100)+'%</span></label>'
      +'<button class="menu-tab" onclick="hubVeuSet({on:false})">Usar véu do tema</button></div>';
    h+='</div>'; box.innerHTML=h;
  }
  function upd(p){ var s=get(); Object.assign(s,p); save(s); apply(s); }
  window.hubTemaAbrir=function(){ montarModal(); render(); document.getElementById('hub-tema-ov').classList.add('open'); };
  function fechar(){ var o=document.getElementById('hub-tema-ov'); if(o) o.classList.remove('open'); }
  window.hubTemaFechar=fechar;
  window.hubTemaFiltro=function(f){ filtro=f; render(); };
  window.hubTemaSet=function(t){ upd({tema:t}); render(); };
  window.hubFundoSet=function(f){ upd({fundo:f}); render(); };
  window.hubVeuSet=function(p){ var s=get(); s.veu=Object.assign({},s.veu,p); save(s); apply(s); if(p.on===false||p.on===true&&!('cor' in p)&&!('alpha' in p)) render(); };
  window.hubToggleRail=function(){ var on=document.body.classList.toggle('hub-rail'); try{localStorage.setItem('hub_sb_rail',on?'1':'0');}catch(e){} var b=document.getElementById('hub-rail-btn'); if(b){ b.title=on?'Expandir menu':'Recolher menu'; b.querySelector('i').className='ti '+(on?'ti-layout-sidebar-left-expand':'ti-layout-sidebar-left-collapse'); } };
})();
