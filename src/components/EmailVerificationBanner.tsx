import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEmailVerification } from '../hooks/useEmailVerification';

interface EmailVerificationBannerProps {
  onVerifyPress?: () => void;
  showInVerified?: boolean;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ 
  onVerifyPress,
  showInVerified = false 
}) => {
  const { isVerified, userEmail, sendVerificationEmail } = useEmailVerification();

  // Se o email está verificado e não queremos mostrar o banner, retorna null
  if (isVerified && !showInVerified) {
    return null;
  }

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      Alert.alert(
        'E-mail Enviado',
        'E-mail de verificação enviado com sucesso! Verifique a sua caixa de entrada.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleVerifyPress = () => {
    if (onVerifyPress) {
      onVerifyPress();
    } else {
      handleSendVerification();
    }
  };

  return (
    <View style={[styles.banner, { backgroundColor: isVerified ? '#4CAF50' : '#FF9800' }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isVerified ? '✅ E-mail Verificado' : '⚠️ E-mail Não Verificado'}
        </Text>
        <Text style={styles.description}>
          {isVerified 
            ? 'O seu e-mail foi verificado com sucesso!'
            : `Verifique o e-mail enviado para ${userEmail}`
          }
        </Text>
      </View>
      
      {!isVerified && (
        <TouchableOpacity style={styles.button} onPress={handleVerifyPress}>
          <Text style={styles.buttonText}>Reenviar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EmailVerificationBanner; 