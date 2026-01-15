// Expressions régulières pour validations
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]{2,30}$/;

// Liste des domaines email temporaires/jetables à bloquer
export const TEMPORARY_EMAIL_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'yopmail.com', 'maildrop.cc', 'throwaway.email', 'getnada.com'
];

// Mots de passe faibles à interdire
export const WEAK_PASSWORDS = [
  'password', '123456', 'azerty', 'qwerty', 'admin', 'root', 'test', 'user',
  'motdepasse', 'password123', '123456789', 'abcdef', 'letmein'
];
