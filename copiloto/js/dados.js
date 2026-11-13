import { PROJETO, modoDemo } from './config.js';
import { criarAdaptadorMock } from './adaptador-mock.js';
import { criarAdaptadorSupabase } from './adaptador-supabase.js';

export async function abrirDados() {
  if (modoDemo()) {
    return { adaptador: criarAdaptadorMock(), modo: 'mock', erro: null };
  }
  try {
    const adaptador = await criarAdaptadorSupabase(PROJETO);
    return { adaptador, modo: 'supabase', erro: null };
  } catch (e) {
    return { adaptador: null, modo: 'supabase', erro: e.message };
  }
}
