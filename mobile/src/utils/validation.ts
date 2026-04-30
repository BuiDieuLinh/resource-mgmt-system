/**
 * Validation utilities
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
