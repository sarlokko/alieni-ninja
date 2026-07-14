# Alieni Ninja

Landing page sci-fi e **videogioco** che uniscono **alieni extraterrestri** e **guerrieri ninja** contro l'invasione dei **Gatti Mannari**.

## Struttura

```
public/
  index.html        # Landing page
  game.html         # Videogioco
  css/
    style.css       # Stili landing
    game.css        # Stili gioco
  js/
    main.js         # Bottone "Lancia missione"
    game.js         # Motore di gioco canvas
package.json
```

## Gioca online (cellulare e remoto)

Il gioco è **online e giocabile subito**, senza account esterni:

- **Gioco:** https://cdn.jsdelivr.net/gh/sarlokko/alieni-ninja@gh-pages/game.html
- **Landing:** https://cdn.jsdelivr.net/gh/sarlokko/alieni-ninja@gh-pages/

Apri il link dal browser del cellulare. Controlli touch:
- **Joystick sinistro:** movimento
- **Joystick destro:** mira

> Ogni push su `main` pubblica automaticamente la versione aggiornata (branch `gh-pages` → CDN jsDelivr).

## Avvio locale

```bash
npm install
npm start
```

- Landing: [http://localhost:3000](http://localhost:3000)
- Gioco: [http://localhost:3000/game.html](http://localhost:3000/game.html)

### Grafica pixel e mondo VS
- **5 sprite pixel unici** per ogni eroe (Kael, Zara, Vex, Nia, Ryn)
- **Mondo ampio** 4800×3600 con camera che segue il personaggio
- **Viewport** 1280×720 — esplora la mappa come in Vampire Survivors
- Mini-mappa in basso a destra

## Videogioco: Ninja Alieni vs Gatti Mannari

Basato sulle idee del PDF di concept, il gioco include:

### Eroi giocabili (5 ninja alieni)
| Eroe | Ruolo | Speciale |
|------|-------|----------|
| **Kael** | Ninja furtivo, shuriken | Mimetizzazione |
| **Zara** | Leader, spade laser | Raffica Laser |
| **Vex** | Guerriero corazzato | Scudo Esplosivo |
| **Nia** | Agile, armi da lancio | Tempesta di Dardi |
| **Ryn** | Saggio arcano, bastone | Onda Arcana |

### 10 livelli
Addestramento → Città Alienigena → Bosco Infestato → Tempio Antico → Sottomondo Felino → Tempio delle Stelle → Battaglia sulla Luna → Città Maledetta → Rifugio delle Stelle → Confronto Finale

### 8 boss
Custode delle Stelle, Matrona degli Arcani, Guardiano Dimensionale, Drago Stellare, Signore del Caos, Matriarca del Mondo Felino, Re dei Gatti Mannari, Guardiano dell'Universo

### Obiettivo
Recuperare i 7 frammenti della **Lancia delle Stelle** e sconfiggere il Re dei Gatti Mannari.

### Controlli (stile Vampire Survivors)
- **WASD / Frecce** — solo movimento (le armi attaccano automaticamente)
- **↑↓ + Invio** — scegli power-up al level-up
- **Invio** — avanzare tra schermate

### Armi uniche per eroe
| Eroe | Arma | Stile VS |
|------|------|----------|
| **Kael** | Shuriken Orbitale | Orbitanti + scaglio al bersaglio vicino |
| **Zara** | Spada Laser | Arco di taglio frontale (Whip) |
| **Vex** | Burst di Plasma | Esplosione ad area (Garlic) |
| **Nia** | Dardi Cercatori | Auto-mira nemico più vicino (Magic Wand) |
| **Ryn** | Onda Arcana | Anelli espansivi (Holy Water) |

### Power-up
- **Level-up**: Potenza, Celerità, Quantità, Area, Agilità, Cuore Alieno, Magnete XP, Rigenerazione
- **Upgrade arma** specifico per ogni eroe
- **Pickup a terra**: cura, danno temporaneo, velocità, magnete XP

## Licenza

MIT
