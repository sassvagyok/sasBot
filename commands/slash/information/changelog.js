import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import packageJson from "../../../package.json" with { type: "json" };
import log from"../../../data/changelog.json" with { type: "json" };

export default {
    name: "changelog",
    description: "A legutóbbi vagy kiválasztott frissítés változáslistája",
    info: "A jelenlegi vagy kiválasztott sasBot verzió részletes változáslistája.",
    options: [
        {
            name: "verzió",
            description: "Választott verzió (pl.: v14.0; 14.30.1) (üres: legújabb)",
            type: ApplicationCommandOptionType.String,
            required: false
        } 
    ],
    run: async (client, interaction) => {
        
        const version = packageJson.version;

        let selectedVersion = interaction.options.getString("verzió") || log[log.length - 1].version;
        let selectedChangelog = log.find(x => x.version == selectedVersion);

        if (!selectedChangelog) return interaction.reply({ content: `A megadott verzió nem létezik! (1.0.0 - ${log[log.length - 1].version})`, flags: MessageFlags.Ephemeral });

        const changelogContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${selectedChangelog.version} | \`${selectedChangelog.date}\``))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(selectedChangelog.changelog))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Aktuális: ${version}`));

        interaction.reply({ components: [changelogContainer], flags: MessageFlags.IsComponentsV2 });
    }
}