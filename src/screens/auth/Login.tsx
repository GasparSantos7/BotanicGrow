import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    const checkStoredCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedPassword = await AsyncStorage.getItem('userPassword');
        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
      }
    };

    checkStoredCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('✅ Sessão iniciada com sucesso!');
      setLoading(false);

      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userPassword', password);
      } else {
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userPassword');
      }

      navigation.replace('HomeTabs');
    } catch (error: any) {
      setLoading(false);
      setMessage('Erro: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sessão</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Palavra-passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#aaa"
      />

      <View style={styles.rememberContainer}>
        <Checkbox
          status={rememberMe ? 'checked' : 'unchecked'}
          onPress={() => setRememberMe(!rememberMe)}
          color="#2E7D32"
        />
        <Text style={styles.rememberText}>Lembrar-me</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: loading ? '#bbb' : '#4CAF50' }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
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

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerButton}>
        <Text style={styles.registerText}>
          Ainda não tem conta? <Text style={{ fontWeight: 'bold' }}>Registe-se</Text>
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
    marginBottom: 25,
    fontWeight: 'bold',
    color: '#2E7D32',
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
  },
  registerButton: {
    marginTop: 18,
  },
  registerText: {
    color: '#2E7D32',
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  rememberText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default LoginScreen;
