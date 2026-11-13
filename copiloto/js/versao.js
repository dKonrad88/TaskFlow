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

/** Espaço entre o chip (ou o botão) e a barra, já com a área segura do iPhone. */
export const FOLGA_BARRA = 15;

export function reservaInferior(safeBottom, folga = FOLGA_BARRA) {
  return 12 + 66 + Math.max(0, safeBottom || 0) + folga;
}

/** Centro vertical máximo, em fração da altura, para a peça não entrar na folga. */
export function limiteY(alturaTela, safeBottom, alturaPeca, folga = FOLGA_BARRA) {
  const vh = alturaTela || 1;
  return (vh - reservaInferior(safeBottom, folga) - alturaPeca / 2) / vh;
}

/** JS e CSS vêm da rede, com o cache só se a rede falhar. */
export function redePrimeiro(caminho) {
  const p = String(caminho || '').split('?')[0].toLowerCase();
  return p.endsWith('.js') || p.endsWith('.css');
}
