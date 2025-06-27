import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { humidityMonitor } from '../services/humidityMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef } from 'react';
import notificationService from '../services/notification.service';

const PotDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: number };

  const [plantName, setPlantName] = useState('');
  const [humidity, setHumidity] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [alertHistory, setAlertHistory] = useState<any[]>([]);

  useEffect(() => {
    loadPotData();
    loadNotes();
    loadAlertHistory();
  }, [id]);

  const loadPotData = async () => {
    try {
      // Carregar nome salvo
      const savedName = await AsyncStorage.getItem(`plant_name_${id}`);
      if (savedName) {
        setPlantName(savedName);
      } else {
        const defaultNames = ['Suculenta', 'Orquídea', 'Samambaia', 'Cacto'];
        setPlantName(defaultNames[id - 1] || `Vaso ${id}`);
      }
      // Carregar humidade
      const data = await humidityMonitor.getCurrentData();
      if (data) {
        const sensorKey = `Humidade Sensor ${id}` as keyof typeof data;
        setHumidity(data[sensorKey] || null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do vaso:', error);
    }
  };

  const loadNotes = useCallback(async () => {
    const saved = await AsyncStorage.getItem(`plant_notes_${id}`);
    if (saved) setNotes(JSON.parse(saved));
    else setNotes([]);
  }, [id]);

  const loadAlertHistory = useCallback(async () => {
    const history = await notificationService.getAlertHistory(id.toString());
    setAlertHistory(history);
  }, [id]);

  const addNote = async () => {
    if (newNote.trim()) {
      const updated = [newNote.trim(), ...notes];
      setNotes(updated);
      setNewNote('');
      await AsyncStorage.setItem(`plant_notes_${id}`, JSON.stringify(updated));
    }
  };

  const removeNote = async (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    await AsyncStorage.setItem(`plant_notes_${id}`, JSON.stringify(updated));
  };

  const getStatusColor = (humidity: number | null) => {
    if (humidity === null) return '#9e9e9e';
    if (humidity < 30) return '#ff6b6b';
    if (humidity <= 70) return '#4ecdc4';
    if (humidity > 80) return '#ff6b6b';
    return '#3498db';
  };

  const getStatusText = (humidity: number | null) => {
    if (humidity === null) return 'Desconhecido';
    if (humidity < 30) return 'Seco';
    if (humidity <= 70) return 'Ideal';
    if (humidity > 80) return 'Saturado';
    return 'Humido';
  };

  const handleSave = async () => {
    if (plantName.trim()) {
      setIsEditing(false);
      await AsyncStorage.setItem(`plant_name_${id}`, plantName.trim());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      Alert.alert('Erro', 'Por favor, insira um nome para a planta.');
    }
  };

  const statusColor = getStatusColor(humidity);
  const statusText = getStatusText(humidity);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {showSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>Nome da planta atualizado!</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaso {id}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Ionicons name={isEditing ? "close" : "create"} size={24} color="#1a8756" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Informações da Planta */}
        <View style={styles.plantInfoCard}>
          <View style={styles.plantIconContainer}>
            <MaterialCommunityIcons name="flower" size={50} color={statusColor} />
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <Text style={styles.editLabel}>Nome da Planta:</Text>
              <TextInput
                style={styles.nameInput}
                value={plantName}
                onChangeText={setPlantName}
                placeholder="Digite o nome da planta"
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.plantName}>{plantName}</Text>
              <Text style={styles.plantSubtitle}>Vaso {id}</Text>
            </View>
          )}
        </View>

        {/* Status da Humidade */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Status da Humidade</Text>
          <View style={styles.humidityContainer}>
            <MaterialCommunityIcons name="water-percent" size={40} color="#3498db" />
            <View style={styles.humidityInfo}>
              <Text style={styles.humidityValue}>
                {humidity !== null ? `${Math.round(humidity)}%` : '--'}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>💡 Dicas para {plantName}</Text>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#1a8756" />
            <Text style={styles.tipText}>
              {humidity !== null && humidity < 30 
                ? 'Esta planta precisa de água! Considere regar imediatamente.'
                : humidity !== null && humidity > 80
                ? 'A humidade está muito alta. Reduza a frequência de rega.'
                : 'Mantenha o mesmo padrão de cuidados. A planta está saudável!'
              }
            </Text>
          </View>
        </View>

        {/* Notas/Diário */}
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>📝 Notas / Diário</Text>
          <View style={styles.addNoteRow}>
            <TextInput
              style={styles.noteInput}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Adicionar nota..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.addNoteButton} onPress={addNote}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {notes.length === 0 ? (
            <Text style={styles.noNotesText}>Sem notas ainda.</Text>
          ) : (
            notes.map((note, idx) => (
              <View key={idx} style={styles.noteRow}>
                <Text style={styles.noteText}>{note}</Text>
                <TouchableOpacity onPress={() => removeNote(idx)}>
                  <Ionicons name="trash" size={18} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Histórico de Alertas */}
        <View style={styles.alertHistoryCard}>
          <Text style={styles.sectionTitle}>🔔 Histórico de Alertas</Text>
          {alertHistory.length === 0 ? (
            <Text style={styles.noNotesText}>Sem alertas registados.</Text>
          ) : (
            alertHistory.map((alert, idx) => (
              <View key={idx} style={styles.alertRow}>
                <Ionicons
                  name={alert.type === 'low' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={18}
                  color={alert.type === 'low' ? '#ff6b6b' : '#3498db'}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.alertText}>{alert.message}</Text>
                <Text style={styles.alertDate}>{new Date(alert.timestamp).toLocaleString('pt-PT')}</Text>
              </View>
            ))
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications" size={24} color="#1a8756" />
            <Text style={styles.actionButtonText}>Configurar Alertas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics" size={24} color="#1a8756" />
            <Text style={styles.actionButtonText}>Ver Histórico</Text>
          </TouchableOpacity>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  plantInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantIconContainer: {
    marginBottom: 16,
  },
  nameContainer: {
    alignItems: 'center',
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  plantSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
  },
  editLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#1a8756',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  humidityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  humidityInfo: {
    marginLeft: 16,
  },
  humidityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  successBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#43a047',
    padding: 16,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 4,
  },
  successBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginRight: 8,
    backgroundColor: '#fafafa',
  },
  addNoteButton: {
    backgroundColor: '#1a8756',
    borderRadius: 8,
    padding: 8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  noNotesText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  alertHistoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  alertText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  alertDate: {
    fontSize: 12,
    color: '#888',
    minWidth: 90,
    textAlign: 'right',
  },
});

export default PotDetail;
