import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const PlantIdentifier = () => {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para selecionar imagens.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      setImageUri(image.uri);
      identifyPlant(image.base64);
    }
  };

  const identifyPlant = async (base64Image) => {
    setLoading(true);
    setResult(null);

    const apiKey = 'WxmZBBpomZ8XuPSj1jkPhznNb5QVPP1r9ohdiChfcPuSW3i1ww'; // <-- API key do Plant.id

    const data = {
      images: [base64Image],
      organs: ['leaf'], // ou 'flower', 'fruit' dependendo da imagem
    };

    try {
      const response = await axios.post(
        'https://api.plant.id/v2/identify',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': apiKey,
          },
        }
      );

      if (response.data?.suggestions?.length > 0) {
        setResult(response.data.suggestions[0]); // melhor sugestão
      } else {
        Alert.alert('Erro', 'Nenhuma planta identificada.');
      }
    } catch (error) {
      console.error('Erro ao identificar planta:', error);
      Alert.alert('Erro', 'Falha ao comunicar com o serviço de identificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Escolher Foto da Planta</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {loading && <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />}

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Nome Científico: {result.plant_name}</Text>
          <Text>Confiança: {(result.probability * 100).toFixed(2)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  button: {
    backgroundColor: '#228B22',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: 250,
    height: 250,
    marginTop: 20,
    borderRadius: 15,
  },
  result: {
    marginTop: 30,
    alignItems: 'center',
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
});

export default PlantIdentifier;
