import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import userModerationSchema from "../../../models/userModerationModel.js";
import serverModerationSchema from "../../../models/serverModerationModel.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import moment from "moment";
import "moment-timezone";

export default {
    name: "warn",
    description: "Tagok figyelmeztetése",
    info: "Megadott tag figyelmeztetése, indokkal.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akit figyelmeztetni akarsz",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "indok",
            description: "Figyelmeztetés indoka",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");
        const userAuthor = interaction.member;

        if (target.id === userAuthor.id) return interaction.reply({ content: "Nem figyelmeztetheted magadat!", flags: MessageFlags.Ephemeral });

        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});
        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        if (target.bot) return interaction.reply({ content: "Botokat nem figyelmeztethetsz!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátort nem figyelmetheztetsz!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom figyelmeztetni!`, flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position  && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} ő rangja magasabban van a tiédnél, ezért nem tudod figyelmeztetni!`, flags: MessageFlags.Ephemeral });

        let userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        let serverModerationData = await serverModerationSchema.findOne({ Guild: interaction.guild.id });
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const guildModData = await userModerationSchema.find({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });

        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        let count = 1;
        let header = "";

        if (modsettingData && modsettingData?.Log) {
            if (serverModerationData) {
                count = serverModerationData.Count + 1;
                serverModerationData.Count = count;
                await serverModerationData.save();
            } else {
                const newData = new serverModerationSchema({
                    Guild: interaction.guild.id,
                    Count: count
                });
                await newData.save();
            }

            const warnEntry = {
                Number: count,
                Target: target,
                Type: "Warn",
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Author: interaction.member,
                Reason: reason
            };

            if (!userModerationData) {
                const newData = new userModerationSchema({
                    Guild: interaction.guild.id,
                    User: target.id,
                    Warns: [warnEntry]
                });
                await newData.save();
            } else {
                userModerationData.Warns.push(warnEntry);
                await userModerationData.save();
            }

            userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            header = ` | #${count}`;
        }

        const warnContainer = new ContainerBuilder()
        .setAccentColor(0xffd200)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Figyelmeztetés: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)` + header))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\`\n> Ez a(z) **${userModerationData.Warns.length}.** figyelmezetetése`))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``)); 

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0xffd200)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Figyelmeztetés | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\`\n> Ez a(z) **${userModerationData.Warns.length}.** figyelmezetetésed`))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));

        interaction.reply({ components: [warnContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
        logChannel?.send({ components: [warnContainer], flags: MessageFlags.IsComponentsV2 });

        if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
        try {
            await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
        } catch(err){}
    }
}