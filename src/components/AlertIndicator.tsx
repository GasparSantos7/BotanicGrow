import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { humidityMonitor } from '../services/humidityMonitor';

interface AlertIndicatorProps {
  onPress?: () => void;
}

const AlertIndicator: React.FC<AlertIndicatorProps> = ({ onPress }) => {
  const activeAlerts = humidityMonitor.getActiveAlerts();
  const hasAlerts = activeAlerts.length > 0;

  if (!hasAlerts) return null;

  return (
    <TouchableOpacity style={styles.iconOnlyContainer} onPress={onPress}>
      <Ionicons name="warning" size={28} color="#ff6b6b" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  alertBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default AlertIndicator; 