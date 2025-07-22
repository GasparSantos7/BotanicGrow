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
  ActionSheetIOS,
  Platform,
  Modal,
  Pressable,
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
  HumidityHistory: { sensorId: number };
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
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [plantNames, setPlantNames] = useState(['Suculenta', 'Orquídea']);

  // Estados para arrays de valores recentes
  const [humidade1Array, setHumidade1Array] = useState<number[]>([]);
  const [humidade2Array, setHumidade2Array] = useState<number[]>([]);

  // Estado para modal de ações
  const [selectedPot, setSelectedPot] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);

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
      if (sensorId === '1') {
        setHumidade1Array(prev => [...prev.slice(-4), humidity]);
      } else if (sensorId === '2') {
        setHumidade2Array(prev => [...prev.slice(-4), humidity]);
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
        setHumidade1Array(data["Humidade Sensor 1"] !== null ? [data["Humidade Sensor 1"]] : []);
        setHumidade2Array(data["Humidade Sensor 2"] !== null ? [data["Humidade Sensor 2"]] : []);
        setLastUpdate(Date.now());
        setMessage('');
      } else {
        setHumidade1Array([65]);
        setHumidade2Array([42]);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setHumidade1Array([65]);
      setHumidade2Array([42]);
      setLastUpdate(Date.now());
      setMessage('Usando dados de demonstração');
    }
    setLoading(false);
  };

  const loadPlantNames = async () => {
    const names = [];
    for (let i = 1; i <= 2; i++) {
      const savedName = await AsyncStorage.getItem(`plant_name_${i}`);
      if (savedName) {
        names.push(savedName);
      } else {
      const defaultNames = ['Suculenta', 'Orquídea'];
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

  // Função utilitária para média móvel
  function mediaMovel(valores: number[], n = 5) {
    if (!valores || valores.length === 0) return null;
    const ultimos = valores.slice(-n);
    const soma = ultimos.reduce((a, b) => a + b, 0);
    return soma / ultimos.length;
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

  // Função para abrir ações
  const openPotActions = (potId: number) => {
    setSelectedPot(potId);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        options: ['Cancelar', 'Ver Histórico', 'Configurar Alertas', 'Ver Detalhes'],
        cancelButtonIndex: 0,
      }, (buttonIndex) => {
        if (buttonIndex === 1) navigation.navigate('HumidityHistory', { sensorId: potId });
        if (buttonIndex === 2) navigation.navigate('AlertSettings');
        if (buttonIndex === 3) navigation.navigate('PotDetail', { id: potId });
      });
    } else {
      setShowActions(true);
    }
  };

  // Usa a média móvel para mostrar os valores
  const valorSuavizado1 = mediaMovel(humidade1Array, 5);
  const valorSuavizado2 = mediaMovel(humidade2Array, 5);
  const status1 = getPlantStatus(valorSuavizado1);
  const status2 = getPlantStatus(valorSuavizado2);
  const allHumidades = [valorSuavizado1, valorSuavizado2];
  const isAllAvailable = allHumidades.every(h => h !== null);
  const media = isAllAvailable ? Math.round(allHumidades.reduce((a, b) => a + (b || 0), 0) / 2) : null;
  const alertCount = allHumidades.filter(h => h !== null && (h < 30 || h > 80)).length;

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
              <Text style={styles.summaryValue}>2</Text>
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
        </View>

        {/* Grid de vasos */}
        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>🌱 Os seus Vasos</Text>
          <View style={styles.plantsGrid}>
            {[1, 2].map((item) => {
              const currentStatus = item === 1 ? status1 : status2;
              const currentHumidade = item === 1 ? valorSuavizado1 : valorSuavizado2;
              const plantName = plantNames[item - 1];

              return (
                <TouchableOpacity
                  style={styles.plantCard}
                  key={item}
                  activeOpacity={0.8}
                  onPress={() => openPotActions(item)}
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
                        {item === 1
                          ? (valorSuavizado1 !== null ? `${Math.round(valorSuavizado1)}%` : '--')
                          : (valorSuavizado2 !== null ? `${Math.round(valorSuavizado2)}%` : '--')}
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

      {/* Modal de ações rápidas para Android */}
      {showActions && (
        <Modal
          transparent
          animationType="fade"
          visible={showActions}
          onRequestClose={() => setShowActions(false)}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowActions(false)} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
            <TouchableOpacity style={{ padding: 16 }} onPress={() => { setShowActions(false); navigation.navigate('HumidityHistory', { sensorId: selectedPot }); }}>
              <Text style={{ fontSize: 18 }}>Ver Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16 }} onPress={() => { setShowActions(false); navigation.navigate('AlertSettings'); }}>
              <Text style={{ fontSize: 18 }}>Configurar Alertas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16 }} onPress={() => { setShowActions(false); navigation.navigate('PotDetail', { id: selectedPot }); }}>
              <Text style={{ fontSize: 18 }}>Ver Detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16 }} onPress={() => setShowActions(false)}>
              <Text style={{ fontSize: 18, color: 'red' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
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
