import { supabase } from '@/lib/supabase';

// Mock functions for user queries
export const findUserByEmail = async (email: string) => {
  // Busca todos os usuários e filtra pelo email
  let page = 1;
  let perPage = 100;
  let foundUser = null;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data || !data.users.length) break;
    foundUser = data.users.find((u) => u.email === email);
    if (foundUser) break;
    if (data.users.length < perPage) break;
    page++;
  }
  if (!foundUser) return null;
  // Busca perfil vinculado
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', foundUser.id)
    .maybeSingle();
  return { ...foundUser, profile };
};

export const findUserById = async (id: string) => {
  const { data, error } = await supabase.auth.admin.getUserById(id);
  if (error || !data || !data.user) return null;
  const user = data.user;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  return { ...user, profile };
};

export const createUser = async (userData: { email: string; password: string; name: string; phone?: string; role?: string }) => {
  // Cria usuário no Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    user_metadata: { name: userData.name, phone: userData.phone, role: userData.role || 'user' },
    email_confirm: true
  });
  if (error || !data || !data.user) return null;
  // O trigger do banco cria o profile automaticamente
  return { ...data.user };
};

export const updateUser = async (id: string, userData: any) => {
  // Atualiza metadados do usuário
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    user_metadata: userData
  });
  if (error || !data || !data.user) return null;
  // Atualiza perfil se necessário
  if (userData.name || userData.phone) {
    await supabase
      .from('profiles')
      .update({ name: userData.name, phone: userData.phone })
      .eq('id', id);
  }
  return { ...data.user };
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.auth.admin.deleteUser(id);
  return !error;
}; 