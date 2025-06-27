import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import notificationService from '../services/notification.service';
import { humidityMonitor } from '../services/humidityMonitor';

type RootStackParamList = {
  HomeTabs: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AlertSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [settings, setSettings] = useState({
    enableNotifications: true,
    enableSound: true,
    enableVibration: true,
    lowHumidityThreshold: 30,
    highHumidityThreshold: 80,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = notificationService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<typeof settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await notificationService.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    }
  };

  const testNotification = () => {
    notificationService.testNotification();
    Alert.alert('Teste', 'Notificação de teste enviada!');
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Limpar Notificações',
      'Tem certeza que deseja limpar todas as notificações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            notificationService.clearAllNotifications();
            notificationService.clearAlertHistory();
            Alert.alert('Sucesso', 'Todas as notificações foram limpas');
          },
        },
      ]
    );
  };

  const getActiveAlerts = () => {
    return humidityMonitor.getActiveAlerts();
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#1a8756" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: '#1a8756' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderThresholdItem = (
    title: string,
    value: number,
    onValueChange: (value: number) => void,
    min: number,
    max: number,
    unit: string = '%'
  ) => (
    <View style={styles.thresholdItem}>
      <View style={styles.thresholdHeader}>
        <Text style={styles.thresholdTitle}>{title}</Text>
        <Text style={styles.thresholdValue}>{value}{unit}</Text>
      </View>
      <View style={styles.thresholdControls}>
        <TouchableOpacity
          style={styles.thresholdButton}
          onPress={() => onValueChange(Math.max(min, value - 5))}
        >
          <Ionicons name="remove" size={20} color="#1a8756" />
        </TouchableOpacity>
        <View style={styles.thresholdSlider}>
          <View style={[styles.thresholdFill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.thresholdButton}
          onPress={() => onValueChange(Math.min(max, value + 5))}
        >
          <Ionicons name="add" size={20} color="#1a8756" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const activeAlerts = getActiveAlerts();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Configurações</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status dos Alertas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Status dos Alertas</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <MaterialIcons name="notifications" size={24} color="#1a8756" />
              <Text style={styles.statusText}>
                {activeAlerts.length > 0 
                  ? `${activeAlerts.length} alerta(s) ativo(s)`
                  : 'Nenhum alerta ativo'
                }
              </Text>
            </View>
            {activeAlerts.length > 0 && (
              <View style={styles.alertsList}>
                {activeAlerts.map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Ionicons 
                      name={alert.type === 'low' ? 'water-outline' : 'alert-circle-outline'} 
                      size={16} 
                      color={alert.type === 'low' ? '#ff6b6b' : '#ff6b6b'} 
                    />
                    <Text style={styles.alertText}>
                      Vaso {alert.sensorId}: {alert.humidity}% ({alert.type === 'low' ? 'Seco' : 'Saturado'})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Configurações Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Configurações Gerais</Text>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              'notifications',
              'Ativar Notificações',
              'Receber alertas de humidade',
              settings.enableNotifications,
              (value) => saveSettings({ enableNotifications: value })
            )}
            {renderSettingItem(
              'volume-high',
              'Som',
              'Tocar som nas notificações',
              settings.enableSound,
              (value) => saveSettings({ enableSound: value })
            )}
            {renderSettingItem(
              'phone-portrait',
              'Vibração',
              'Vibrar nas notificações',
              settings.enableVibration,
              (value) => saveSettings({ enableVibration: value })
            )}
          </View>
        </View>

        {/* Limites de Humidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💧 Limites de Humidade</Text>
          <View style={styles.settingsCard}>
            {renderThresholdItem(
              'Humidade Mínima (Alerta Seco)',
              settings.lowHumidityThreshold,
              (value) => saveSettings({ lowHumidityThreshold: value }),
              10,
              50
            )}
            {renderThresholdItem(
              'Humidade Máxima (Alerta Saturado)',
              settings.highHumidityThreshold,
              (value) => saveSettings({ highHumidityThreshold: value }),
              60,
              100
            )}
          </View>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Ações</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={testNotification}>
              <Ionicons name="notifications" size={24} color="#1a8756" />
              <Text style={styles.actionButtonText}>Testar Notificação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={clearAllNotifications}>
              <Ionicons name="trash" size={24} color="#ff6b6b" />
              <Text style={[styles.actionButtonText, { color: '#ff6b6b' }]}>Limpar Notificações</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#1a8756',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '600',
  },
  alertsList: {
    marginTop: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  thresholdItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thresholdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a8756',
  },
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thresholdSlider: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  thresholdFill: {
    height: '100%',
    backgroundColor: '#1a8756',
    borderRadius: 2,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default AlertSettingsScreen; 