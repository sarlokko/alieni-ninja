const missionMessages = [
  "🛸 Rilevata flotta aliena nel settore Orion-7. Ninja in posizione.",
  "👽 Segnale extraterrestre decodificato: 'Arrivederci, Terra'. Risposta: shuriken plasmatico.",
  "🥷 Squadra Alpha infiltrata nella base nemica. Zero rumore, massima efficacia.",
  "🌌 Warp drive attivato. Destinazione: pianeta X-9. Missione: salvare l'universo.",
  "⚡ Fusione ninja-aliena completata. Potere cosmico al 100%.",
  "🔭 Telescopio intercetta messaggio: 'Siamo amici'. Verifica in corso... Falso allarme, era spam galattico.",
  "🗡️ Katana quantistica caricata. Pronti all'imboscata nello spazio profondo.",
  "👾 Invasori neutralizzati con tecnica segreta: Ombra Stellare Suprema.",
  "🚀 Astronave ninja in orbita. Tutti i sistemi verdi. Andiamo!",
  "🌠 Cometa ostile deviata. La Terra è al sicuro... per ora.",
];

const launchBtn = document.getElementById("launch-btn");
const missionMessage = document.getElementById("mission-message");

function getRandomMessage() {
  const index = Math.floor(Math.random() * missionMessages.length);
  return missionMessages[index];
}

launchBtn.addEventListener("click", () => {
  missionMessage.classList.remove("visible");

  setTimeout(() => {
    missionMessage.textContent = getRandomMessage();
    missionMessage.classList.add("visible");
  }, 200);
});
