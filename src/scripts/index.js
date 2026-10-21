// functions/index.js
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { resetViagens } = require("./resetViagens");

exports.resetViagensAgendado = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "America/Sao_Paulo",
    memory: "512MiB",
    timeoutSeconds: 540,
    retryCount: 0,
  },
  async () => {
    await resetViagens();
  }
);