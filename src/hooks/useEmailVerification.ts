import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { emailVerificationService } from '../services/emailVerification';

export const useEmailVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || '');
        setIsVerified(user.emailVerified);
      } else {
        setUserEmail('');
        setIsVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const sendVerificationEmail = async () => {
    setSendingEmail(true);
    try {
      const result = await emailVerificationService.sendVerificationEmail();
      setSendingEmail(false);
      return result;
    } catch (error) {
      setSendingEmail(false);
      throw error;
    }
  };

  const checkVerificationStatus = async () => {
    setLoading(true);
    try {
      const result = await emailVerificationService.checkEmailVerification();
      setIsVerified(result.isVerified);
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    isVerified,
    userEmail,
    loading,
    sendingEmail,
    sendVerificationEmail,
    checkVerificationStatus,
    isCurrentUserEmailVerified: emailVerificationService.isCurrentUserEmailVerified,
    getCurrentUserEmail: emailVerificationService.getCurrentUserEmail
  };
}; 