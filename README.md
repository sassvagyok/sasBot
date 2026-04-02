<h1 align="center">
    <img src="https://raw.githubusercontent.com/sassvagyok/sasBot-docs/refs/heads/main/media/icon_transparent.png" alt="sasBot" width="100">
    <br>
    sasBot Discord bot
</h1>
<p align="center">
    sasBot egy nyílt forráskódú, rendszeresen fejlesztett bot Moderálással, Zenelejátszással és szerver Konfigurálással, amit akár te is futtathatsz.
    <br>
    <br>
    <a href="https://github.com/sassvagyok/sasBot/tags">
        <img src="https://img.shields.io/github/v/tag/sassvagyok/sasBot?logo=github" alt="GitHub tag">
    </a>
    <a href="https://sasbot.mattexyz.com">
        <img src="https://img.shields.io/website?url=https%3A%2F%2Fsasbot.mattexyz.com&logo=readthedocs" alt="GitHub tag">
    </a>
</p>

## Tartalom
- [Funkciók](#funkciók)
- [Futtatás](#futtatás)
  - [Szükséges függőségek](#szükséges-függőségek)
  - [Projekt klónolása](#projekt-klónolása)
  - [Első konfiguráció](#első-konfiguráció)
  - [Indítás](#indítás)
  - [További konfiguráció](#további-konfiguráció)

## Funkciók
### Moderálás
- Tagok kitiltása, felfüggesztése (akár meghatározott időre és visszavonhatósággal), kirúgása, figyelmeztetése, mindezek indokkal.
- Csatornák lezárása (és megnyitása), valamint egyedi lassított üzemmód beállítása.
- Lehetőség moderációk elmentésére, privát üzenet küldésére moderálás után és log-csatorna beállítására.

### Szerver konfigurálás
- Automatikus rangadás, rangok megjegyzése tag kilépésekor, sasBot parancsainak ranghoz kötése és kikapcsolása.
- Egyedi parancsok és tagszámláló csatorna létrehozása.
- Egyedi üdvözlő és búcsúüzenet beállítása.

### Zenelejátszás
- Zenehallgatás több száz oldalról, akár automatikus lejátszással.
- Lejátszott zene kezelése: megállítás, átugrás és visszalépés, előre ugrás és újraindítás, ismétlés, hangerő állítása, zeneszöveg kiírása és filterek alkalmazása.
- Zenés-parancsok használata ranghoz vagy csatornához kötése.

### Mindenféle
- Profilképek, tag és szerverinformációk megjelenítése.
- Anime képek és gifek lekérése, szöveg ASCII képpé és emojivá alakítása és sok más!

### sasPont-rendszer
- Pontok gyűjtése sasBot interakciók után:
  - Napi 5 betűs magyar szó kitalálása, harcolás szavakkal, sasPont kaszinó crash és érmedobás játékkal.
- A legügyesebb tagok felkerülhetnek a globális vagy szerver ranglistára is.

**Ez csak a parancsok egy töredéke, minden parancs részletes leírása elérhető a [Dokumentációban](https://sasbot.mattexyz.com).**

## Futtatás
### Szükséges függőségek
- Node.js 22.x<=
- MongoDB
- FFMPEG

### Projekt klónolása
- **Stabil verzió:**
```bash
git clone -b main https://github.com/sassvagyok/sasBot.git
```
- VAGY fejlesztés alatt álló, nem stabil funkciókért:
```bash
git clone -b dev https://github.com/sassvagyok/sasBot.git
```

### Első konfiguráció
1. Hozz létre a gyökérmappába egy `.env` fájlt:
```
mainToken=[Fő Discord token]
testToken=[Másodlagos Discord token, ha tesztelnél (elhagyható)]
mongooseConnectionString=[Mongoose connection string, adatbázist használó funkciókhoz]
geniusToken=[Genius lyrics API key, enélkül a zeneszöveg lekérdezés megbízhathatlanul működhet]
devServerId=[Szerver, ahová a bot logol]
errorChannelId=[Csatorna a devServer-en, ahová a hibaüzenetek érkezzenek]
feedbackChannelId=[Csatorna a devServer-en, ahová a visszajelzések érkezzenek]
```
2. Futtasd az alábbi parancsot:
```
npm install
```

### Indítás
- Ha a fő Discord tokennel akarod futtatni:
```
npm start
```
- Ha a tesztelős Discord tokennel akarod futtatni:
```
npm run dev
```

### További konfiguráció
- A `config.json` módosításával az alábbiak konfigurálhatóak:
  - `status`: a bot státusz üzenete
  - `globallyDisabledCommands`: globálisan kikapcsolt parancsok listája
  - `docsURL`: dokumentáció linkje
  - `inviteURL`: bot meghívó linkje
  - `supportURL`: support szerver meghívó linkje
  - `githubURL`: Github repo linkje

<details>
<summary>Példa konfiguráció</summary>

```json
{
    "status": "/help",
    "globallyDisabledCommands": ["nekosia", "ötbetű"],
    "docsURL": "https://sasbot.mattexyz.com",
    "inviteURL": "https://discord.com/oauth2/authorize?client_id=742556187425505312&permissions=1099816889494&integration_type=0&scope=bot+applications.commands",
    "supportURL": "https://discord.gg/s8XtzBasQF",
    "githubURL": "https://github.com/sassvagyok/sasBot"
}
```

</details>