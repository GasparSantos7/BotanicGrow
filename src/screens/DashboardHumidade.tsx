import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert,
  Switch,
  Modal,
  Vibration,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { StatusBar } from 'expo-status-bar';
import { getDatabase, ref, onValue, off, set } from 'firebase/database';
import { app } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

interface SensorData { values: number[]; labels: string[]; timestamps: number[]; }

interface AllSensorData { [key: string]: SensorData; }

const SENSORS = [
  { id: '1', label: 'Vaso 1', icon: 'local_florist' },
  { id: '2', label: 'Vaso 2', icon: 'local_florist' },
  { id: '3', label: 'Vaso 3', icon: 'local_florist' },
  { id: '4', label: 'Vaso 4', icon: 'local_florist' },
];

const TIME_PERIODS = [
  { id: 'hour', label: '1h', dataPoints: 12 },
  { id: 'day', label: '24h', dataPoints: 24 },
  { id: 'week', label: '7d', dataPoints: 28 },
];

const HUMIDITY_THRESHOLDS = {
  critical_low: 25,
  low: 40,
  optimal_min: 55,
  optimal_max: 70,
  high: 85,
};

const HumidityDashboard = () => {
  const insets = useSafeAreaInsets();
  const [selectedSensor, setSelectedSensor] = useState(SENSORS[0]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIODS[0]);
  const [sensorData, setSensorData] = useState<AllSensorData>({
    '1': { values: [], labels: [], timestamps: [] },
    '2': { values: [], labels: [], timestamps: [] },
    '3': { values: [], labels: [], timestamps: [] },
    '4': { values: [], labels: [], timestamps: [] },
  });
  const [currentValues, setCurrentValues] = useState<{[key: string]: number | null}>({
    '1': null,
    '2': null,
    '3': null,
    '4': null,
  });
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(true);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [customThresholds, setCustomThresholds] = useState(HUMIDITY_THRESHOLDS);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertThresholds, setAlertThresholds] = useState({
    low: 40,
    high: 85,
  });
  const [chartOptions, setChartOptions] = useState({
    showGrid: true,
    showDots: true,
    smoothLine: true,
  });
  const [isAutoWateringEnabled, setIsAutoWateringEnabled] = useState(true);
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [autoWateringThreshold, setAutoWateringThreshold] = useState(30);
  const [autoWateringHysteresis, setAutoWateringHysteresis] = useState(5);
  const navigation = useNavigation();

  const theme = useMemo(() => ({
    background: darkMode ? '#121212' : '#f8faf5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    primary: darkMode ? '#4caf50' : '#2e7d32',
    secondary: darkMode ? '#81c784' : '#388e3c',
    text: darkMode ? '#ffffff' : '#1a1a1a',
    subtext: darkMode ? '#b0b0b0' : '#666666',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: darkMode ? '#66bb6a' : '#43a047',
    warning: darkMode ? '#ffb74d' : '#fbc02d',
    danger: darkMode ? '#ef5350' : '#e53935',
  }), [darkMode]);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const database = getDatabase(app);
        const sensorRefs = {
          '1': ref(database, '/sensor/Humidade_solo_1'),
          '2': ref(database, '/sensor/Humidade_solo_2'),
          '3': ref(database, '/sensor/Humidade_solo_3'),
          '4': ref(database, '/sensor/Humidade_solo_4'),
        };

        const unsubscribes = Object.entries(sensorRefs).map(([sensorId, sensorRef]) => {
          return onValue(sensorRef, (snapshot) => {
            const rawValue = snapshot.val();
            if (rawValue !== null && rawValue !== undefined) {
              let value: number | null = null;
              
              if (typeof rawValue === 'object' && rawValue !== null && 'humidity' in rawValue) {
                value = parseFloat(rawValue.humidity);
              } else if (typeof rawValue === 'number') {
                value = rawValue;
              } else if (typeof rawValue === 'string') {
                value = parseFloat(rawValue);
              }

              if (value !== null && !isNaN(value)) {
                setCurrentValues(prev => ({ ...prev, [sensorId]: value }));
                updateSensorData(sensorId, value);
              }
            }
          });
        });

        setIsLoading(false);
        return () => unsubscribes.forEach(unsubscribe => unsubscribe());
      } catch (err) {
        setError('Failed to initialize Firebase');
        console.error('Firebase initialization error:', err);
      }
    };

    initializeFirebase();
  }, []);

  useEffect(() => {
    const loadAutoWatering = async () => {
      const stored = await AsyncStorage.getItem('autoWateringEnabled');
      setIsAutoWateringEnabled(stored === null ? true : stored === 'true');
    };
    loadAutoWatering();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('autoWateringEnabled', isAutoWateringEnabled ? 'true' : 'false');
  }, [isAutoWateringEnabled]);

  useEffect(() => {
    const loadAutoWateringSettings = async () => {
      const t = await AsyncStorage.getItem('autoWateringThreshold');
      const h = await AsyncStorage.getItem('autoWateringHysteresis');
      if (t !== null) setAutoWateringThreshold(Number(t));
      if (h !== null) setAutoWateringHysteresis(Number(h));
    };
    loadAutoWateringSettings();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('autoWateringThreshold', String(autoWateringThreshold));
    AsyncStorage.setItem('autoWateringHysteresis', String(autoWateringHysteresis));
  }, [autoWateringThreshold, autoWateringHysteresis]);

  useEffect(() => {
    if (!isAutoWateringEnabled) {
      const database = getDatabase(app);
      const autoActiveRef = ref(database, 'controle/auto_active');
      set(autoActiveRef, false);
      return;
    }
    const database = getDatabase(app);
    const pumpRef = ref(database, 'controle/rele');
    const autoActiveRef = ref(database, 'controle/auto_active');

    const checkAndControlPump = () => {
      const values = Object.values(currentValues).filter(v => v !== null) as number[];
      if (values.length === 0) return;
      const anyBelow = values.some(v => v < autoWateringThreshold);
      const allAbove = values.every(v => v > (autoWateringThreshold + autoWateringHysteresis));

      if (anyBelow && !isPumpOn) {
        set(pumpRef, true);
        setIsPumpOn(true);
        set(autoActiveRef, true);
        console.log('Bomba LIGADA automaticamente');
      } else if (allAbove && isPumpOn) {
        set(pumpRef, false);
        setIsPumpOn(false);
        set(autoActiveRef, false);
        console.log('Bomba DESLIGADA automaticamente');
      }
    };

    checkAndControlPump();
  }, [currentValues, isAutoWateringEnabled, autoWateringThreshold, autoWateringHysteresis]);

  const updateSensorData = useCallback((sensorId: string, value: number) => {
    setSensorData(prev => {
      const sensorHistory = prev[sensorId] || { values: [], labels: [], timestamps: [] };
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const maxDataPoints = 48;
      
      return {
        ...prev,
        [sensorId]: {
          values: [...sensorHistory.values, value].slice(-maxDataPoints),
          labels: [...sensorHistory.labels, timeStr].slice(-maxDataPoints),
          timestamps: [...sensorHistory.timestamps, now.getTime()].slice(-maxDataPoints),
        },
      };
    });
  }, []);

  const getHumidityStatus = useCallback((value: number | null) => {
    if (value === null) return 'Sem dados';
    if (value <= customThresholds.critical_low) return 'Crítico';
    if (value <= customThresholds.low) return 'Seco';
    if (value <= customThresholds.optimal_max && value >= customThresholds.optimal_min) return 'Ótimo';
    if (value >= customThresholds.high) return 'Muito úmido';
    return 'Médio';
  }, [customThresholds]);

  const getStatusColor = useCallback((value: number | null) => {
    if (value === null) return theme.subtext;
    if (value <= customThresholds.critical_low) return theme.danger;
    if (value <= customThresholds.low) return theme.warning;
    if (value <= customThresholds.optimal_max && value >= customThresholds.optimal_min) return theme.success;
    if (value >= customThresholds.high) return theme.danger;
    return theme.warning;
  }, [customThresholds, theme]);

  const filteredSensorData = useMemo(() => {
    const currentData = sensorData[selectedSensor.id];
    if (!currentData || !currentData.values || currentData.values.length === 0) {
      return { values: [0], labels: ['00:00'] };
    }

    const now = new Date().getTime();
    let cutoffTime;
    
    switch (selectedTimePeriod.id) {
      case 'hour':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (60 * 60 * 1000);
    }

    const filtered = {
      values: [] as number[],
      labels: [] as string[]
    };

    for (let i = 0; i < currentData.timestamps.length; i++) {
      if (currentData.timestamps[i] >= cutoffTime) {
        filtered.values.push(currentData.values[i]);
        filtered.labels.push(currentData.labels[i]);
      }
    }

    if (filtered.values.length === 0) {
      return { values: [0], labels: ['Sem dados'] };
    }

    const maxPoints = selectedTimePeriod.dataPoints;
    if (filtered.values.length > maxPoints) {
      const step = Math.floor(filtered.values.length / maxPoints);
      const sampledValues: number[] = [];
      const sampledLabels: string[] = [];
      
      for (let i = 0; i < filtered.values.length; i += step) {
        sampledValues.push(filtered.values[i]);
        sampledLabels.push(filtered.labels[i]);
      }
      
      return { values: sampledValues, labels: sampledLabels };
    }

    return filtered;
  }, [sensorData, selectedSensor.id, selectedTimePeriod]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => setIsLoading(true)}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.primary }]}>
          A carregar os  dados de Humidade...
        </Text>
      </View>
    );
  }

  const currentValue = currentValues[selectedSensor.id];

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>

        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={[styles.title, { color: theme.text }]}>Monitor de Humidade</Text>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setIsSettingsVisible(true)}
          >
            <MaterialIcons name="settings" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

   
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sensorScroll}
          contentContainerStyle={styles.sensorContainer}
        >
          {SENSORS.map(sensor => (
            <TouchableOpacity
              key={sensor.id}
              style={[
                styles.sensorButton,
                { 
                  backgroundColor: selectedSensor.id === sensor.id ? 
                    theme.primary : theme.cardBackground,
                }
              ]}
              onPress={() => setSelectedSensor(sensor)}
            >
              <MaterialIcons 
                name={sensor.icon as any} 
                size={24} 
                color={selectedSensor.id === sensor.id ? '#fff' : theme.primary} 
              />
              <Text style={[
                styles.sensorText,
                { color: selectedSensor.id === sensor.id ? '#fff' : theme.text }
              ]}>
                {sensor.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current Value Display */}
        <View style={[styles.currentValueContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.currentValueLabel, { color: theme.subtext }]}>
            Humidade Atual
          </Text>
          <Text style={[styles.currentValue, { color: getStatusColor(currentValue) }]}>
            {currentValue !== null ? `${currentValue.toFixed(1)}%` : '--'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(currentValue) }
            ]} />
            <Text style={[styles.statusText, { color: getStatusColor(currentValue) }]}>
              {getHumidityStatus(currentValue)}
            </Text>
          </View>
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: theme.primary, padding: 10, borderRadius: 8, alignItems: 'center' }}
            onPress={() => navigation.navigate('HumidityHistory', { sensorId: selectedSensor.id })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ver Histórico</Text>
          </TouchableOpacity>
        </View>

        {/* Time Period Selection */}
        <View style={styles.timePeriodContainer}>
          {TIME_PERIODS.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.timePeriodButton,
                { 
                  backgroundColor: selectedTimePeriod.id === period.id ? 
                    theme.primary : theme.cardBackground,
                }
              ]}
              onPress={() => setSelectedTimePeriod(period)}
            >
              <Text style={[
                styles.timePeriodText,
                { 
                  color: selectedTimePeriod.id === period.id ? '#fff' : theme.text
                }
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
          <LineChart
            data={{
              labels: filteredSensorData.labels,
              datasets: [{ data: filteredSensorData.values }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.cardBackground,
              backgroundGradientFrom: theme.cardBackground,
              backgroundGradientTo: theme.cardBackground,
              decimalPlaces: 1,
              color: (opacity = 1) => theme.primary,
              labelColor: (opacity = 1) => theme.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: theme.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isSettingsVisible}
          onRequestClose={() => setIsSettingsVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Configurações
                </Text>
                <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                  <MaterialIcons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.settingsContent}>
                {/* Modo Escuro */}
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    Modo Escuro
                  </Text>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor={darkMode ? theme.secondary : "#f4f3f4"}
                  />
                </View>
                
                {/* Seção de Alertas */}
                <View style={styles.settingSection}>
                  <Text style={[styles.settingSectionTitle, { color: theme.text }]}>
                    Alertas
                  </Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      Ativar Alertas
                    </Text>
                    <Switch
                      value={isAlertsEnabled}
                      onValueChange={setIsAlertsEnabled}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor={isAlertsEnabled ? theme.secondary : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.thresholdInput}>
                    <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                      Alerta de Humidade Baixa (%)
                    </Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAlertThresholds(prev => ({ ...prev, low: Math.max(0, prev.low - 5) }))}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.numberValue, { color: theme.text }]}>
                        {alertThresholds.low}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAlertThresholds(prev => ({ ...prev, low: Math.min(100, prev.low + 5) }))}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.thresholdInput}>
                    <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                      Alerta de Humidade Alta (%)
                    </Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAlertThresholds(prev => ({ ...prev, high: Math.max(0, prev.high - 5) }))}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.numberValue, { color: theme.text }]}>
                        {alertThresholds.high}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAlertThresholds(prev => ({ ...prev, high: Math.min(100, prev.high + 5) }))}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.settingSection}>
                  <Text style={[styles.settingSectionTitle, { color: theme.text }]}>Rega Automática</Text>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Ativar Rega Automática</Text>
                    <Switch
                      value={isAutoWateringEnabled}
                      onValueChange={setIsAutoWateringEnabled}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor={isAutoWateringEnabled ? theme.secondary : "#f4f3f4"}
                    />
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Limiar de Humidade (%)</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAutoWateringThreshold(t => Math.max(0, t - 1))}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.numberValue, { color: theme.text }]}>{autoWateringThreshold}</Text>
                      <TouchableOpacity
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAutoWateringThreshold(t => Math.min(100, t + 1))}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Histerese (%)</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAutoWateringHysteresis(h => Math.max(1, h - 1))}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.numberValue, { color: theme.text }]}>{autoWateringHysteresis}</Text>
                      <TouchableOpacity
                        style={[styles.numberButton, { backgroundColor: theme.primary }]}
                        onPress={() => setAutoWateringHysteresis(h => Math.min(20, h + 1))}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.settingSection}>
                  <Text style={[styles.settingSectionTitle, { color: theme.text }]}>
                    Opções do Gráfico
                  </Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      Mostrar Grade
                    </Text>
                    <Switch
                      value={chartOptions.showGrid}
                      onValueChange={(value) => setChartOptions(prev => ({ ...prev, showGrid: value }))}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor={chartOptions.showGrid ? theme.secondary : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      Mostrar Pontos
                    </Text>
                    <Switch
                      value={chartOptions.showDots}
                      onValueChange={(value) => setChartOptions(prev => ({ ...prev, showDots: value }))}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor={chartOptions.showDots ? theme.secondary : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      Linha Suave
                    </Text>
                    <Switch
                      value={chartOptions.smoothLine}
                      onValueChange={(value) => setChartOptions(prev => ({ ...prev, smoothLine: value }))}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor={chartOptions.smoothLine ? theme.secondary : "#f4f3f4"}
                    />
                  </View>
                </View>

                {/* Botão de Reset */}
                <TouchableOpacity 
                  style={[styles.resetButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setCustomThresholds(HUMIDITY_THRESHOLDS);
                    setIsAlertsEnabled(true);
                    setAlertThresholds({ low: 40, high: 85 });
                    setChartOptions({ showGrid: true, showDots: true, smoothLine: true });
                  }}
                >
                  <Text style={[styles.resetButtonText, { color: theme.primary }]}>
                    Restaurar Padrões
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sensorScroll: {
    maxHeight: 80,
  },
  sensorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sensorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sensorText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  currentValueContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
  },
  currentValueLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePeriodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timePeriodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timePeriodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsContent: {
    maxHeight: 400,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  resetButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  settingSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  settingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  thresholdInput: {
    marginVertical: 10,
  },
  thresholdLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  numberValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
});

export default HumidityDashboard;