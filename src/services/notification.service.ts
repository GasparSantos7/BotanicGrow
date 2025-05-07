import PushNotification from 'react-native-push-notification';

class NotificationService {
  configure = () => {
    // Configurar notificações
    PushNotification.configure({
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
    });

    // Criar canal de notificação
    PushNotification.createChannel(
      {
        channelId: "soil-moisture",
        channelName: "Soil Moisture Alerts",
        channelDescription: "Alerts for soil moisture levels",
        playSound: true,
        soundName: "default",
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  // Enviar notificação local
  localNotification = (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: "soil-moisture",
      title: title,
      message: message,
      playSound: true,
      priority: "high",
    });
  }

  // Notificação para umidade crítica
  moistureAlert = (umidade: number) => {
    if (umidade < 20) {
      this.localNotification(
        "Alerta de Umidade Baixa",
        `A umidade do solo está em ${umidade}%, verifique o solo!`
      );
    }
  }
}

export default new NotificationService(); 