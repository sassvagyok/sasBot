import { ActionRowBuilder, ButtonBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonStyle, } from "discord.js";

export default {
    name: "queue",
    description: "Lejátszási sor megjelenítése",
    info: "A lejátszási sorban lévő zenék megjelenítése. (Szükséges lehet hangcsatornához való csatlakozás)",
    dm_permission: false,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        let songs = guildQueue.songs.map(x => `${guildQueue.songs.indexOf(x)}. ${x.name} (${x.formattedDuration})`).splice(1);
        let formattedSongs = [];
        let allPages = 0;
        let currentPage = 1;
        let formatted = "";

        for (let i = 0; i < songs.length; i++) {
            if (formatted.length + songs[i].length > 1000) {
                allPages += 1
                formattedSongs.push(formatted);
                formatted = "" + songs[i] + "\n";
            } else formatted += songs[i] + "\n";

            if (i === songs.length - 1) {
                allPages += 1
                formattedSongs.push(formatted);
            }
        }

        const queueContainer = new ContainerBuilder()
        .setAccentColor(0x9327de);

        if (allPages === 1) {
            queueContainer
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejátszási sor: ${songs.length} zene \`(${guildQueue.formattedDuration})\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${formattedSongs[0]}\`\`\``));
            interaction.reply({ components: [queueContainer], flags: MessageFlags.IsComponentsV2 });
        } else {
            queueContainer
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejátszási sor: ${songs.length} zene \`(${guildQueue.formattedDuration})\` [${currentPage}/${allPages}]`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${formattedSongs[0]}\`\`\``));

            const prevButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId("prev")
            .setLabel("⬅️")
            .setDisabled(true);

            const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId("next")
            .setLabel("➡️");
            
            const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

            queueContainer.addActionRowComponents(row);

            const msg = await interaction.reply({ components: [queueContainer], flags: MessageFlags.IsComponentsV2 });

            const filter = (buttonInteraction) => {
                if (buttonInteraction.user.id === interaction.member.id) return true;
                else buttonInteraction.deferUpdate();
            }

            const collector = msg.createMessageComponentCollector({
                filter,
                time: 120000
            });

            collector.on("collect", async (ButtonInteraction) => {
                const id = ButtonInteraction.customId;

                if (id === "prev") {
                    if (currentPage > 1) {
                        currentPage -= 1;

                        row.components[1].setDisabled(false);
                        if (currentPage === 1) row.components[0].setDisabled(true);
                    } else await ButtonInteraction.deferUpdate();
                }

                if (id === "next") {
                    if (currentPage !== allPages) {
                        currentPage += 1;

                        row.components[0].setDisabled(false);
                        if (currentPage === allPages) row.components[1].setDisabled(true);
                    } else await ButtonInteraction.deferUpdate();
                }

                queueContainer
                .spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Lejátszási sor: ${songs.length} zene \`(${guildQueue.formattedDuration})\` [${currentPage}/${allPages}]`))
                .spliceComponents(2, 1, new TextDisplayBuilder().setContent(`\`\`\`${formattedSongs[currentPage - 1]}\`\`\``));

                await ButtonInteraction.update({ components: [queueContainer] });
            });

            collector.on("end", async () => {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);

                await interaction.editReply({ components: [queueContainer] });
            });
        }
    }
}