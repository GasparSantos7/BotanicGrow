import { auth } from '../firebaseConfig';
import { sendEmailVerification, reload } from 'firebase/auth';

export const emailVerificationService = {
  // Enviar email de verificação
  sendVerificationEmail: async () => {
    if (!auth.currentUser) {
      throw new Error('Utilizador não autenticado');
    }
    
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true, message: 'E-mail de verificação enviado com sucesso!' };
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar e-mail de verificação.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiadas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Utilizador não encontrado.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Verificar se o email está verificado
  checkEmailVerification: async () => {
    if (!auth.currentUser) {
      throw new Error('Utilizador não autenticado');
    }
    
    try {
      await reload(auth.currentUser);
      const user = auth.currentUser;
      return {
        isVerified: user.emailVerified,
        email: user.email
      };
    } catch (error) {
      throw new Error('Erro ao verificar o status da verificação.');
    }
  },

  // Verificar se o utilizador atual tem email verificado
  isCurrentUserEmailVerified: () => {
    return auth.currentUser?.emailVerified || false;
  },

  // Obter email do utilizador atual
  getCurrentUserEmail: () => {
    return auth.currentUser?.email || '';
  }
}; 