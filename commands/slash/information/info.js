import { ActionRowBuilder, ButtonBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonStyle } from "discord.js";
import packageJson from "../../../package.json" with { type: "json" };

export default {
    name: "info",
    description: "Főbb információk sasBot-ról",
    info: "Rövid leírás sasBot-ról és elérhetőségek megjelenítése.",
    run: async (client, interaction) => {
        
        const gitButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.githubURL || "https://github.com/sassvagyok/sasBot")
        .setLabel("Github");

        const inviteButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.inviteURL || "https://discord.com/oauth2/authorize?client_id=742556187425505312&permissions=1099816889494&integration_type=0&scope=bot+applications.commands")
        .setLabel("Meghívás");

        const supportServerButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.supportURL || "https://discord.gg/s8XtzBasQF")
        .setLabel("Szerver");

        const docsButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.docsURL || "https://sasbot.mattexyz.com")
        .setLabel("Dokumentáció");

        const row = new ActionRowBuilder().addComponents(gitButton, inviteButton, supportServerButton, docsButton);

        const infoContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### sasBot ${packageJson.version}\nsasBot egy nyílt forráskódú Discord bot moderálással, zenelejátszással, szerver konfigurálással és sok mással, amit akár lokálisan is futtathatsz.`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Felhasznált projektek\n[CatFact.ninja](https://catfact.ninja/), [DisTube](https://www.npmjs.com/package/distube), [DivergenceMeter](https://github.com/FrancescoCaracciolo/DivergenceMeter), [figlet](https://www.npmjs.com/package/figlet), [genius-lyrics](https://www.npmjs.com/package/genius-lyrics), [nekos-best.js](https://www.npmjs.com/package/nekos-best.js), [nekosia.js](https://www.npmjs.com/package/nekosia.js), [The Cat API](https://thecatapi.com/)"))
        .addActionRowComponents(row);

        interaction.reply({ components: [infoContainer], flags: MessageFlags.IsComponentsV2 });
    }
}