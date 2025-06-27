import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { auth } from '../../firebaseConfig';
import { sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth';

const PasswordResetScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage('Por favor, introduza o seu e-mail.');
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Por favor, introduza um e-mail válido.');
      return;
    }

    setLoading(true);
    setMessage(''); // Limpar mensagens anteriores

    try {
      console.log('Tentando enviar email de reset para:', email);
      
      // Configurações para melhorar a experiência do link
      const actionCodeSettings: ActionCodeSettings = {
        url: 'https://botanicgrow-758e7.firebaseapp.com/password-reset',
        handleCodeInApp: false,
        iOS: {
          bundleId: 'com.botanicgrow.app'
        },
        android: {
          packageName: 'com.botanicgrow.app',
          installApp: true,
          minimumVersion: '12'
        },
        dynamicLinkDomain: 'botanicgrow.page.link'
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      console.log('Email de reset enviado com sucesso');
      setMessage('✅ E-mail de reposição enviado com sucesso! Verifique a sua caixa de entrada.');
      
      // Mostrar alerta de sucesso
      Alert.alert(
        'E-mail Enviado',
        'Verifique a sua caixa de entrada e spam para o link de reposição da palavra-passe.\n\nSe o link não for clicável, copie e cole o URL no seu navegador.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Erro ao enviar email de reset:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      
      let errorMessage = 'Erro ao enviar e-mail de reposição.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Não existe uma conta associada a este e-mail.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiadas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de rede. Verifique a sua ligação à internet.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida. Contacte o administrador.';
          break;
        default:
          errorMessage = `Erro: ${error.message}`;
      }
      
      setMessage(errorMessage);
      
      // Mostrar alerta de erro
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Repor Palavra-passe</Text>
      
      <Text style={styles.description}>
        Introduza o seu e-mail e enviaremos um link para repor a sua palavra-passe.
        {'\n\n'}Se o link no email não for clicável, copie e cole o URL no seu navegador.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setMessage(''); // Limpar mensagens ao digitar
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: loading ? '#bbb' : '#4CAF50' }]}
        onPress={handlePasswordReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar E-mail</Text>
        )}
      </TouchableOpacity>

      {!!message && (
        <Text
          style={[
            styles.message,
            { color: message.includes('sucesso') ? '#388E3C' : '#D32F2F' }
          ]}
        >
          {message}
        </Text>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
        <Text style={styles.backText}>
          ← Voltar ao Login
        </Text>
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
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    marginTop: 25,
  },
  backText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PasswordResetScreen; 