import { User } from 'firebase/auth';
import { auth } from './firebase';
import { sendEmailVerification } from 'firebase/auth';
import validator from 'validator';

// Store verification codes in memory (in production, use a database)
const verificationCodes = new Map<string, { code: string; timestamp: number; attempts: number }>();

export interface EmailVerificationService {
  validateEmail(email: string): boolean;
  generateVerificationCode(): string;
  sendVerificationEmail(email: string): Promise<{ success: boolean; code: string }>;
  verifyCode(email: string, code: string): boolean;
  cleanupCode(email: string): void;
}

export const emailVerificationService: EmailVerificationService = {
  // Validate email using validator package
  validateEmail(email: string): boolean {
    return validator.isEmail(email);
  },

  // Generate a 6-digit verification code
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send verification email with code
  async sendVerificationEmail(email: string): Promise<{ success: boolean; code: string }> {
    try {
      // Validate email first
      if (!this.validateEmail(email)) {
        console.error('Invalid email format:', email);
        return { success: false, code: '' };
      }

      // Generate verification code
      const code = this.generateVerificationCode();
      
      // Store code with timestamp (5 minutes expiry)
      verificationCodes.set(email, {
        code,
        timestamp: Date.now(),
        attempts: 0
      });

      // In a real app, you would send an actual email here
      // For now, we'll just log the code (in production, use a service like SendGrid, AWS SES, etc.)
      console.log(`Verification code for ${email}: ${code}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, code };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, code: '' };
    }
  },

  // Verify the code entered by user
  verifyCode(email: string, code: string): boolean {
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      console.log('No verification code found for email:', email);
      return false;
    }

    // Check if code has expired (5 minutes)
    const now = Date.now();
    const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (now - storedData.timestamp > expiryTime) {
      console.log('Verification code expired for email:', email);
      verificationCodes.delete(email);
      return false;
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      console.log('Too many verification attempts for email:', email);
      verificationCodes.delete(email);
      return false;
    }

    // Increment attempts
    storedData.attempts++;

    // Check if code matches
    if (storedData.code === code) {
      console.log('Verification code verified for email:', email);
      verificationCodes.delete(email);
      return true;
    }

    console.log('Invalid verification code for email:', email);
    return false;
  },

  // Clean up verification code
  cleanupCode(email: string): void {
    verificationCodes.delete(email);
  }
}; 