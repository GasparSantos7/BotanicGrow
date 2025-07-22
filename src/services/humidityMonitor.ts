import { firebaseDataService } from './firebaseDataService';
import notificationService from './notification.service';

type HumidityCallback = (value: number, sensorId: string) => void;

interface PlantInfo {
  name: string;
  type: string;
  optimalHumidity: {
    min: number;
    max: number;
  };
}

class HumidityMonitor {
  private callbacks: HumidityCallback[] = [];
  private plantInfo: { [key: string]: PlantInfo } = {};
  private isMonitoring: boolean = false;
  private lastValues: { [key: string]: number } = {};

  constructor() {
    // Configurar informações padrão das plantas
    this.plantInfo = {
      '1': { name: 'Vaso 1', type: 'Planta Geral', optimalHumidity: { min: 30, max: 80 } },
      '2': { name: 'Vaso 2', type: 'Planta Geral', optimalHumidity: { min: 30, max: 80 } },
    };
  }

  // Adicionar um callback para ser notificado de mudanças
  addListener(callback: HumidityCallback) {
    this.callbacks.push(callback);
    
    if (this.callbacks.length === 1) {
      this.startMonitoring();
    }
  }

  // Remover um callback
  removeListener(callback: HumidityCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
    
    if (this.callbacks.length === 0) {
      this.stopMonitoring();
    }
  }

  // Definir informações de uma planta
  setPlantInfo(sensorId: string, info: PlantInfo) {
    this.plantInfo[sensorId] = info;
  }

  // Obter informações de uma planta
  getPlantInfo(sensorId: string): PlantInfo | null {
    return this.plantInfo[sensorId] || null;
  }

  // Obter último valor conhecido de um sensor
  getLastValue(sensorId: string): number | null {
    return this.lastValues[sensorId] || null;
  }

  // Verificar se está monitorando
  isActive(): boolean {
    return this.isMonitoring;
  }

  // Obter dados atuais de todos os sensores
  async getCurrentData() {
    try {
      return await firebaseDataService.getCurrentHumidity();
    } catch (error) {
      console.error('Erro ao obter dados atuais:', error);
      return null;
    }
  }

  // Salvar histórico de humidade
  async saveHistory(potId: string, humidity: number) {
    try {
      await firebaseDataService.saveHumidityHistory(potId, humidity);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  // Obter histórico de humidade
  async getHistory(potId: string, limit: number = 100) {
    try {
      return await firebaseDataService.getHumidityHistory(potId, limit);
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Iniciando monitoramento de humidade...');

    // Usar o novo serviço Firebase
    firebaseDataService.startListening((data) => {
      // Atualizar valores locais
      Object.entries(data).forEach(([key, value]) => {
        const sensorId = key.replace('Humidade Sensor ', '');
        if (value !== null) {
          this.lastValues[sensorId] = value;
          
          // Notificar callbacks
          this.callbacks.forEach(callback => {
            callback(value, sensorId);
          });

          // Verificar alertas
          this.checkAlerts(value, sensorId);

          // Salvar histórico no Firestore
          this.saveHistory(sensorId, value);
        }
      });
    });
  }

  private checkAlerts(humidity: number, sensorId: string) {
    const plant = this.plantInfo[sensorId];
    if (!plant) return;

    // Verificar se está fora dos limites ótimos
    if (humidity < plant.optimalHumidity.min || humidity > plant.optimalHumidity.max) {
      notificationService.checkHumidityAlert(humidity, sensorId, plant.name);
    }
  }

  private stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('Parando monitoramento de humidade...');

    firebaseDataService.stopListening();
  }

  // Obter status de todos os sensores
  getAllStatus() {
    const status: { [key: string]: { value: number | null; plant: PlantInfo | null } } = {};
    
    ['1', '2'].forEach(sensorId => {
      status[sensorId] = {
        value: this.lastValues[sensorId] || null,
        plant: this.plantInfo[sensorId] || null
      };
    });

    return status;
  }

  // Verificar se há alertas ativos
  getActiveAlerts() {
    const alerts: { sensorId: string; humidity: number; type: 'low' | 'high' }[] = [];
    
    Object.entries(this.lastValues).forEach(([sensorId, humidity]) => {
      const plant = this.plantInfo[sensorId];
      if (!plant) return;

      if (humidity < plant.optimalHumidity.min) {
        alerts.push({ sensorId, humidity, type: 'low' });
      } else if (humidity > plant.optimalHumidity.max) {
        alerts.push({ sensorId, humidity, type: 'high' });
      }
    });

    return alerts;
  }

  // Obter estatísticas
  async getStats() {
    try {
      return await firebaseDataService.getHumidityStats();
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { average: 0, min: 0, max: 0, alertCount: 0 };
    }
  }
}

// Exportar uma única instância do monitor
export const humidityMonitor = new HumidityMonitor(); 