import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { onValue, ref, query, limitToLast } from 'firebase/database';
import { db } from '../firebaseConfig';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const sensors = [
  { id: 1, label: 'Sensor 1', path: '/sensor/Humidade_solo_1' },
  { id: 2, label: 'Sensor 2', path: '/sensor/Humidade_solo_2' },
  { id: 3, label: 'Sensor 3', path: '/sensor/Humidade_solo_3'},
  { id: 4, label: 'Sensor 4', path: '/sensor/Humidade_solo_4'},
];

const HumidityDashboard = () => {
  const [selectedSensor, setSelectedSensor] = useState(sensors[0]);
  const [humidityData, setHumidityData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedSensor) return;

    const sensorRef = query(ref(db, selectedSensor.path), limitToLast(7));

    const unsubscribe = onValue(sensorRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const humidities: number[] = [];
        const timestamps: string[] = [];

        Object.entries(data).forEach(([key, value]: any) => {
          humidities.push(value.umidade);
          timestamps.push(value.hora?.slice(11, 16) || key);
        });

        setHumidityData(humidities);
        setLabels(timestamps);
      }
    });

    return () => unsubscribe();
  }, [selectedSensor]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Umidade do Solo</Text>

      <View style={styles.sensorList}>
        {sensors.map(sensor => (
          <TouchableOpacity
            key={sensor.id}
            style={[
              styles.sensorButton,
              selectedSensor.id === sensor.id && styles.selectedButton,
            ]}
            onPress={() => setSelectedSensor(sensor)}
          >
            <Text
              style={[
                styles.sensorText,
                selectedSensor.id === sensor.id && styles.selectedText,
              ]}
            >
              {sensor.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <LineChart
        data={{
          labels,
          datasets: [{ data: humidityData }],
        }}
        width={screenWidth - 30}
        height={220}
        yAxisSuffix="%"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#f1f8e9',
          backgroundGradientTo: '#aed581',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(51, 105, 30, ${opacity})`,
          labelColor: () => '#33691e',
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2e7d32',
          },
        }}
        bezier
        style={styles.chart}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#f5f5f5', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#2e7d32' },
  sensorList: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' },
  sensorButton: {
    backgroundColor: '#c8e6c9',
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  selectedButton: {
    backgroundColor: '#2e7d32',
  },
  sensorText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#ffffff',
  },
  chart: { borderRadius: 12 },
});

export default HumidityDashboard;
