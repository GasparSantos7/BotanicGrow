import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator 
} from 'react-native';
import { auth, firestore } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setMessage('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, { displayName: name });

      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        nome: name,
        email: email,
      });

      await sendEmailVerification(userCredential.user);

      setMessage('✅ Utilizador registrado com sucesso. Por favor, verifique seu email para ativar sua conta.');
      setLoading(false);
      navigation.navigate('EmailVerification');
    } catch (error: any) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        placeholderTextColor="#aaa"
      />
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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: loading ? '#bbb' : '#4CAF50' }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registar</Text>
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

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginButton}>
        <Text style={styles.loginText}>
          Já tem uma conta? <Text style={{ fontWeight: 'bold' }}>Faça login</Text>
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
  loginButton: {
    marginTop: 18,
  },
  loginText: {
    color: '#2E7D32',
    fontSize: 16,
  },
});

export default RegisterScreen;
