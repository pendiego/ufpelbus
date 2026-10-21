// scripts/resetViagens.js
const admin = require("firebase-admin");

// Não inicializa aqui: o runtime das Cloud Functions já faz isso.
// Para execução standalone (node resetViagens.js), inicialize com
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma service account.
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

const TAMANHO_BATCH = 450;

async function resetViagens() {
  const db = getDb(); // pega a instância correta
  console.log("[Reset] Iniciando reset de viagens ativas...");

  try {
    // 1. Limpar viagemAtualId dos usuários
    const usuariosSnapshot = await db
      .collection("usuarios")
      .where("viagemAtualId", "!=", null)
      .get();

    let countUsuarios = 0;
    let batch = db.batch();
    let opsNoBatch = 0;

    for (const doc of usuariosSnapshot.docs) {
      batch.update(doc.ref, { viagemAtualId: null });
      opsNoBatch++;
      countUsuarios++;
      if (opsNoBatch >= TAMANHO_BATCH) {
        await batch.commit();
        batch = db.batch();
        opsNoBatch = 0;
      }
    }
    if (opsNoBatch > 0) await batch.commit();
    console.log(`[Reset] viagemAtualId resetado para ${countUsuarios} usuários.`);

    // 2. Deletar todas as viagens ativas
    const viagensSnapshot = await db.collection("viagens_ativas").get();
    let countViagens = 0;
    batch = db.batch();
    opsNoBatch = 0;

    for (const doc of viagensSnapshot.docs) {
      batch.delete(doc.ref);
      opsNoBatch++;
      countViagens++;
      if (opsNoBatch >= TAMANHO_BATCH) {
        await batch.commit();
        batch = db.batch();
        opsNoBatch = 0;
      }
    }
    if (opsNoBatch > 0) await batch.commit();

    console.log(`[Reset] ${countViagens} viagens ativas removidas.`);
    console.log("[Reset] Processo concluído com sucesso!");
  } catch (error) {
    console.error("[Reset] Erro durante o reset:", error);
    throw error;
  }
}

if (require.main === module) {
  resetViagens()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { resetViagens };