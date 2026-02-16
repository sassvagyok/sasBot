import { ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moderationSchema from "../../../models/moderationlogModel.js";

export default {
    name: "kicks",
    description: "Tagok kirúgási előzményei",
    info: "Megadott tag sasBot általi kirúgásai.\n`Szükséges jogosultság: Tagok kirúgása`",
    dm_permission: false,
    permission: PermissionFlagsBits.KickMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akinek meg legyenek jelenítve a korábbi kirúgásai",
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

        if (moderationData.Kicks.length === 0) await interaction.reply({ content: "A megadott tagnak nincsenek feljegyzett kirúgásai!", flags: MessageFlags.Ephemeral });
        else {
            const kicksContainer = new ContainerBuilder()
            .setAccentColor(0xff6600)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kirúgások: \`${memberTarget.user.username}\` [1/1]`))
            .addSeparatorComponents(new SeparatorBuilder());

            // Adatbetöltő függvény
            const loadFunction = async (i) => {
                let modAuthor = await client.users.fetch(moderationData.Kicks[i].Author.replace(/\D/g,""));

                return new TextDisplayBuilder()
                .setContent(`**#${moderationData.Kicks[i].Number}** \`${moderationData.Kicks[i].Date}\`\n${moderationData.Kicks[i].Reason ? `- Indok: "${moderationData.Kicks[i].Reason}"\n- ${moderationData.Kicks[i].Author} (${modAuthor.username})` : `- ${moderationData.Kicks[i].Author} (${modAuthor.username})`}`);
            }

            // Ha kevesebb mint 5 van feljegyezve
            if (moderationData.Kicks.length < 6) {
                let textArray = [];
                for (let i = moderationData.Kicks.length-1; i > -1; i -= 1) textArray.push(await loadFunction(i));

                kicksContainer.addTextDisplayComponents(textArray);

                interaction.reply({ components: [kicksContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

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

                const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

                let allPages = 0;
                let currentPage = 1;
                let chunkSize = 5;
                let currentChunk = 5;

                for (let i = 0; i < moderationData.Kicks.length; i+= chunkSize) allPages++;

                let textArray = [];
                for (let i = moderationData.Kicks.length - 1; i > moderationData.Kicks.length - 6; i-= 1) textArray.push(await loadFunction(i));

                kicksContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Kirúgások: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`))
                .addTextDisplayComponents(textArray)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(2))
                .addActionRowComponents(row);

                const msg = await interaction.reply({ components: [kicksContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });

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
                    const currentLength = kicksContainer.components.filter(x => x instanceof TextDisplayBuilder).length - 1;

                    // Ha visszafelé lépés történik
                    if (id === "prev") {
                        if (currentChunk > 5) {
                            currentPage--;

                            let textArray = [];
                            for (let i = moderationData.Kicks.length - currentChunk + 9; i > moderationData.Kicks.length - currentChunk + 4; i--) textArray.push(await loadFunction(i));

                            kicksContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk-= 5;

                            row.components[1].setDisabled(false);
                            if (currentPage === 1) row.components[0].setDisabled(true);
                        } else await collected.deferUpdate();
                    }
    
                    // Ha előrefelé lépés történik
                    if (id === "next") {
                        if (moderationData.Kicks.length > currentChunk) {
                            currentPage++;

                            let textArray = [];
                            for (let i = moderationData.Kicks.length - currentChunk - 1; i > moderationData.Kicks.length - currentChunk - 6; i--) if (moderationData.Kicks[i]) textArray.push(await loadFunction(i));

                            kicksContainer.spliceComponents(2, currentLength, textArray);

                            currentChunk += 5;

                            row.components[0].setDisabled(false);
                            if (currentPage === allPages) row.components[1].setDisabled(true);
                        } else await collected.deferUpdate();
                    }

                    kicksContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### Kirúgások: \`${memberTarget.user.username}\` [${currentPage}/${allPages}]`));
                    await collected.update({ components: [kicksContainer], allowedMentions: {} });
                });

                collector.on("end", async () => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);

                    await interaction.editReply({ omponents: [kicksContainer], allowedMentions: {} });
                });
            }
        }
    }
}