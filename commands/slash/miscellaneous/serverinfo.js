import { MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ThumbnailBuilder, SectionBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import moment  from "moment";
import "moment-duration-format";
import "moment-timezone";

export default {
    name: "serverinfo",
    description: "Információk a szerverről",
    info: "Tagok és csatornák száma, emojik, rangok, és egyéb információk megjelenítése a szerverről.",
    dm_permission: false,
    run: async (client, interaction) => {

        const guild = interaction.guild;
        const roles = guild.roles.cache.filter((roles) => roles.id != guild.id).map((role) => role.toString());
        const emojis = guild.emojis.cache.filter((emojis) => emojis.id != guild.id).map((emoji) => emoji.toString());
        const channels = guild.channels.cache.filter((channels) => channels.id != guild.id).map((channel) => channel.toString());
        const owner = await interaction.guild.members.fetch(guild.ownerId);

        const formatFunction = (arr) => {
            let formattedString = "";

            if (arr.length > 0) {
                for (let i = 0; i < arr.length; i++) {
                    if (formattedString.length + arr[i].length > 1000) {
                        if (formattedString.length < 996) formattedString += " ...";
                        break;
                    } else formattedString += arr[i];

                    if (i < arr.length - 1) {
                        formattedString += " ";
                    }
                }
            } else formattedString = "Nincs egy sem!";

            return formattedString;
        }

        let formattedEmojis = formatFunction(emojis);
        let formattedRoles = formatFunction(roles);

        const avatarButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(guild.iconURL({ extension: "png", size: 1024, dynamic: true }))
        .setEmoji("🎭")
        .setLabel("Ikon");

        const row = new ActionRowBuilder().addComponents(avatarButton);

        if (guild.banner) {
            const bannerButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(guild.bannerURL({ extension: "png", size: 1024, dynamic: true }))
            .setEmoji("🖼️")
            .setLabel("Banner");

            row.addComponents(bannerButton);
        }

        const avatarThumbnailComponent = new ThumbnailBuilder({
            media: {
                url: guild.iconURL({ extension: "png", size: 1024, dynamic: true })
            }
        });

        const avatarSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${guild.name} | ${guild.premiumSubscriptionCount} boost (${guild.premiumTier}. szint)`))
        .setThumbnailAccessory(avatarThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- 👥 **Tagok:** ${guild.memberCount}\n- 📢 **Csatornák:** ${channels.length}\n- 👑 **Tulajdonos:** \`${owner.user.username}\` (<@${guild.ownerId}>)\n- 📅 **Létrehozva:** <t:${Math.round(guild.createdTimestamp / 1000)}> (${moment.duration(moment().tz("Europe/Budapest") - guild.createdAt).format(" Y [éve], M [hónapja], D [napja]", { trim: "all" })})\n- 🙂 **Emojik:** ${emojis.length} (${formattedEmojis})\n- 🏅 **Rangok:** ${roles.length} (${formattedRoles})`));

        const serverinfoContainer = new ContainerBuilder()
        .addSectionComponents(avatarSection)
        .addActionRowComponents(row)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ID: ${guild.id}`));

        interaction.reply({ components: [serverinfoContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
    }
}