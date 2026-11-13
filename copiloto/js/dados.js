import { adaptadorAtivo, lerCredenciais } from './config.js';
import { criarAdaptadorMock } from './adaptador-mock.js';
import { criarAdaptadorSupabase } from './adaptador-supabase.js';

export async function abrirDados() {
  if (adaptadorAtivo() !== 'supabase') {
    return { adaptador: criarAdaptadorMock(), modo: 'mock', erro: null };
  }
  const cred = lerCredenciais();
  if (!cred) {
    return {
      adaptador: null,
      modo: 'supabase',
      erro: 'O adaptador supabase está ligado neste aparelho, mas falta a URL e a chave publicável. Veja o README. Nenhuma chave mora no repositório.',
    };
  }
  try {
    const adaptador = await criarAdaptadorSupabase(cred);
    return { adaptador, modo: 'supabase', erro: null };
  } catch (e) {
    return { adaptador: null, modo: 'supabase', erro: e.message };
  }
}
