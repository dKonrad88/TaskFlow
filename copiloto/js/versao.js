/** Quando o aviso de versão pode aparecer e quando a página pode recarregar. */

export const AVISO_VERSAO = 'Nova versão disponível — tocar para atualizar';

export function mostrarAvisoDeVersao(nova, gravando) {
  return !!nova && !gravando;
}

export function recarregarPorVersao(gravando) {
  return !gravando;
}

/** Sem controller é a primeira instalação: o worker novo pode assumir na hora. */
export function ativarNaHora(temController) {
  return !temController;
}

/** JS e CSS vêm da rede, com o cache só se a rede falhar. A pasta vendor não muda: vem do cache. */
export function redePrimeiro(caminho) {
  const p = String(caminho || '').split('?')[0].toLowerCase();
  if (p.includes('/vendor/')) return false;
  return p.endsWith('.js') || p.endsWith('.css');
}

/** Versão mostrada em Ajustes. Acompanha o nome do cache em sw.js. */
export const VERSAO = 'v14';
