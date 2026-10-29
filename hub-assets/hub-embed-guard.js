/* hub-embed-guard.js — janelas (?embed=1) são somente leitura: sem Supabase e sem gravar dados. Só o app principal sincroniza. */
(function(){
if(!/[?&]embed=1\b/.test(location.search))return;
window.HUB_EMBED=true;
try{Object.defineProperty(window,'supabase',{configurable:false,get:function(){return undefined;},set:function(){}});}catch(e){}
var SB=/supabase\.co/i;
var f=window.fetch;window.fetch=function(u){var s=typeof u==='string'?u:(u&&u.url)||'';if(SB.test(s))return Promise.reject(new Error('hub-embed: sem sync'));return f.apply(this,arguments);};
var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){if(SB.test(String(u)))throw new Error('hub-embed: sem sync');return xo.apply(this,arguments);};
var WS=window.WebSocket;window.WebSocket=function(u,p){if(SB.test(String(u)))throw new Error('hub-embed: sem sync');return p?new WS(u,p):new WS(u);};window.WebSocket.prototype=WS.prototype;
var si=Storage.prototype.setItem,ri=Storage.prototype.removeItem;
function dado(k){return this===window.localStorage&&/^taskflow/.test(String(k));}
Storage.prototype.setItem=function(k,v){if(dado.call(this,k))return;return si.apply(this,arguments);};
Storage.prototype.removeItem=function(k){if(dado.call(this,k))return;return ri.apply(this,arguments);};
var t;window.addEventListener('storage',function(e){if(e.key&&/^taskflow/.test(e.key)){clearTimeout(t);t=setTimeout(function(){location.reload();},800);}});
document.addEventListener('DOMContentLoaded',function(){var b=document.createElement('div');b.className='hub-embed-ro';b.innerHTML='<i class="ti ti-eye"></i> Somente leitura — edite na janela principal';document.body.appendChild(b);});
})();
