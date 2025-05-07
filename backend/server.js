const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Inicializar Firebase
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://botanicgrow-758e7-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = admin.database();
const firestore = admin.firestore(); // ✅ Usando Firestore
const app = express();
app.use(cors());
app.use(express.json());

// Variáveis globais
let Humidade1 = null;
let Humidade2 = null;
let Humidade3 = null;
let Humidade4 = null;

// Atualiza os dados dos sensores
const atualizarDados = async () => {
  try {
    const snapshot1 = await db.ref("sensor/Humidade_solo_1").once("value");
    const snapshot2 = await db.ref("sensor/Humidade_solo_2").once("value");
    const snapshot3 = await db.ref("sensor/Humidade_solo_3").once("value");
    const snapshot4 = await db.ref("sensor/Humidade_solo_4").once("value");

    Humidade1 = snapshot1.val();
    Humidade2 = snapshot2.val();
    Humidade3 = snapshot3.val();
    Humidade4 = snapshot4.val();

    console.log("Dados atualizados:");
    console.log("Humidade Sensor 1:", Humidade1);
    console.log("Humidade Sensor 2:", Humidade2);
    console.log("Humidade Sensor 3:", Humidade3);
    console.log("Humidade Sensor 4:", Humidade4);
  } catch (error) {
    console.error("Erro ao buscar dados do Firebase:", error);
  }
};

setInterval(atualizarDados, 60000); // Atualiza a cada 1 minuto

// Rota para obter os dados atuais
app.get("/umidade", (req, res) => {
  if (Humidade1 !== null && Humidade2 !== null && Humidade3 !== null && Humidade4 !== null) {
    return res.json({
      "Humidade Sensor 1": Humidade1,
      "Humidade Sensor 2": Humidade2,
      "Humidade Sensor 3": Humidade3,
      "Humidade Sensor 4": Humidade4,
    });
  } else {
    return res.status(404).json({
      error: "Dados não encontrados para um dos sensores",
      message: "Certifique-se de que os sensores estão configurados corretamente."
    });
  }
});

// ✅ Salvar histórico no Firestore
app.post("/umidade/historico", async (req, res) => {
  const { potId, humidity } = req.body;

  if (!potId || humidity === undefined) {
    return res.status(400).json({ error: "Faltam dados necessários (potId, humidity)" });
  }

  try {
    await firestore
      .collection("historico_umidade")
      .doc(potId)
      .collection("leituras")
      .add({
        humidity,
        timestamp: Date.now(),
        dataHora: new Date().toISOString(),
      });

    res.status(200).json({ message: "Histórico de umidade salvo na Firestore!" });
  } catch (error) {
    console.error("Erro ao salvar na Firestore:", error);
    res.status(500).json({ error: "Erro ao salvar histórico" });
  }
});

// ✅ Buscar histórico no Firestore
app.get("/umidade/historico/:potId", async (req, res) => {
  const { potId } = req.params;

  try {
    const snapshot = await firestore
      .collection("historico_umidade")
      .doc(potId)
      .collection("leituras")
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: `Nenhum histórico encontrado para o vaso ${potId}` });
    }

    const historico = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        humidity: data.humidity,
        timestamp: data.timestamp,
        dataFormatada: new Date(data.timestamp).toLocaleString("pt-PT"),
      };
    });

    res.status(200).json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico na Firestore:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  atualizarDados(); // Atualiza ao iniciar
});
