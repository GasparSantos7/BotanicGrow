import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AlertSettings {
  lowHumidityThreshold: number;
  highHumidityThreshold: number;
  enableNotifications: boolean;
  enableSound: boolean;
  enableVibration: boolean;
}

class NotificationService {
  private alertSettings: AlertSettings = {
    lowHumidityThreshold: 30,
    highHumidityThreshold: 80,
    enableNotifications: true,
    enableSound: true,
    enableVibration: true,
  };

  private lastAlerts: { [sensorId: string]: { low: number; high: number } } = {};
  private isConfigured: boolean = false;
  private ALERT_HISTORY_KEY = 'alert_history';

  configure = async () => {
    try {
      // Carregar configurações salvas
      await this.loadSettings();

      // Pedir permissões de notificação
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permissão de notificações não concedida');
        this.isConfigured = false;
        return;
      }

      // Configurar canal de notificações (apenas Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('soil-moisture', {
          name: 'Soil Moisture Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          sound: this.alertSettings.enableSound ? 'default' : undefined,
          vibrationPattern: this.alertSettings.enableVibration ? [0, 250, 250, 250] : undefined,
          enableVibrate: this.alertSettings.enableVibration,
        });
      }
      this.isConfigured = true;
      console.log('Notificações configuradas com sucesso');
    } catch (error) {
      console.error('Erro ao configurar notificações:', error);
      this.isConfigured = false;
    }
  }

  // Carregar configurações salvas
  private loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('humidityAlertSettings');
      if (savedSettings) {
        this.alertSettings = { ...this.alertSettings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de alerta:', error);
    }
  }

  // Salvar configurações
  saveSettings = async (settings: Partial<AlertSettings>) => {
    try {
      this.alertSettings = { ...this.alertSettings, ...settings };
      await AsyncStorage.setItem('humidityAlertSettings', JSON.stringify(this.alertSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações de alerta:', error);
    }
  }

  // Obter configurações atuais
  getSettings = (): AlertSettings => {
    return { ...this.alertSettings };
  }

  // Enviar notificação local
  localNotification = async (title: string, message: string, data?: any) => {
    if (!this.alertSettings.enableNotifications || !this.isConfigured) {
      console.log('Notificações desabilitadas ou não configuradas');
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: data || {},
          sound: this.alertSettings.enableSound ? 'default' : undefined,
          subtitle: 'BotanicGrow',
        },
        trigger: null, // Imediato
      });
      console.log('Notificação local disparada:', title, message);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  // Verificar e enviar alertas de humidade
  checkHumidityAlert = (humidity: number, sensorId: string, plantName?: string) => {
    if (!this.alertSettings.enableNotifications || !this.isConfigured) return;

    const now = Date.now();
    const cooldownPeriod = 30 * 60 * 1000; // 30 minutos entre alertas do mesmo tipo

    // Inicializar histórico de alertas para este sensor
    if (!this.lastAlerts[sensorId]) {
      this.lastAlerts[sensorId] = { low: 0, high: 0 };
    }

    const plantLabel = plantName || `Vaso ${sensorId}`;

    // Verificar humidade baixa
    if (humidity < this.alertSettings.lowHumidityThreshold) {
      if (now - this.lastAlerts[sensorId].low > cooldownPeriod) {
        this.localNotification(
          "🌱 Alerta de Humidade Baixa",
          `${plantLabel}: Humidade em ${humidity}% - Solo muito seco!`,
          { sensorId, humidity, type: 'low' }
        );
        this.lastAlerts[sensorId].low = now;
        this.saveAlertHistory(sensorId, 'low', humidity, `${plantLabel}: Humidade em ${humidity}% - Solo muito seco!`);
      }
    }

    // Verificar humidade alta
    if (humidity > this.alertSettings.highHumidityThreshold) {
      if (now - this.lastAlerts[sensorId].high > cooldownPeriod) {
        this.localNotification(
          "💧 Alerta de Humidade Alta",
          `${plantLabel}: Humidade em ${humidity}% - Solo muito saturado!`,
          { sensorId, humidity, type: 'high' }
        );
        this.lastAlerts[sensorId].high = now;
        this.saveAlertHistory(sensorId, 'high', humidity, `${plantLabel}: Humidade em ${humidity}% - Solo muito saturado!`);
      }
    }
  }

  // Notificação de teste
  testNotification = () => {
    this.localNotification(
      "🧪 Teste de Notificação",
      "Sistema de alertas funcionando corretamente!",
      { type: 'test' }
    );
  }

  // Limpar todas as notificações
  clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }

  // Limpar histórico de alertas
  clearAlertHistory = () => {
    this.lastAlerts = {};
  }

  // Verificar se está configurado
  isNotificationConfigured = (): boolean => {
    return this.isConfigured;
  }

  // Guardar alerta no histórico local
  private async saveAlertHistory(sensorId: string, type: 'low' | 'high', humidity: number, message: string) {
    try {
      const saved = await AsyncStorage.getItem(this.ALERT_HISTORY_KEY);
      let history = saved ? JSON.parse(saved) : {};
      if (!history[sensorId]) history[sensorId] = [];
      history[sensorId].unshift({
        type,
        humidity,
        message,
        timestamp: Date.now(),
      });
      // Limitar a 50 alertas por sensor
      history[sensorId] = history[sensorId].slice(0, 50);
      await AsyncStorage.setItem(this.ALERT_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Erro ao guardar histórico de alertas:', e);
    }
  }

  // Obter histórico de alertas de um sensor
  async getAlertHistory(sensorId: string): Promise<any[]> {
    try {
      const saved = await AsyncStorage.getItem(this.ALERT_HISTORY_KEY);
      if (!saved) return [];
      const history = JSON.parse(saved);
      return history[sensorId] || [];
    } catch (e) {
      return [];
    }
  }
}

export default new NotificationService(); 