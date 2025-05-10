import bcrypt from 'bcryptjs';

/**
 * Cria um hash da senha fornecida
 * @param password Senha em texto puro
 * @returns Senha com hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

/**
 * Compara uma senha em texto puro com uma senha com hash
 * @param plainPassword Senha em texto puro
 * @param hashedPassword Senha com hash
 * @returns Booleano indicando se as senhas correspondem
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}