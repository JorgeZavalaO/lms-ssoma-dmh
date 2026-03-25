import bcrypt from "bcryptjs"
import { randomInt } from "crypto"

/**
 * Genera una contraseña aleatoria segura
 * @param length - Longitud de la contraseña (default: 12)
 * @returns Contraseña generada
 */
export function generatePassword(length: number = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%&*"
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ""
  
  // Asegurar que tenga al menos un carácter de cada tipo
  password += lowercase[randomInt(lowercase.length)]
  password += uppercase[randomInt(uppercase.length)]
  password += numbers[randomInt(numbers.length)]
  password += symbols[randomInt(symbols.length)]
  
  // Completar el resto
  for (let i = password.length; i < length; i++) {
    password += allChars[randomInt(allChars.length)]
  }
  
  // Mezclar los caracteres
  const chars = password.split("")
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]]
  }

  return chars.join("")
}

/**
 * Genera una contraseña temporal más simple (solo letras y números)
 * Útil para enviar por email o SMS
 * @param length - Longitud de la contraseña (default: 8)
 * @returns Contraseña temporal
 */
export function generateSimplePassword(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  
  for (let i = 0; i < length; i++) {
    password += chars[randomInt(chars.length)]
  }
  
  return password
}

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash de la contraseña
 * @returns True si coinciden, false si no
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
