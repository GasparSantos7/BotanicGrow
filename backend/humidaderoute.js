const express = require('express');
const admin = require('firebase-admin');  // Importa o admin do Firebase para usar o Firestore
const db = require('./firebase');  // Importa a configuração do Firebase

const router = express.Router();

// Rota para salvar a umidade
router.post('/umidade', async (req, res) => {
  const { potId, humidity } = req.body;

  if (!potId || humidity === undefined) {
    return res.status(400).send('Faltam dados necessários');
  }

  try {
    // Salva a umidade no Firestore
    await db.collection('humidity').add({
      potId,
      humidity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),  // Adiciona um timestamp usando o admin.firestore
    });

    res.status(200).send('Dados de umidade salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar os dados de umidade:', error);
    res.status(500).send('Erro ao salvar os dados de umidade');
  }
});

// Rota para buscar o histórico de umidade
router.get('/umidade/historico/:potId', async (req, res) => {
  const { potId } = req.params;

  try {
    // Busca o histórico de umidade no Firestore
    const snapshot = await db
      .collection('humidity')
      .where('potId', '==', potId)
      .orderBy('timestamp', 'desc')  // Ordena por timestamp (do mais recente para o mais antigo)
      .get();

    if (snapshot.empty) {
      return res.status(404).send('Nenhum histórico encontrado');
    }

    const history = snapshot.docs.map(doc => doc.data());
    res.status(200).json(history);  // Retorna o histórico de umidade
  } catch (error) {
    console.error('Erro ao buscar o histórico:', error);
    res.status(500).send('Erro ao buscar o histórico');
  }
});

module.exports = router;
