<h1 align="center">
    <img src="https://raw.githubusercontent.com/sassvagyok/sasBot-docs/refs/heads/main/media/icon_transparent.png" alt="sasBot" width="150">
    <br>
    sasBot Discord bot
</h1>
<p align="center">
    sasBot egy nyílt forráskódú, rendszeresen fejlesztett bot Moderálással, Zenelejátszással és szerver Konfigurálással, amit akár te is futtathatsz.
</p>

## Funkciók
### Moderálás
- Tagok kitiltása, felfüggesztése (akár meghatározott időre, visszavonással), kirúgása, figyelmeztetése indokkal és lehetőség ezek mentésére.
- Csatornák lezárása (és megnyitása), valamint egyedi lassított üzemmód beállítása.
- Privát üzenet küldése moderálás után és log-csatorna beállítására.

### Szerver konfigurálás
- Automatikus rangadás, rangok megjegyzése tag kilépésekor és sasBot parancsainak ranghoz kötése és kikapcsolása.
- Egyedi parancsok létrehozása, tagszámláló csatorna.
- Egyedi üdvözlő és búcsúüzenet beállítása.

### Zenelejátszás
- Zenehallgatás több száz oldalról, akár automatikus lejátszással.
- Lejátszott zene kezelése: megállítás, átugrás és visszalépés, előre ugrás és újraindítás, ismétlés, hangerő állítása, zeneszöveg kiírása és filterek alkalmazása.
- Zenés-parancsok ranghoz vagy csatornához kötése egyszerűen.

### Mindenféle
- Profilképek megjelenítése, tag és szerverinformációk.
- Anime képek és gifek lekérése, szöveg ASCII képpé és emojivá alakítása és sok más!

### sasPont-rendszer
- Pontok gyűjtése sasBot interakciók után:
  - Napi 5 betűs magyar szó kitalálása, harcolás szavakkal és sasPont kaszinó crash és érmedobás játékkal.
- A legügyesebb tagok felkerülhetnek a globális vagy szerver ranglistára is.

**Ez csak a parancsok egy töredéke, minden parancs részletes leírása elérhető a [Dokumentációban](https://sasbot.mattexyz.com).**

## Futtatás
### Szükséges
- Node.js 22.x<=
- MongoDB
- FFMPEG

### Első konfiguráció
1. Hozz létre a gyökérmappába egy `.env` fájlt és töltsd ki a saját adataiddal:
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
- A `config.json` módosításával az alábbi funkciók konfigurálhatóak:
  - `status`: a bot státusz üzenete
  - `globallyDisabledCommands`: globálisan kikapcsolt parancsok listája
  - `docsURL`: dokumentáció linkje,
  - `inviteURL`: bot meghívó linkje,
  - `supportURL`: support szerver meghívó linkje,
  - `githubURL`: Github repo linkje

<details>
<summary>Példa</summary>

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