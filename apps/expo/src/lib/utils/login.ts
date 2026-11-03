
/* matches: 'A sign in code has been sent to your email address' */
const TwoFactorRegex = /sign in code.*sent/i

export function is2FactorError(error: Error): boolean {
  return TwoFactorRegex.test(error?.message)
}
