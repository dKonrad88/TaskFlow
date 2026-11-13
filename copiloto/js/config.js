/**
 * O adaptador publicado é o mock.
 * Para ligar o Supabase no aparelho, sem commitar chave, o README explica o localStorage.
 * O PWA não chama copiloto-entrada: isso é do Atalho.
 */
export const CONFIG = {
  adaptador: 'mock',
};

export const FUNCAO_DECIDIR = 'copiloto-decidir';

export function adaptadorAtivo() {
  try {
    const local = localStorage.getItem('copiloto_adaptador');
    if (local === 'supabase' || local === 'mock') return local;
  } catch {
    /* armazenamento bloqueado */
  }
  return CONFIG.adaptador;
}

export function lerCredenciais() {
  try {
    const cru = localStorage.getItem('copiloto_supabase');
    if (!cru) return null;
    const o = JSON.parse(cru);
    if (!o || !o.url || !o.key) return null;
    return { url: String(o.url).replace(/\/$/, ''), key: String(o.key).trim() };
  } catch {
    return null;
  }
}
