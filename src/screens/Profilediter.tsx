import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  profileImage: string;
}

interface ProfileEditScreenProps {
  navigation: any;
  route: any;
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: '',
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert('Erro', 'Utilizador não autenticado');
          navigation.navigate('Login');
          return;
        }

        const userId = currentUser.uid;
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as Omit<User, 'id'>;
          setUser({ id: userId, ...userData });
        } else {
          const newUserData = {
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: '',
            bio: '',
            profileImage: currentUser.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUserData);
          setUser({ id: userId, ...newUserData });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (field: keyof User, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita acesso às fotos para continuar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUploading(true);
        setLocalImageUri(result.assets[0].uri);
        await uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado');
      }

      if (fileInfo.size > 5 * 1024 * 1024) {
        throw new Error('A imagem é muito grande. Use uma menor que 5MB.');
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `${user.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile_images/${fileName}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      handleChange('profileImage', downloadURL);
      setLocalImageUri(null);
      
      // Atualizar o documento do usuário com a nova URL da imagem
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        profileImage: downloadURL,
        updatedAt: new Date().toISOString()
      });
      
      Alert.alert('Sucesso', 'Imagem de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro', error.message || 'Falha ao fazer upload da imagem');
      setLocalImageUri(null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }

    setSaving(true);
    await saveUserData();
  };

  const saveUserData = async () => {
    const userRef = doc(db, 'users', user.id);
    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profileImage,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(userRef, userData);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      if (error.code === 'not-found') {
        await setDoc(userRef, { ...userData, createdAt: new Date().toISOString() });
        Alert.alert('Sucesso', 'Perfil criado com sucesso!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', error.message || 'Falha ao guardar o perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>A carregar o seu perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Editar Perfil</Text>
      <View style={styles.imageContainer}>
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.profileImage} />
        ) : user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={60} color="#999" />
          </View>
        )}
        <TouchableOpacity 
          style={[styles.imagePickerButton, imageUploading && styles.imagePickerButtonDisabled]} 
          onPress={pickImage} 
          disabled={imageUploading}
        >
          {imageUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="camera" size={22} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={user.name}
            onChangeText={value => handleChange('name', value)}
            placeholder="O seu nome completo"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={user.email}
            onChangeText={value => handleChange('email', value)}
            placeholder="email@exemplo.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={user.phone}
            onChangeText={value => handleChange('phone', value)}
            placeholder="(+351) 000 000 000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={user.bio}
            onChangeText={value => handleChange('bio', value)}
            placeholder="Fala-nos um pouco sobre ti..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 30,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: 0,
    right: '32%',
    backgroundColor: '#4CAF50',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imagePickerButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProfileEditScreen;
