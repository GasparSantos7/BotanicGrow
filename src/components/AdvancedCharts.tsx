import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { humidityMonitor } from '../services/humidityMonitor';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const AdvancedCharts = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedChart, setSelectedChart] = useState<'trend' | 'comparison' | 'distribution'>('trend');
  const [currentData, setCurrentData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [plantNames, setPlantNames] = useState(['Suculenta', 'Orquídea', 'Samambaia', 'Cacto']);

  useEffect(() => {
    loadCurrentData();
    loadHistoryData();
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
    loadPlantNames();
  }, [selectedPeriod]);

  const loadCurrentData = async () => {
    try {
      const data = await humidityMonitor.getCurrentData();
      setCurrentData(data);
    } catch (error) {
      console.error('Erro ao carregar dados atuais:', error);
    }
  };

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      // Período em dias
      let days = 7;
      if (selectedPeriod === 'month') days = 30;
      if (selectedPeriod === 'quarter') days = 90;
      // Buscar histórico para cada sensor
      const promises = [1,2,3,4].map(async (id) => {
        const history = await humidityMonitor.getHistory(id.toString(), days * 4); // 4 leituras por dia (ajuste se necessário)
        return { id, history };
      });
      const all = await Promise.all(promises);
      setHistoryData(all);
    } catch (error) {
      setHistoryData(null);
      console.error('Erro ao carregar histórico:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (humidity: number) => {
    if (humidity < 30) return '#ff6b6b';
    if (humidity <= 70) return '#4ecdc4';
    if (humidity > 80) return '#ff6b6b';
    return '#3498db';
  };

  const getInsights = () => {
    if (!currentData) return [];
    
    const insights = [];
    
    Object.entries(currentData).forEach(([key, value], index) => {
      if (value !== null) {
        const humidity = value as number;
        const plantName = plantNames[index];
        
        if (humidity < 30) {
          insights.push({
            type: 'warning',
            title: `${plantName} Precisa de Água`,
            text: `A humidade está baixa (${humidity}%). Considere regar imediatamente.`,
            icon: 'water-outline',
            color: '#ff6b6b'
          });
        } else if (humidity > 80) {
          insights.push({
            type: 'warning',
            title: `${plantName} Está Saturado`,
            text: `A humidade está muito alta (${humidity}%). Reduza a frequência de rega.`,
            icon: 'alert-circle-outline',
            color: '#ff6b6b'
          });
        } else if (humidity >= 30 && humidity <= 70) {
          insights.push({
            type: 'success',
            title: `${plantName} Está Ótimo`,
            text: `Mantenha o mesmo padrão de cuidados. Humidade ideal: ${humidity}%.`,
            icon: 'checkmark-circle-outline',
            color: '#4ecdc4'
          });
        }
      }
    });
    
    return insights.slice(0, 3);
  };

  // Gráfico de tendência (linha)
  const renderTrendChart = () => {
    if (!historyData) return null;
    const colors = ['#4ecdc4', '#43a047', '#ffb74d', '#ff6b6b'];
    // Pega até 20 pontos por planta para não poluir
    const datasets = historyData.map((pot, idx) => ({
      data: pot.history.slice(-20).map(h => h.humidity),
      color: () => colors[idx],
      strokeWidth: 2,
    }));
    const labels = historyData[0]?.history.slice(-20).map(h => {
      const d = new Date(h.timestamp);
      return `${d.getDate()}/${d.getMonth()+1}`;
    }) || [];
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📈 Tendência de Humidade</Text>
        <LineChart
          data={{
            labels,
            datasets: datasets.map((d, i) => ({ data: d.data, color: d.color, strokeWidth: d.strokeWidth }))
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#4CAF50' },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  // Gráfico de comparação (barras)
  const renderComparisonChart = () => {
    if (!historyData) return null;
    const colors = ['#4ecdc4', '#43a047', '#ffb74d', '#ff6b6b'];
    // Média de cada planta no período
    const values = historyData.map(pot => {
      if (!pot.history.length) return 0;
      return Math.round(pot.history.reduce((a, b) => a + b.humidity, 0) / pot.history.length);
    });
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 Comparação da Humidade Média</Text>
        <BarChart
          data={{
            labels: plantNames,
            datasets: [{ data: values }],
          }}
          width={Dimensions.get('window').width - 40}
          height={260}
          yAxisSuffix="%"
          fromZero
          showValuesOnTopOfBars
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1, index) => colors[index % colors.length],
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForBackgroundLines: { stroke: '#eee' },
            barPercentage: 0.6,
          }}
          style={styles.chart}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
          {plantNames.map((name, idx) => (
            <View key={name} style={{ alignItems: 'center' }}>
              <View style={{ width: 16, height: 16, backgroundColor: colors[idx], borderRadius: 4, marginBottom: 2 }} />
              <Text style={{ fontSize: 12, color: '#333' }}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Exportar histórico para CSV
  const exportarCSV = async () => {
    if (!historyData) return;
    let csv = 'Planta,Data,Hora,Humidade (%)\n';
    historyData.forEach((pot, idx) => {
      const nome = plantNames[idx];
      pot.history.forEach((h) => {
        const d = new Date(h.timestamp);
        const data = d.toLocaleDateString('pt-PT');
        const hora = d.toLocaleTimeString('pt-PT');
        csv += `${nome},${data},${hora},${h.humidity}\n`;
      });
    });
    const fileUri = FileSystem.cacheDirectory + `historico_humidade.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar Histórico de Humidade' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>📊 Análise Avançada</Text>
          <Text style={styles.subtitle}>Insights detalhados sobre as suas plantas</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Período Selector */}
        <View style={styles.periodContainer}>
          <Text style={styles.sectionTitle}>📅 Período de Análise</Text>
          <View style={styles.periodButtons}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.activeButton]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.activeButtonText]}>
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.activeButton]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.activeButtonText]}>
                Mês
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'quarter' && styles.activeButton]}
              onPress={() => setSelectedPeriod('quarter')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'quarter' && styles.activeButtonText]}>
                Trimestre
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {loading ? (
          <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <Text style={{ color: '#666' }}>A carregar dados...</Text>
          </View>
        ) : renderComparisonChart()}

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>💡 Insights Inteligentes</Text>
          {getInsights().map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                <Ionicons name={insight.icon as any} size={24} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>Dica do Dia</Text>
          <Text style={styles.tipText}>Verifique se as suas plantas recebem a quantidade ideal de luz. Muitas plantas precisam de luz indireta e não direta do sol.</Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#1a8756', padding: 12, borderRadius: 10, alignItems: 'center', margin: 20 }}
          onPress={exportarCSV}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Exportar Histórico para Excel (CSV)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#ffffff20',
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff90',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
  },
  periodContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#1a8756',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#fff',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  insightsContainer: {
    margin: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 12,
  },
  insightIcon: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AdvancedCharts; 