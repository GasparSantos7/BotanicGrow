import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { humidityMonitor } from '../services/humidityMonitor';

type RootStackParamList = {
  HumidityHistory: { sensorId: number };
};

type HumidityHistoryScreenRouteProp = RouteProp<RootStackParamList, 'HumidityHistory'>;

interface HumidityData {
  timestamp: number;
  humidity: number;
}

interface Sensor {
  id: string;
  name: string;
  humidityHistory: HumidityData[];
}

const HumidityHistoryScreen = () => {
  const route = useRoute<HumidityHistoryScreenRouteProp>();
  const navigation = useNavigation();
  const { sensorId } = route.params;
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHumidityData();
    // Atualiza os dados a cada 5 minutos
    const interval = setInterval(fetchHumidityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHumidityData = async () => {
    try {
      // Usar o novo serviço para obter histórico
      const history = await humidityMonitor.getHistory(sensorId.toString(), 100);
      
      const humidityHistory: HumidityData[] = history.map(record => ({
        timestamp: record.timestamp,
        humidity: record.humidity
      }));

      humidityHistory.sort((a, b) => a.timestamp - b.timestamp);

      setSensor({
        id: sensorId.toString(),
        name: `Vaso ${sensorId}`,
        humidityHistory: humidityHistory
      });
    } catch (error) {
      console.error('Error fetching humidity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderChart = (sensor: Sensor) => {
    const chartData = {
      labels: sensor.humidityHistory.map(data => formatTimestamp(data.timestamp)),
      datasets: [
        {
          data: sensor.humidityHistory.map(data => data.humidity),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sensorName}>{sensor.name}</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#4CAF50',
            },
          }}
          bezier
          style={styles.chart}
        />
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Humidade (%)</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>A carregar dados de Humidade...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Humidade</Text>
        <Text style={styles.subtitle}>Vaso {sensorId}</Text>
      </View>
      
      {sensor && renderChart(sensor)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  chartContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sensorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default HumidityHistoryScreen; 