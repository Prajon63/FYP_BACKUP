/**
 * Validate email format, to check if mail entered is in order or not
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Minimum 6 characters
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate form inputs
 */
export const validateAuthForm = (email: string, password: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (!isValidPassword(password)) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true };
};



