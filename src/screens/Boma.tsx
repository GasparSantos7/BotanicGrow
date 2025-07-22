import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, set, get, set as setDb, ref as dbRef } from 'firebase/database';
import { app } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ControloBomba() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAutoWateringEnabled, setIsAutoWateringEnabled] = useState(true);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const database = getDatabase(app);

  useEffect(() => {
    const releRef = ref(database, 'controle/rele');
    const unsubscribe = onValue(releRef, (snapshot) => {
      const value = snapshot.val();
      if (value !== null) {
        setIsEnabled(value);
      }
    }, (error) => {
      console.error("Erro ao ler estado do relé:", error);
      Alert.alert("Erro", "Não foi possível ler o estado da bomba");
    });

    const getAutoWatering = async () => {
      const stored = await AsyncStorage.getItem('autoWateringEnabled');
      setIsAutoWateringEnabled(stored === null ? true : stored === 'true');
    };
    getAutoWatering();

    const autoActiveRef = ref(database, 'controle/auto_active');
    const unsubAuto = onValue(autoActiveRef, (snap) => {
      setIsAutoActive(!!snap.val());
    });

    return () => { unsubscribe(); unsubAuto(); };
  }, []);

  const toggleSwitch = async () => {
    try {
      const releRef = ref(database, 'controle/rele');
      const manualOverrideRef = dbRef(database, 'controle/manual_override');
      const newState = !isEnabled;
      await set(releRef, newState);
      await set(manualOverrideRef, true);

      // Limpa temporizador anterior, se existir
      if (window.manualOverrideTimeout) {
        clearTimeout(window.manualOverrideTimeout);
      }

      // Se a bomba foi ligada, inicia temporizador para desligar após 5 minutos
      if (newState) {
        window.manualOverrideTimeout = setTimeout(async () => {
          await set(releRef, false); // Desliga a bomba
          await set(manualOverrideRef, false); // Remove override
        }, 300000); // 5 minutos
      } else {
        // Se desligaste manualmente, remove override imediatamente
        await set(manualOverrideRef, false);
      }

      console.log("Estado da bomba atualizado:", newState);
    } catch (error) {
      console.error("Erro ao atualizar estado do relé:", error);
      Alert.alert("Erro", "Não foi possível alterar o estado da bomba");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4cd137', '#2ecc71']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="water-pump" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Controlo da Bomba</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons 
            name={isEnabled ? "water-pump" : "water-pump-off"} 
            size={80} 
            color={isEnabled ? "#4cd137" : "#e74c3c"} 
          />
          <Text style={[styles.status, { color: isEnabled ? "#4cd137" : "#e74c3c" }]}>
            {isEnabled ? 'Bomba LIGADA' : 'Bomba DESLIGADA'}
          </Text>
        </View>

        <View style={styles.controlContainer}>
          <Text style={styles.controlLabel}>Estado da Bomba</Text>
          <Switch
            trackColor={{ false: "#e74c3c", true: "#4cd137" }}
            thumbColor={isEnabled ? "#ffffff" : "#f4f3f4"}
            ios_backgroundColor="#e74c3c"
            onValueChange={toggleSwitch}
            value={isEnabled}
            style={styles.switch}
            disabled={isAutoWateringEnabled && isAutoActive}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Informações</Text>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#f39c12" />
            <Text style={styles.infoText}>
              Certifique-se de que o reservatório de água está cheio antes de ativar a bomba.
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
