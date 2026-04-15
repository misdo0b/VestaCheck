import bcrypt from 'bcryptjs';

/**
 * hashPassword - Hâche un mot de passe en clair avec un sel (par défaut 10 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * comparePassword - Vérifie si un mot de passe en clair correspond à un hachage stocké
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
