import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ControloVentoinha() {
  const [isEnabled, setIsEnabled] = useState(false);
  const database = getDatabase(app);

  useEffect(() => {
    const ventoinhaRef = ref(database, 'controle/ventoinha');
    const unsubscribe = onValue(ventoinhaRef, (snapshot) => {
      const value = snapshot.val();
      if (value !== null) {
        setIsEnabled(value);
      }
    }, (error) => {
      console.error("Erro ao ler estado da ventoinha:", error);
      Alert.alert("Erro", "Não foi possível ler o estado da ventoinha");
    });

    return () => unsubscribe();
  }, []);

  const toggleSwitch = async () => {
    try {
      const ventoinhaRef = ref(database, 'controle/ventoinha');
      await set(ventoinhaRef, !isEnabled);
      console.log("Estado da ventoinha atualizado:", !isEnabled);
    } catch (error) {
      console.error("Erro ao atualizar estado da ventoinha:", error);
      Alert.alert("Erro", "Não foi possível alterar o estado da ventoinha");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="fan" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Controlo da Ventoinha</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons 
            name={isEnabled ? "fan" : "fan-off"} 
            size={80} 
            color={isEnabled ? "#3498db" : "#e74c3c"} 
          />
          <Text style={[styles.status, { color: isEnabled ? "#3498db" : "#e74c3c" }]}>
            {isEnabled ? 'Ventoinha LIGADA' : 'Ventoinha DESLIGADA'}
          </Text>
        </View>

        <View style={styles.controlContainer}>
          <Text style={styles.controlLabel}>Estado da Ventoinha</Text>
          <Switch
            trackColor={{ false: "#e74c3c", true: "#3498db" }}
            thumbColor={isEnabled ? "#ffffff" : "#f4f3f4"}
            ios_backgroundColor="#e74c3c"
            onValueChange={toggleSwitch}
            value={isEnabled}
            style={styles.switch}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Informações</Text>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="information" size={24} color="#3498db" />
            <Text style={styles.infoText}>
              A ventoinha é utilizada para controlar a temperatura e circulação de ar no seu ambiente de cultivo.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#f39c12" />
            <Text style={styles.infoText}>
              Mantenha a ventoinha ligada durante o dia para garantir uma boa circulação de ar e temperatura adequada.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  status: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  controlContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  controlLabel: {
    fontSize: 18,
    marginBottom: 15,
    color: '#2c3e50',
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#34495e',
    lineHeight: 22,
  },
}); 