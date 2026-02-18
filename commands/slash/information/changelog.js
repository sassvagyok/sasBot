import { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import packageJson from "../../../package.json" with { type: "json" };
import log from"../../../data/changelog.json" with { type: "json" };

export default {
    name: "changelog",
    description: "A legutóbbi fontos változások",
    info: "A legutóbbi felhasználókat érintő változások.",
    run: async (client, interaction) => {
        
        const version = packageJson.version;
        let selectedChangelog = log[log.length - 1];

        const date = new Date(selectedChangelog.date * 1000);
        const formatted = date.toLocaleDateString('hu-HU');

        const changelogContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${selectedChangelog.version} | \`${formatted}\``))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(selectedChangelog.changelog))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Aktuális: ${version}`));

        interaction.reply({ components: [changelogContainer], flags: MessageFlags.IsComponentsV2 });
    }
}