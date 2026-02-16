import { ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moderationSchema from "../../../models/moderationlogModel.js";

export default {
    name: "warns",
    description: "Tag figyelmeztetési előzményei",
    info: "Megadott tag sasBot általi figyelmeztetései.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akinek meg legyenek jelenítve a korábbi figyelmeztetései",
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    run: async (client, interaction) => {

        // Target keresése, ellenőrzése
        const target = interaction.options.getUser("tag");
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        // Moderációk lekérése
        const moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        if (!moderationData) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        // Lekérdezés
        if (moderationData.Warns.length === 0) await interaction.reply({ content: "A megadott tagnak nincsenek feljegyzett figyelmeztetései!", flags: MessageFlags.Ephemeral });
        else {
            const warnsContainer = new ContainerBuilder()
            .setAccentColor(0xffd200)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Figyelmeztetések: \`${memberTarget.user.username}\` [1/1]`))
            .addSeparatorComponents(new SeparatorBuilder());

            // Adatbetöltő függvény definiálása
            const loadFunction = async (i) => {
                let modAuthor = await client.users.fetch(moderationData.Warns[i].Author.replace(/\D/g,""));

                return new TextDisplayBuilder().setContent(`**#${moderationData.Warns[i].Number}** \`${moderationData.Warns[i].Date}\`\n- Indok: "${moderationData.Warns[i].Reason}"\n- ${moderationData.Warns[i].Author} (${modAuthor.username})`);
            }

            // Ha kevesebb mint 5 van feljegyezve
            if (moderationData.Warns.length < 6) {
                let textArray = [];
                for (let i = moderationData.Warns.length - 1; i > -1; i-= 1) textArray.push(await loadFunction(i));

                warnsContainer.addTextDisplayComponents(textArray);

                interaction.reply({ components: [warnsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

            // Ha több mint 5 van feljegyezve
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

                const row = new ActionRowBuilder()
                .addComponents(prevButton, nextButton);

                let allPages = 0;
                let currentPage = 1;
                let chunkSize = 5;
                let currentChunk = 5;

                for (let i = 0; i < moderationData.Warns.length; i+= chunkSize) allPages++;

                let textArray = [];
                for (let i = moderationData.Warns.length-1; i > moderationData.Warns.length-6; i -= 1) textArray.push(await loadFunction(i));

                warnsContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Figyelmeztetések: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`))
                .addTextDisplayComponents(textArray)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(2))
                .addActionRowComponents(row);

                const msg = await interaction.reply({ components: [warnsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

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
                    const currentLength = warnsContainer.components.filter(x => x instanceof TextDisplayBuilder).length - 1;

                    // Ha visszafelé lépés történik
                    if (id === "prev") {
                        if (currentChunk > 5) {
                            currentPage--;

                            let textArray = [];
                            for (let i = moderationData.Warns.length - currentChunk + 9; i > moderationData.Warns.length - currentChunk + 4; i--) textArray.push(await loadFunction(i));

                            warnsContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk-= 5;

                            row.components[1].setDisabled(false);
                            if (currentPage === 1) row.components[0].setDisabled(true);
                        } else await collected.deferUpdate();
                    }
    
                    // Ha előrefelé lépés történik
                    if (id === "next") {
                        if (moderationData.Warns.length > currentChunk) {
                            currentPage++;

                            let textArray = [];
                            for (let i = moderationData.Warns.length - currentChunk - 1; i > moderationData.Warns.length - currentChunk - 6; i--) if (moderationData.Warns[i]) textArray.push(await loadFunction(i));

                            warnsContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk+= 5;

                            row.components[0].setDisabled(false);
                            if (currentPage === allPages) row.components[1].setDisabled(true);
                        } else await collected.deferUpdate();
                    }

                    warnsContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Figyelmeztetések: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`));
                    await collected.update({ components: [warnsContainer], allowedMentions: {} });
                });

                collector.on("end", async () => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);

                    await interaction.editReply({ components: [warnsContainer], allowedMentions: {} });
                });
            }
        }
    }
}