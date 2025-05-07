import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface Planta {
  id: string;
  nome: string;
  agua: string;
  vaso: string;
}

const PlantasScreen = () => {
  const [nome, setNome] = useState("");
  const [agua, setAgua] = useState("");
  const [vaso, setVaso] = useState("");
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [bombaLigada, setBombaLigada] = useState(false);

  const adicionarPlanta = async () => {
    if (nome.trim() === "" || agua.trim() === "" || vaso.trim() === "") return;

    const novaPlanta: Planta = {
      id: Math.random().toString(),
      nome,
      agua,
      vaso,
    };

    try {
      const docRef = await addDoc(collection(db, "plantas"), {
        nome,
        agua,
        vaso,
      });
      novaPlanta.id = docRef.id;
      setPlantas((prev) => [...prev, novaPlanta]);
    } catch (error) {
      console.error("Erro ao adicionar planta: ", error);
    }

    setNome("");
    setAgua("");
    setVaso("");
  };

  const alternarBomba = () => {
    setBombaLigada((prev) => !prev);
    // Aqui você pode adicionar integração com hardware/IoT se desejar
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Adicionar Planta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome da planta"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantidade de água (ex: 200ml/dia)"
        value={agua}
        onChangeText={setAgua}
      />
      <TextInput
        style={styles.input}
        placeholder="Vaso (ex: Cozinha, Sala, Varanda)"
        value={vaso}
        onChangeText={setVaso}
      />

      <TouchableOpacity style={styles.button} onPress={adicionarPlanta}>
        <Text style={styles.buttonText}>Adicionar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.bombaButton,
          { backgroundColor: bombaLigada ? "#d9534f" : "#5cb85c" },
        ]}
        onPress={alternarBomba}
      >
        <Text style={styles.bombaText}>
          {bombaLigada ? "🔴 Desligar Bomba" : "🟢 Ligar Bomba"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>🌿 Minhas Plantas</Text>
      <FlatList
        data={plantas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.agua}>💧 {item.agua}</Text>
            <Text style={styles.vaso}>🪴 {item.vaso}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "green",
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    elevation: 3,
  },
  nome: { fontSize: 18, fontWeight: "bold" },
  agua: { fontSize: 16, color: "#555" },
  vaso: { fontSize: 16, color: "#777" },
  bombaButton: {
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  bombaText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default PlantasScreen;
