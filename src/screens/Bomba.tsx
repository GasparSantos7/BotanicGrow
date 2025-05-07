import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import axios from "axios";

const API_URL = "http://SEU_SERVIDOR:3000/bomba"; // Troca pelo IP do servidor

const App = () => {
  const [bombaLigada, setBombaLigada] = useState(false);

  useEffect(() => {
    // Pega o status atual da bomba ao iniciar o app
    axios.get(API_URL).then(response => {
      setBombaLigada(response.data.state === "on");
    }).catch(error => console.error("Erro ao buscar status:", error));
  }, []);

  const toggleBomba = async () => {
    const novoEstado = !bombaLigada;
    setBombaLigada(novoEstado);

    try {
      await axios.post(API_URL, { state: novoEstado ? "on" : "off" });
      Alert.alert("Sucesso", `Bomba ${novoEstado ? "Ligada" : "Desligada"}`);
    } catch (error) {
      console.error("Erro ao atualizar bomba:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Controla da Bomba</Text>

      <Button title={bombaLigada ? "Desligar Bomba" : "Ligar Bomba"} color={bombaLigada ? "red" : "green"} onPress={toggleBomba} />
    </View>
  );
};

export default App;
