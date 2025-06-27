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
  Alert,
} from 'react-native';
import { auth } from '../firebaseConfig';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { humidityMonitor } from '../services/humidityMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: undefined;
  PotDetail: { id: number };
  AlertSettings: undefined;
  AdvancedCharts: undefined;
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
  const [plantNames, setPlantNames] = useState(['Suculenta', 'Orquídea', 'Samambaia', 'Cacto']);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || 'Utilizador');
      }
    };
    fetchUserData();

    // Configurar monitor de humidade
    const handleHumidityChange = (humidity: number, sensorId: string) => {
      switch (sensorId) {
        case '1':
          setHumidade1(humidity);
          break;
        case '2':
          setHumidade2(humidity);
          break;
        case '3':
          setHumidade3(humidity);
          break;
        case '4':
          setHumidade4(humidity);
          break;
      }
      setLastUpdate(Date.now());
    };

    humidityMonitor.addListener(handleHumidityChange);

    // Carregar dados iniciais
    loadInitialData();

    // Cleanup
    return () => {
      humidityMonitor.removeListener(handleHumidityChange);
    };
  }, []);

  // Recarregar nomes das plantas sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      loadPlantNames();
    }, [])
  );

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await humidityMonitor.getCurrentData();
      if (data) {
        setHumidade1(data["Humidade Sensor 1"]);
        setHumidade2(data["Humidade Sensor 2"]);
        setHumidade3(data["Humidade Sensor 3"]);
        setHumidade4(data["Humidade Sensor 4"]);
        setLastUpdate(Date.now());
        setMessage('');
      } else {
        // Dados simulados para demonstração
        setHumidade1(65);
        setHumidade2(42);
        setHumidade3(78);
        setHumidade4(35);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      // Dados simulados em caso de erro
      setHumidade1(65);
      setHumidade2(42);
      setHumidade3(78);
      setHumidade4(35);
      setLastUpdate(Date.now());
      setMessage('Usando dados de demonstração');
    }
    setLoading(false);
  };

  const loadPlantNames = async () => {
    const names = [];
    for (let i = 1; i <= 4; i++) {
      const savedName = await AsyncStorage.getItem(`plant_name_${i}`);
      if (savedName) {
        names.push(savedName);
      } else {
        const defaultNames = ['Suculenta', 'Orquídea', 'Samambaia', 'Cacto'];
        names.push(defaultNames[i - 1]);
      }
    }
    setPlantNames(names);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  function getPlantStatus(humidade: number | null): PlantStatus {
    if (humidade === null) return { color: '#9e9e9e', status: 'Desconhecido' };
    if (humidade < 30) return { color: '#ff6b6b', status: 'Seco' };
    if (humidade <= 70) return { color: '#4ecdc4', status: 'Ideal' };
    if (humidade > 80) return { color: '#ff6b6b', status: 'Saturado' };
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

  const handleAlertSettings = () => {
    navigation.navigate('AlertSettings');
  };

  const handleAdvancedCharts = () => {
    navigation.navigate('AdvancedCharts');
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
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Bem-vindo de volta,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleAlertSettings} style={styles.headerButton}>
              <Ionicons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a8756']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status de atualização */}
        <View style={styles.updateInfoContainer}>
          <View style={styles.updateInfoLeft}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.updateInfoText}>{formatLastUpdate()}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadInitialData} disabled={loading}>
            {loading ? <ActivityIndicator color="#1a8756" size="small" /> : <Ionicons name="refresh" size={20} color="#1a8756" />}
          </TouchableOpacity>
        </View>

        {/* Cards de resumo */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>📊 Resumo do Sistema</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#4ecdc4' }]}>
                <FontAwesome5 name="seedling" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>4</Text>
              <Text style={styles.summaryLabel}>Vasos Ativos</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#3498db' }]}>
                <MaterialCommunityIcons name="water-percent" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>
                {media !== null ? `${media}%` : '--'}
              </Text>
              <Text style={styles.summaryLabel}>Média Geral</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: alertCount > 0 ? '#ff6b6b' : '#4ecdc4' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.summaryValue}>{alertCount}</Text>
              <Text style={styles.summaryLabel}>Alertas</Text>
            </View>
          </View>
          
          {/* Botão para Análise Avançada */}
          <TouchableOpacity style={styles.advancedButton} onPress={handleAdvancedCharts}>
            <View style={styles.advancedButtonContent}>
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.advancedButtonText}>Ver Análise Avançada</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Grid de vasos */}
        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>🌱 Os seus Vasos</Text>
          <View style={styles.plantsGrid}>
            {[1, 2, 3, 4].map((item) => {
              const currentStatus = item === 1 ? status1 : item === 2 ? status2 : item === 3 ? status3 : status4;
              const currentHumidade = item === 1 ? humidade1 : item === 2 ? humidade2 : item === 3 ? humidade3 : humidade4;
              const plantName = plantNames[item - 1];

              return (
                <TouchableOpacity
                  style={styles.plantCard}
                  key={item}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PotDetail', { id: item })}
                >
                  <View style={styles.plantCardContent}>
                    <View style={styles.plantImageContainer}>
                      <View style={[styles.plantIconContainer, { backgroundColor: currentStatus.color + '20' }]}>
                        <MaterialCommunityIcons name="flower" size={32} color={currentStatus.color} />
                      </View>
                    </View>

                    <View style={styles.plantInfo}>
                      <Text style={styles.plantName}>{plantName}</Text>
                      <Text style={styles.plantSubtitle}>Vaso {item}</Text>
                      <View style={styles.plantStatusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
                        <Text style={[styles.plantStatus, { color: currentStatus.color }]}>{currentStatus.status}</Text>
                      </View>
                    </View>

                    <View style={styles.humidadeContainer}>
                      <MaterialCommunityIcons name="water-percent" size={16} color="#3498db" />
                      <Text style={styles.humidadeValue}>
                        {currentHumidade !== null ? `${Math.round(currentHumidade)}%` : '--'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {message ? <Text style={styles.errorMessage}>{message}</Text> : null}

        {/* Dicas */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>💡 Dicas para Cuidar das Plantas</Text>
          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: '#1a8756' }]}>
              <Ionicons name="bulb-outline" size={24} color="#fff" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Dica do Dia</Text>
              <Text style={styles.tipText}>Verifique se suas plantas recebem a quantidade ideal de luz. Muitas plantas precisam de luz indireta e não direta do sol.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botão de adicionar vasos removido */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1a8756',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    padding: 12,
    borderRadius: 35,
    marginRight: 12,
    elevation: 2,
  },
  welcomeText: {
    color: '#ffffff90',
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  updateInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updateInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  summaryIcon: {
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dashboardContainer: {
    marginBottom: 25,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  plantCardContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  plantImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  plantIconContainer: {
    padding: 12,
    borderRadius: 20,
  },
  plantInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  plantSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  plantStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  plantStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  humidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 12,
  },
  humidadeValue: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
  errorMessage: {
    textAlign: 'center',
    color: '#ff6b6b',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  tipsContainer: {
    marginBottom: 100,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tipIconContainer: {
    borderRadius: 25,
    padding: 12,
    marginRight: 16,
    alignSelf: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  advancedButton: {
    backgroundColor: '#1a8756',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  advancedButtonContent: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
});

export default HomeScreen;
