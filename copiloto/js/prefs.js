/** Preferências locais do aparelho. Não vão para o servidor. */
const CHAVE = 'copiloto_prefs';
const AREAS = ['auto', 'hub', 'apto', 'compras'];

export function lerPrefs() {
  try {
    const o = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return {
      aprovar: o.aprovar !== false,
      area: AREAS.includes(o.area) ? o.area : 'auto',
    };
  } catch {
    return { aprovar: true, area: 'auto' };
  }
}

export function gravarPrefs(parcial) {
  const atual = lerPrefs();
  const proximo = {
    aprovar: parcial.aprovar === undefined ? atual.aprovar : parcial.aprovar !== false,
    area: AREAS.includes(parcial.area) ? parcial.area : atual.area,
  };
  try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch { /* segue na memória */ }
  return proximo;
}

/**
 * Gastos e itens do Hub Klain sempre passam por aprovação.
 * Desligada, a preferência só libera os demais tipos (ex.: item da lista).
 * Indefinido continua na fila: ainda não há tipo para criar.
 */
export function exigeAprovacao(tipo, prefs) {
  if (tipo === 'klain-tarefa' || tipo === 'klain-compromisso' || tipo === 'apto-gasto' || tipo === 'indefinido') return true;
  const p = prefs || { aprovar: true };
  return p.aprovar !== false;
}
