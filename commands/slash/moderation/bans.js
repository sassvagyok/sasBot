import { ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moderationSchema from "../../../models/moderationlogModel.js";

export default {
    name: "bans",
    description: "Tagok kitiltási előzményei",
    info: "Megadott tagok sasBot általi kitiltásai.\n`Szükséges jogosultság: Tagok kitiltása`",
    dm_permission: false,
    permission: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akinek meg legyenek jelenítve a korábbi kitiltásai",
            type: ApplicationCommandOptionType.User,
            required: true
        },
    ],
    run: async (client, interaction) => {

        const target = interaction.options.getUser("tag");
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        const moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        if (!moderationData) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        if (moderationData.Bans.length === 0) await interaction.reply({ content: "A megadott tagnak nincsenek feljegyzett kitiltásai!", flags: MessageFlags.Ephemeral });
        else {
            const bansContainer = new ContainerBuilder()
            .setAccentColor(0xe2162e)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kitiltások: \`${memberTarget.user.username}\` [1/1]`))
            .addSeparatorComponents(new SeparatorBuilder());

            const loadFunction = async (i) => {
                let modAuthor = await client.users.fetch(moderationData.Bans[i].Author.replace(/\D/g,""));

                return new TextDisplayBuilder()
                .setContent(
                    `**#${moderationData.Bans[i].Number}** \`${moderationData.Bans[i].Date}\`\n${moderationData.Bans[i].Reason && moderationData.Bans[i].Length ? `- Indok: "${moderationData.Bans[i].Reason}"\n- \`${moderationData.Bans[i].Length}\` | ${moderationData.Bans[i].Author} (${modAuthor.username})` :
                    moderationData.Bans[i].Reason ? `- Indok: "${moderationData.Bans[i].Reason}"\n- ${moderationData.Bans[i].Author} (${modAuthor.username})` :
                    moderationData.Bans[i].Length ? `- \`${moderationData.Bans[i].Length}\` | ${moderationData.Bans[i].Author} (${modAuthor.username})` : `- ${moderationData.Bans[i].Author} (${modAuthor.username})`}`
                );
            }
            
            if (moderationData.Bans.length < 6) {
                let textArray = [];
                for (let i = moderationData.Bans.length - 1; i > -1; i-= 1) textArray.push(await loadFunction(i));

                bansContainer.addTextDisplayComponents(textArray);

                interaction.reply({ components: [bansContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
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

                for (let i = 0; i < moderationData.Bans.length; i+= chunkSize) allPages++;

                let textArray = [];
                for (let i = moderationData.Bans.length - 1; i > moderationData.Bans.length - 6; i-= 1) textArray.push(await loadFunction(i));

                bansContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Kitiltások: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`))
                .addTextDisplayComponents(textArray)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(2))
                .addActionRowComponents(row);

                const msg = await interaction.reply({ components: [bansContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

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
                    const currentLength = bansContainer.components.filter(x => x instanceof TextDisplayBuilder).length - 1;

                    if (id === "prev") {
                        if (currentChunk > 5) {
                            currentPage--;

                            let textArray = [];
                            for (let i = moderationData.Bans.length - currentChunk + 9; i > moderationData.Bans.length - currentChunk + 4; i--) textArray.push(await loadFunction(i));

                            bansContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk-= 5;

                            row.components[1].setDisabled(false);
                            if (currentPage === 1) row.components[0].setDisabled(true);
                        } else await collected.deferUpdate();
                    }

                    if (id === "next") {
                        if (moderationData.Bans.length > currentChunk) {
                            currentPage++;
                            
                            let textArray = [];
                            for (let i = moderationData.Bans.length - currentChunk - 1; i > moderationData.Bans.length - currentChunk - 6; i--) if (moderationData.Bans[i]) textArray.push(await loadFunction(i));

                            bansContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk+= 5;

                            row.components[0].setDisabled(false);
                            if (currentPage === allPages) row.components[1].setDisabled(true);
                        } else await collected.deferUpdate();
                    }

                    bansContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Kitiltások: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`));
                    await collected.update({ components: [bansContainer], allowedMentions: {} });
                });

                collector.on("end", async () => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);

                    await interaction.editReply({ components: [bansContainer], allowedMentions: {} });
                });
            }
        }
    }
}