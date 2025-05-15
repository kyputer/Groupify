export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 

// Sanitize input by removing potentially harmful characters and trimming
export const sanitizeInput = (input: string): string => {
  // Remove HTML tags and special characters
  const sanitized = input
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/[&]/g, '&amp;') // Encode ampersands
      .replace(/["]/g, '&quot;') // Encode quotes
      .replace(/[']/g, '&#x27;') // Encode single quotes
      .replace(/[/]/g, '&#x2F;') // Encode forward slashes
      .trim();
  return sanitized;
};

// Validate input length and content
export const validateInput = (input: string, maxLength: number): boolean => {
  if (!input || input.length === 0) return false;
  if (input.length > maxLength) return false;
  return true;
};

export const generateCode = (): string => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  // const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";

  let allChars = uppercaseChars + lowercaseChars + numberChars;
  
  let code = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    code += allChars[randomIndex];
  }
  console.log("Generated code:", code); // Debugging
  return code;
};
