import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { auth } from '../../firebaseConfig';
import { sendEmailVerification, onAuthStateChanged, reload } from 'firebase/auth';

const EmailVerificationScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || '');
        setIsVerified(user.emailVerified);
      }
    });

    return () => unsubscribe();
  }, []);

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      return;
    }

    setSendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        'E-mail Enviado',
        'E-mail de verificação enviado com sucesso! Verifique a sua caixa de entrada.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar e-mail de verificação.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiadas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Utilizador não encontrado.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      return;
    }

    setLoading(true);
    try {
      await reload(auth.currentUser);
      const user = auth.currentUser;
      setIsVerified(user.emailVerified);
      
      if (user.emailVerified) {
        Alert.alert(
          'Verificação Confirmada',
          'O seu e-mail foi verificado com sucesso!',
          [
            {
              text: 'Continuar',
              onPress: () => navigation.replace('HomeTabs')
            }
          ]
        );
      } else {
        Alert.alert(
          'E-mail Não Verificado',
          'O seu e-mail ainda não foi verificado. Verifique a sua caixa de entrada e clique no link de verificação.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao verificar o status da verificação.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao terminar sessão.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificação de E-mail</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status da Verificação:</Text>
        <View style={[styles.statusBadge, { backgroundColor: isVerified ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>
            {isVerified ? 'Verificado' : 'Não Verificado'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {isVerified 
          ? 'O seu e-mail foi verificado com sucesso! Pode continuar para a aplicação.'
          : `Enviamos um e-mail de verificação para:\n${userEmail}\n\nPor favor, verifique a sua caixa de entrada e clique no link de verificação.`
        }
      </Text>

      {!isVerified && (
        <>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: sendingEmail ? '#bbb' : '#2196F3' }]}
            onPress={sendVerificationEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reenviar E-mail</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading ? '#bbb' : '#4CAF50' }]}
            onPress={checkVerificationStatus}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verificar Status</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {isVerified && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.replace('HomeTabs')}
        >
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 30,
    marginBottom: 25,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 25,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EmailVerificationScreen; 