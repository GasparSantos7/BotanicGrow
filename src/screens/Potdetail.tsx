import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet,
  ScrollView 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

interface PlantData {
  scientific_name: string;
  family: string;
  temperature_min: number;
  temperature_max: number;
  humidity_min: number;
  humidity_max: number;
  common_names?: string[];
  care_instructions?: string;
}

const PlantInfo = () => {
  const [plantName, setPlantName] = useState('');
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [loading, setLoading] = useState(false);

  const TREFL_API_KEY = 'rNdu5CGPtLfArrWBlu8O1qYtgXNO4bfM6f-b1ns9SC0';

  const fetchPlantInfo = async () => {
    if (!plantName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome de uma planta.');
      return;
    }

    setLoading(true);
    setPlantData(null);

    try {
      const response = await axios.get(
        `https://trefle.io/api/v1/plants/search`, {
          params: {
            token: TREFL_API_KEY,
            q: plantName.trim(),
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        const plant = response.data.data[0];
        
        // Valores padrão para plantas tropicais/subtropicais
        const defaultTempMin = 18;
        const defaultTempMax = 28;
        const defaultHumidityMin = 40;
        const defaultHumidityMax = 60;

        setPlantData({
          scientific_name: plant.scientific_name || 'Não disponível',
          family: plant.family || 'Não disponível',
          temperature_min: plant.temperature_min || defaultTempMin,
          temperature_max: plant.temperature_max || defaultTempMax,
          humidity_min: plant.humidity_min || defaultHumidityMin,
          humidity_max: plant.humidity_max || defaultHumidityMax,
          common_names: plant.common_names || [],
          care_instructions: `Regue regularmente mantendo o solo úmido. Prefere temperatura entre ${defaultTempMin}°C e ${defaultTempMax}°C e humidade entre ${defaultHumidityMin}% e ${defaultHumidityMax}%.`
        });
      } else {
        Alert.alert('Informação', 'Nenhuma planta encontrada com este nome.');
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados da planta:', error);
      let errorMessage = 'Falha ao buscar informações da planta.';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Erro de autenticação com a API.';
            break;
          case 404:
            errorMessage = 'Planta não encontrada.';
            break;
          case 429:
            errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = `Erro ${error.response.status}: ${error.response.data?.message || 'Erro desconhecido'}`;
        }
      } else if (error.request) {
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão com a internet.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome da Planta (em inglês)"
          value={plantName}
          onChangeText={setPlantName}
          placeholderTextColor="#666"
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={fetchPlantInfo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="search" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Dicas de Busca:</Text>
        <Text style={styles.helpText}>• Use nomes em inglês (ex: "rose", "tulip", "orchid")</Text>
        <Text style={styles.helpText}>• Você pode usar nomes comuns ou científicos</Text>
        <Text style={styles.helpText}>• Exemplos: "monstera", "snake plant", "peace lily"</Text>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Buscando informações...</Text>
        </View>
      )}
      
      {plantData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Informações da Planta</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.label}>Nome Científico:</Text>
            <Text style={styles.value}>{plantData.scientific_name}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Família:</Text>
            <Text style={styles.value}>{plantData.family}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Temperatura Ideal:</Text>
            <Text style={styles.value}>
              {plantData.temperature_min}°C - {plantData.temperature_max}°C
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Humidade Ideal:</Text>
            <Text style={styles.value}>
              {plantData.humidity_min}% - {plantData.humidity_max}%
            </Text>
          </View>

          {plantData.common_names && plantData.common_names.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.label}>Nomes Comuns:</Text>
              <Text style={styles.value}>{plantData.common_names.join(', ')}</Text>
            </View>
          )}

          {plantData.care_instructions && (
            <View style={styles.infoCard}>
              <Text style={styles.label}>Instruções de Cuidados:</Text>
              <Text style={styles.value}>{plantData.care_instructions}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  resultContainer: {
    padding: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default PlantInfo;
