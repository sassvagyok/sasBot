import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import userModerationSchema from "../../../models/userModerationModel.js";
import serverModerationSchema from "../../../models/serverModerationModel.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import moment from "moment";
import "moment-timezone";

export default {
    name: "kick",
    description: "Tagok kirúgása",
    info: "Megadott tag kirúgása, megadható indokkal.\n`Szükséges jogosultság: Tagok kirúgása`",
    dm_permission: false,
    permission: PermissionFlagsBits.KickMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akit ki akarsz rúgni",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "indok",
            description: "Kirúgás indoka (üres: nincs indok)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Kick Members\`!", flags: MessageFlags.Ephemeral });

        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        const userAuthor = interaction.member;

        if (target.id === userAuthor.id) return interaction.reply({ content: "Nem rúghatod ki magadat!", flags: MessageFlags.Ephemeral });
        if (target.bot) return interaction.reply({ content: "Botokat nem rúghatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátort nem rúghatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom kirúgni!`, flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} rangja magasabban van a tiédnél, ezért nem tudod kirúgni!`, flags: MessageFlags.Ephemeral });

        let userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        let serverModerationData = await serverModerationSchema.findOne({ Guild: interaction.guild.id });
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
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

            const kickEntry = {
                Number: count,
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Target: target,
                Author: interaction.member,
                Type: "Kick",
                Reason: reason || null
            };

            if (!userModerationData) {
                const newData = new userModerationSchema({
                    Guild: interaction.guild.id,
                    User: target.id,
                    Kicks: [kickEntry]
                });
                await newData.save();
            } else {
                userModerationData.Kicks.push(kickEntry);
                await userModerationData.save();
            }

            userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            header = ` | #${count}`;
        }

        const kickContainer = new ContainerBuilder()
        .setAccentColor(0xff6600)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kirúgás: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)` + header))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0xff6600)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kirúgás | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        const sendContainer = async () => {
            kickContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));
            interaction.reply({ components: [kickContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            
            if(logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [kickContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        kickContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${reason ? `- **Indok:** \`${reason}\`\n` : ""}> Ez a(z) **${userModerationData.Kicks.length}.** kirúgása`));
        dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${reason ? `- **Indok:** \`${reason}\`\n` : ""}> Ez a(z) **${userModerationData.Kicks.length}.** kirúgásod`));

        sendContainer();

        memberTarget.kick(`${reason ? `Indok: ${reason} - `: ""}${userAuthor.user.username}`);
    }
}