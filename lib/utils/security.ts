/**
 * Vérifie un token Cloudflare Turnstile côté serveur.
 * @param token Le token envoyé par le client
 * @param ip L'adresse IP de l'utilisateur (optionnel)
 * @returns true si la validation réussit, false sinon
 */
export async function verifyTurnstileToken(token: string, ip?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Si pas de clé secrète (dev), on laisse passer pour ne pas bloquer les tests
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not defined. Skipping validation.');
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await response.json();
    return !!outcome.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}
