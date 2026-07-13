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

## Avvio locale

```bash
npm install
npm start
```

- Landing: [http://localhost:3000](http://localhost:3000)
- Gioco: [http://localhost:3000/game.html](http://localhost:3000/game.html)

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

### Controlli
- **WASD / Frecce** — movimento
- **Spazio / J** — attacco
- **E** — abilità speciale
- **Invio** — avanzare tra schermate

## Licenza

MIT
