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

## Konfiguráció
1. Hozz létre a gyökérmappába egy `.env` fájlt:
```
mainToken=FŐ_DISCORD_TOKEN
testToken=TESZ_DISCORD_TOKEN
mongooseConnectionString=MONGOOSE_CONNECTION
devServerId=PRIVÁT_SZERVER
errorChannelId=CSATORNA_A_SZERVEREN_A_HIBÁKHOZ
feedbackChannelId=CSATORNA_A_SZERVEREN_A_VISSZAJELZÉSEKHEZ
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