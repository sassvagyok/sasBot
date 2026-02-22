import { ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moderationSchema from "../../../models/moderationlogModel.js";

export default {
    name: "timeouts",
    description: "Tagok felfüggesztési előzményei",
    info: "Megadott tag sasBot általi felfüggesztései.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "tag",
            description: "Tagok, akinek meg legyenek jelenítve a korábbi felfüggesztései",
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    run: async (client, interaction) => {

        const target = interaction.options.getUser("tag");
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        const moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        if (!moderationData) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        if (moderationData.Timeouts.length === 0) await interaction.reply({ content: "A megadott tagnak nincsenek feljegyzett felfüggesztései!", flags: MessageFlags.Ephemeral });
        else {
            const timeoutsContainer = new ContainerBuilder()
            .setAccentColor(0xff9d02)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Felfüggesztések: \`${memberTarget.user.username}\` [1/1]`))
            .addSeparatorComponents(new SeparatorBuilder());

            const loadFunction = async (i) => {
                let modAuthor = await client.users.fetch(moderationData.Timeouts[i].Author.replace(/\D/g,""));
                
                return new TextDisplayBuilder()
                .setContent(`**#${moderationData.Timeouts[i].Number}** \`${moderationData.Timeouts[i].Date}\`\n${moderationData.Timeouts[i].Reason ? `- Indok: "${moderationData.Timeouts[i].Reason}"\n- \`${moderationData.Timeouts[i].Length}\` | ${moderationData.Timeouts[i].Author} (${modAuthor.username})` : 
                    `- \`${moderationData.Timeouts[i].Length}\` | ${moderationData.Timeouts[i].Author} (${modAuthor.username})`}`);
            }

            if (moderationData.Timeouts.length < 6) {
                let textArray = [];
                for (let i = moderationData.Timeouts.length - 1; i > -1; i-= 1) textArray.push(await loadFunction(i));

                timeoutsContainer.addTextDisplayComponents(textArray);

                interaction.reply({ components: [timeoutsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

            } else {
                const prevButton = new ButtonBuilder()
                .setStyle("Primary")
                .setCustomId("prev")
                .setLabel("⬅️")
                .setDisabled(true);

                const nextButton = new ButtonBuilder()
                .setStyle("Primary")
                .setCustomId("next")
                .setLabel("➡️");

                const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

                let allPages = 0;
                let currentPage = 1;
                let chunkSize = 5;
                let currentChunk = 5;

                for (let i = 0; i < moderationData.Timeouts.length; i+= chunkSize) allPages++;

                let textArray = [];
                for (let i = moderationData.Timeouts.length - 1; i > moderationData.Timeouts.length - 6; i-= 1) textArray.push(await loadFunction(i));

                timeoutsContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Felfüggesztések: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`))
                .addTextDisplayComponents(textArray)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(2))
                .addActionRowComponents(row);

                const msg = await interaction.reply({ components: [timeoutsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

                const filter = (buttonInteraction) => {
                    if (buttonInteraction.user.id === interaction.member.id) return true;
                    else buttonInteraction.deferUpdate();
                }
    
                const collector = msg.createMessageComponentCollector({
                    filter,
                    time: 300000
                });

                collector.on("collect", async (collected) => {
                    const id = collected.customId;
                    const currentLength = timeoutsContainer.components.filter(x => x instanceof TextDisplayBuilder).length - 1;

                    if (id === "prev") {
                        if (currentChunk > 5) {
                            currentPage--;
            
                            let textArray = [];
                            for (let i = moderationData.Timeouts.length - currentChunk + 9; i > moderationData.Timeouts.length - currentChunk + 4; i--) textArray.push(await loadFunction(i));

                            timeoutsContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk-= 5;

                            row.components[1].setDisabled(false);
                            if (currentPage === 1) row.components[0].setDisabled(true);
                        } else await collected.deferUpdate();
                    }
    
                    if (id === "next") {
                        if (moderationData.Timeouts.length > currentChunk) {
                            currentPage++;
            
                            let textArray = [];
                            for (let i = moderationData.Timeouts.length - currentChunk - 1; i > moderationData.Timeouts.length - currentChunk - 6; i--) if (moderationData.Timeouts[i]) textArray.push(await loadFunction(i));

                            timeoutsContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk+= 5;
                            
                            row.components[0].setDisabled(false);
                            if (currentPage === allPages) row.components[1].setDisabled(true);
                        } else await collected.deferUpdate();
                    }

                    timeoutsContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Felfüggesztések: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`));
                    await collected.update({ components: [timeoutsContainer], allowedMentions: {} });
                });

                collector.on("end", async () => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);

                    await interaction.editReply({ components: [timeoutsContainer], allowedMentions: {} });
                });
            }
        }
    }
}