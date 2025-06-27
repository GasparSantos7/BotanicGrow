import { ref, onValue, off, get, set, push, query, orderByChild, limitToLast } from 'firebase/database';
import { collection, addDoc, getDocs, query as firestoreQuery, orderBy, where, limit } from 'firebase/firestore';
import { db, firestore } from '../firebaseConfig';

interface HumidityData {
  "Humidade Sensor 1": number | null;
  "Humidade Sensor 2": number | null;
  "Humidade Sensor 3": number | null;
  "Humidade Sensor 4": number | null;
}

interface HistoricalRecord {
  id: string;
  humidity: number;
  timestamp: number;
  dataFormatada: string;
}

type HumidityCallback = (data: HumidityData) => void;

class FirebaseDataService {
  private listeners: HumidityCallback[] = [];
  private isListening: boolean = false;

  // Obter dados atuais de humidade
  async getCurrentHumidity(): Promise<HumidityData> {
    try {
      const snapshot1 = await get(ref(db, 'sensor/Humidade_solo_1'));
      const snapshot2 = await get(ref(db, 'sensor/Humidade_solo_2'));
      const snapshot3 = await get(ref(db, 'sensor/Humidade_solo_3'));
      const snapshot4 = await get(ref(db, 'sensor/Humidade_solo_4'));

      return {
        "Humidade Sensor 1": snapshot1.val(),
        "Humidade Sensor 2": snapshot2.val(),
        "Humidade Sensor 3": snapshot3.val(),
        "Humidade Sensor 4": snapshot4.val(),
      };
    } catch (error) {
      console.error('Erro ao obter dados de humidade:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  startListening(callback: HumidityCallback) {
    this.listeners.push(callback);
    
    if (!this.isListening) {
      this.isListening = true;
      
      // Escutar todos os sensores
      const sensorRefs = [
        ref(db, 'sensor/Humidade_solo_1'),
        ref(db, 'sensor/Humidade_solo_2'),
        ref(db, 'sensor/Humidade_solo_3'),
        ref(db, 'sensor/Humidade_solo_4'),
      ];

      sensorRefs.forEach((sensorRef, index) => {
        onValue(sensorRef, (snapshot) => {
          const value = snapshot.val();
          this.notifyListeners(index + 1, value);
        });
      });
    }
  }

  // Parar de escutar
  stopListening(callback?: HumidityCallback) {
    if (callback) {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    } else {
      this.listeners = [];
    }

    if (this.listeners.length === 0 && this.isListening) {
      this.isListening = false;
      // Desconectar do Firebase
      off(ref(db, 'sensor'));
    }
  }

  // Notificar listeners
  private notifyListeners(sensorId: number, value: number) {
    const data: HumidityData = {
      "Humidade Sensor 1": null,
      "Humidade Sensor 2": null,
      "Humidade Sensor 3": null,
      "Humidade Sensor 4": null,
    };

    // Obter valores atuais de todos os sensores
    this.getCurrentHumidity().then(currentData => {
      const updatedData = { ...currentData };
      updatedData[`Humidade Sensor ${sensorId}` as keyof HumidityData] = value;
      
      this.listeners.forEach(callback => callback(updatedData));
    });
  }

  // Salvar histórico no Firestore
  async saveHumidityHistory(potId: string, humidity: number): Promise<void> {
    try {
      await addDoc(collection(firestore, 'historico_umidade', potId, 'leituras'), {
        humidity,
        timestamp: Date.now(),
        dataHora: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      throw error;
    }
  }

  // Buscar histórico do Firestore
  async getHumidityHistory(potId: string, limitCount: number = 100): Promise<HistoricalRecord[]> {
    try {
      const q = firestoreQuery(
        collection(firestore, 'historico_umidade', potId, 'leituras'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          humidity: data.humidity,
          timestamp: data.timestamp,
          dataFormatada: new Date(data.timestamp).toLocaleString('pt-PT'),
        };
      });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // Salvar dados de humidade no Realtime Database (para backup)
  async saveHumidityBackup(data: HumidityData): Promise<void> {
    try {
      await set(ref(db, 'backup/humidity'), {
        ...data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao salvar backup:', error);
    }
  }

  // Obter estatísticas de humidade
  async getHumidityStats(): Promise<{
    average: number;
    min: number;
    max: number;
    alertCount: number;
  }> {
    try {
      const data = await this.getCurrentHumidity();
      const values = Object.values(data).filter(v => v !== null) as number[];
      
      if (values.length === 0) {
        return { average: 0, min: 0, max: 0, alertCount: 0 };
      }

      const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const alertCount = values.filter(v => v < 30 || v > 80).length;

      return { average, min, max, alertCount };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { average: 0, min: 0, max: 0, alertCount: 0 };
    }
  }

  // Verificar se há dados disponíveis
  async hasData(): Promise<boolean> {
    try {
      const data = await this.getCurrentHumidity();
      return Object.values(data).some(value => value !== null);
    } catch (error) {
      return false;
    }
  }
}

// Exportar uma única instância
export const firebaseDataService = new FirebaseDataService(); 