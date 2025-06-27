import { registerRootComponent } from 'expo';
import React, { useEffect } from 'react';
import Navigation from './src/Navigation';
import notificationService from './src/services/notification.service';
import * as Notifications from 'expo-notifications';

const App = () => {
  useEffect(() => {
    // Configurar notificações quando o app iniciar
    const initializeNotifications = async () => {
      try {
        await notificationService.configure();
        console.log('Sistema de notificações inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
      }
    };

    initializeNotifications();

    // Handler para mostrar notificações mesmo com o app aberto
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return <Navigation />;
};

registerRootComponent(App);
