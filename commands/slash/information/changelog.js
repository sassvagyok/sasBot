import { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import packageJson from "../../../package.json" with { type: "json" };
import log from"../../../data/changelog.json" with { type: "json" };

export default {
    name: "changelog",
    description: "A legutóbbi fontos változások",
    info: "A legutóbbi felhasználókat érintő változások.",
    run: async (client, interaction) => {
        
        const currentVersion = packageJson.version;
        const currentChangelog = log[log.length - 1];

        const changelogContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${currentChangelog.version} | <t:${currentChangelog.date}:D>`))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(currentChangelog.changelog))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Aktuális: ${currentVersion}`));

        interaction.reply({ components: [changelogContainer], flags: MessageFlags.IsComponentsV2 });
    }
}