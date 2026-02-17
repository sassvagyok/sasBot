<h1 align="center">
    <img src="https://raw.githubusercontent.com/sassvagyok/sasBot-docs/refs/heads/main/media/icon_transparent.png" alt="sasBot" width="150">
    <br>
    sasBot Discord bot
</h1>
<p align="center">
    sasBot egy nyílt forráskódú, rendszeresen fejlesztett bot Moderálással, Zenelejátszással és szerver Konfigurálással, amit akár te is futtathatsz.
</p>

## Szükséges
- Node.js 22.x<=
- MongoDB
- FFMPEG

## Első konfiguráció
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

## Használat
- Ha a fő Discord tokennel akarod futtatni:
```
npm start
```
- Ha a tesztelős Discord tokennel akarod futtatni:
```
npm run dev
```

## További konfiguráció
- A `data/config.json` módosításával az alábbi funkciók konfigurálhatóak:
  - `status`: a bot státusz üzenete
  - `globallyDisabledCommands`: globálisan kikapcsolt parancsok listája
- Példa:
```json
{
    "status": "/help",
    "globallyDisabledCommands": ["nekosia", "ötbetű"]
}
```
## Dokumentáció
- A parancsok leírása és műküdése elérhető itt: https://sassvagyok.github.io/sasBot-docs/