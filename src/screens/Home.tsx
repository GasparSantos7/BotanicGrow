import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { auth } from '../firebaseConfig';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  PotDetail: { id: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PlantStatus {
  color: string;
  status: string;
}

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [userName, setUserName] = useState('');
  const [humidade1, setHumidade1] = useState<number | null>(null);
  const [humidade2, setHumidade2] = useState<number | null>(null);
  const [humidade3, setHumidade3] = useState<number | null>(null);
  const [humidade4, setHumidade4] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || 'Utilizador');
      }
    };
    fetchUserData();
  }, []);

  const fetchHumidadeData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.1.79:3000/umidade');
      setHumidade1(response.data["Humidade Sensor 1"]);
      setHumidade2(response.data["Humidade Sensor 2"]);
      setHumidade3(response.data["Humidade Sensor 3"]);
      setHumidade4(response.data["Humidade Sensor 4"]);
      setLastUpdate(Date.now());
      setMessage('');
    } catch (error) {
      console.error('Erro ao buscar dados da humidade:', error);
      setMessage('Falha ao buscar dados de humidade');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHumidadeData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHumidadeData();
    const intervalId = setInterval(fetchHumidadeData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  function getPlantStatus(humidade: number | null): PlantStatus {
    if (humidade === null) return { color: '#9e9e9e', status: 'Desconhecido' };
    if (humidade < 30) return { color: '#ff6b6b', status: 'Seco' };
    if (humidade <= 70) return { color: '#4ecdc4', status: 'Ideal' };
    return { color: '#3498db', status: 'Humido' };
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Nunca atualizado';
    const now = Date.now();
    const diff = Math.floor((now - lastUpdate) / 1000);
    if (diff < 60) return `Atualizado há ${diff} segundos`;
    if (diff < 3600) return `Atualizado há ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Atualizado há ${Math.floor(diff / 3600)} horas`;
    const date = new Date(lastUpdate);
    return `Atualizado em ${date.toLocaleDateString()}`;
  };

  const handleLogout = () => {
    Alert.alert("Sair da Conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          auth.signOut()
            .then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))
            .catch(error => {
              console.error('Erro ao fazer logout:', error);
              setMessage('Falha ao fazer logout');
            });
        }
      }
    ]);
  };

  const status1 = getPlantStatus(humidade1);
  const status2 = getPlantStatus(humidade2);
  const status3 = getPlantStatus(humidade3);
  const status4 = getPlantStatus(humidade4);

  const allHumidades = [humidade1, humidade2, humidade3, humidade4];
  const isAllAvailable = allHumidades.every(h => h !== null);
  const media = isAllAvailable ? Math.round(allHumidades.reduce((a, b) => a + (b || 0), 0) / 4) : null;
  const alertCount = allHumidades.filter(h => h !== null && h < 30).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a8756" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Bem-vindo,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a8756']} />}
      >
        <View style={styles.updateInfoContainer}>
          <Text style={styles.updateInfoText}>{formatLastUpdate()}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchHumidadeData} disabled={loading}>
            {loading ? <ActivityIndicator color="#1a8756" size="small" /> : <Ionicons name="refresh" size={20} color="#1a8756" />}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Resumo do Sistema</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#1a8756' }]}>
                <FontAwesome5 name="seedling" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>4</Text>
              <Text style={styles.summaryLabel}>Vasos</Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#3498db' }]}>
                <MaterialCommunityIcons name="water-percent" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>
                {media !== null ? `${media}%` : '--'}
              </Text>
              <Text style={styles.summaryLabel}>Média</Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: alertCount > 0 ? '#ff6b6b' : '#4ecdc4' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>{alertCount}</Text>
              <Text style={styles.summaryLabel}>Alerta</Text>
            </View>
          </View>
        </View>

        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>Os seus Vasos</Text>
          <View style={styles.plantsGrid}>
            {[1, 2, 3, 4].map((item) => {
              const currentStatus = item === 1 ? status1 : item === 2 ? status2 : item === 3 ? status3 : status4;
              const currentHumidade = item === 1 ? humidade1 : item === 2 ? humidade2 : item === 3 ? humidade3 : humidade4;

              return (
                <TouchableOpacity
                  style={styles.plantCard}
                  key={item}
                  onPress={() => navigation.navigate('PotDetail', { id: item })}
                >
                  <View style={styles.plantImageContainer}>
                    <MaterialCommunityIcons name="flower" size={40} color={currentStatus.color} />
                  </View>

                  <View style={styles.plantInfo}>
                    <Text style={styles.plantName}>Vaso {item}</Text>
                    <View style={styles.plantStatusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
                      <Text style={styles.plantStatus}>{currentStatus.status}</Text>
                    </View>
                  </View>

                  <View style={styles.humidadeContainer}>
                    <MaterialCommunityIcons name="water-percent" size={20} color="#3498db" />
                    <Text style={styles.humidadeValue}>
                      {currentHumidade !== null ? `${Math.round(currentHumidade)}%` : '--'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {message ? <Text style={styles.errorMessage}>{message}</Text> : null}

        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Dicas para Cuidar das Plantas</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="bulb-outline" size={24} color="#fff" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Dica do Dia</Text>
              <Text style={styles.tipText}>Verifique se suas plantas recebem a quantidade ideal de luz. Muitas plantas precisam de luz indireta.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert("Funcionalidade", "Adicionar novos vasos em breve!")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a8756',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#ffffff30',
    padding: 10,
    borderRadius: 30,
    marginRight: 10,
  },
  welcomeText: {
    color: '#ffffff90',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  updateInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateInfoText: {
    fontSize: 14,
    color: '#555',
  },
  refreshButton: {
    padding: 5,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  dashboardContainer: {
    marginBottom: 20,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '48%',
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  plantImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  plantInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  plantStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  plantStatus: {
    fontSize: 14,
    color: '#666',
  },
  humidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  humidadeValue: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
  errorMessage: {
    textAlign: 'center',
    color: 'red',
    marginTop: 10,
  },
  tipsContainer: {
    marginBottom: 80,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  tipIconContainer: {
    backgroundColor: '#1a8756',
    borderRadius: 30,
    padding: 10,
    marginRight: 12,
    alignSelf: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a8756',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});


export default HomeScreen;
