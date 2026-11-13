/**
 * O PWA entra no projeto Pessoal com a mesma chave publicável do Hub
 * (e-mail e senha). A chave de serviço e a COPILOTO_ENTRADA_KEY não ficam aqui.
 * O mock só abre com ?demo=1.
 */
export const PROJETO = {
  url: 'https://jlouesrrmqeauzlgvrpw.supabase.co',
  key: 'sb_publishable_ulG1woVG1p1Seax63GGYPQ_PG6-8l-G',
};

export const FUNCAO_DECIDIR = 'copiloto-decidir';
export const FUNCAO_ENTRADA = 'copiloto-entrada';

export function modoDemo() {
  try {
    return new URLSearchParams(location.search).get('demo') === '1';
  } catch {
    return false;
  }
}
