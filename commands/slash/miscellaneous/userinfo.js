import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ThumbnailBuilder, SectionBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import moment from "moment";
import "moment-duration-format";
import "moment-timezone";
import saspontSchema from "../../../models/saspontModel.js";

export default {
    name: "userinfo",
    description: "Információk tagokról",
    info: "Profilkép, banner, rangok, csatlakozás ideje és egyéb információk megjelenítése tagokról.",
    dm_permission: false,
    options: [
        {
            name: "tag",
            description: "Információk megjelenítése erről a tagról (üres: magadról)",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {

        const target = interaction.options.getUser("tag") || interaction.user;
        const member = interaction.guild.members.cache.get(target.id);
        const roles = member.roles.cache.filter((roles) => roles.id !== interaction.guild.id).map((role) => role.toString());
        const fetchedUser = await target.fetch();
        const saspontData = await saspontSchema.findOne({ UserID: interaction.user.id });
        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });

        let formattedRoles = "";

        if (roles.length > 0) {
            for (let i = 0; i < roles.length; i++) {
                if (formattedRoles.length + roles[i].length > 1000) {
                    if (formattedRoles.length < 996) formattedRoles += " ...";
                    break;
                } else formattedRoles += roles[i];

                if (i < roles.length - 1) formattedRoles += " ";
            }
        } else formattedRoles = "Nincs egy sem!";

        const avatarButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(member.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }))
        .setEmoji("🎭")
        .setLabel("Avatár");

        const row = new ActionRowBuilder().addComponents(avatarButton);

        if (fetchedUser.banner) {
            const bannerButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(fetchedUser.bannerURL({ extension: "png", size: 1024, dynamic: true }))
            .setEmoji("🖼️")
            .setLabel("Banner");

            row.addComponents(bannerButton);
        }

        const avatarThumbnailComponent = new ThumbnailBuilder({
            media: {
                url: member.displayAvatarURL({ extension: "png", size: 1024, dynamic: true })
            }
        });

        const avatarSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(member.user.bot ? `### ${member.user.username} | Bot` : `### ${member.user.username} \`${format.format(saspontData.Balance)} sP\``))
        .setThumbnailAccessory(avatarThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${fetchedUser.accentColor ? `- 🎨 **Banner-szín:** #${fetchedUser.accentColor.toString(16)}` : ""}\n- 🕑 **Regisztráció:** <t:${Math.round(target.createdTimestamp / 1000)}> (${moment.duration(moment().tz("Europe/Budapest") - target.createdAt).format(" Y [éve], M [hónapja], D [napja]", { trim: "all" })})\n- 📅 **Csatlakozás:** <t:${Math.round(member.joinedTimestamp / 1000)}> (${moment.duration(moment().tz("Europe/Budapest") - member.joinedAt).format(" Y [éve], M [hónapja], D [napja]", { trim: "all" })})\n- 🏅 **Rangok:** ${roles.length} (${formattedRoles})`));

        const userinfoContainer = new ContainerBuilder()
        .setAccentColor(fetchedUser.accentColor || 0x1d88ec)
        .addSectionComponents(avatarSection)
        .addActionRowComponents(row)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ID: ${member.user.id}`));
        
        interaction.reply({ components: [userinfoContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
    }
}