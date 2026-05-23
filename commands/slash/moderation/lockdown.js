import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import lockdownSchema from "../../../models/lockdownModel.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import ms from "ms";
import moment from "moment";
import "moment-duration-format";
import "moment-timezone";

export default {
    name: "lockdown",
    description: "Csatornák lezárása",
    info: "Jelenlegi vagy megadott csatorna lezárása, akár megadott időre.\n`Szükséges jogosultság: Rangok kezelése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ManageRoles,
    options: [
        {
            name: "végleges",
            description: "Csatorna lezárása lejárat nélkül",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "csatorna",
                    description: "Csatorna, amit le akarsz zárni (üres: jelenlegi csatorna)",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: false
                },
                {
                    name: "indok",
                    description: "Lezárás indoka (üres: nincs indok)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 250
                }
            ]
        },
        {
            name: "ideiglenes",
            description: "Csatorna lezárása megadott időre",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "időtartam",
                    description: "Lezárás időtartama (m/h/d)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                },
                {
                    name: "csatorna",
                    description: "Csatorna, amit le akarsz zárni (üres: jelenlegi csatorna)",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: false
                },
                {
                    name: "indok",
                    description: "Lezárás indoka (üres: nincs indok)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 250
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Roles\`!", flags: MessageFlags.Ephemeral });
        
        const subCommand = interaction.options.getSubcommand();
        const userAuthor = interaction.member;
        const lockdownDuration = interaction.options.getString("időtartam")?.split(" ")[0];
        const textChannel = interaction.options.getChannel("csatorna") || interaction.channel;
        const reason = interaction.options.getString("indok");

        if (!textChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.SendMessages)) return interaction.reply({ content: "Nincs hozzáférésed ehhez a csatornához!", flags: MessageFlags.Ephemeral });

        if (!textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return interaction.reply({ content: "Nincs hozzáférésem a megadott csatornához!", flags: MessageFlags.Ephemeral });
        if (!textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Roles\`!", flags: MessageFlags.Ephemeral });
        
        if (!textChannel.permissionsFor(textChannel.guild.roles.everyone).has(PermissionFlagsBits.SendMessages) && !textChannel.permissionsFor(textChannel.guild.roles.everyone).has(PermissionFlagsBits.SendMessagesInThreads)) return interaction.reply({ content: "A csatorna már le van zárva!", flags: MessageFlags.Ephemeral });
        
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });

        const lockdownContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Csatorna lezárás: \`${textChannel.name}\` (${textChannel})`))
        .addSeparatorComponents(new SeparatorBuilder());

        const lockdownAndSend = () => {
            lockdownContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``)); 

            textChannel.permissionOverwrites.create(interaction.guild.members.me, { SendMessages: true });
            textChannel.permissionOverwrites.create(interaction.member, { SendMessages: true });
            textChannel.permissionOverwrites.create(textChannel.guild.roles.everyone, { SendMessages: false, SendMessagesInThreads: false });

            interaction.reply({ components: [lockdownContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

            if ((interaction.channel.id !== textChannel.id) && (!modsettingData || modsettingData?.length === 0 || modsettingData.Send)) textChannel.send({ components: [lockdownContainer], flags: MessageFlags.IsComponentsV2 });

            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [lockdownContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "végleges") {
            if (reason) lockdownContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));

            lockdownAndSend();
        }

        if (subCommand === "ideiglenes") {
            if (lockdownDuration === parseInt(lockdownDuration) + "m" || lockdownDuration === parseInt(lockdownDuration) + "h" || lockdownDuration === parseInt(lockdownDuration) + "d") {
                if (lockdownDuration.match(/\d+/)[0] > 2592000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
                if (parseInt(ms(lockdownDuration), 10) > 2592000000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
            } else return interaction.reply({ content: "Megadható időtartamok: `m/h/d`", flags: MessageFlags.Ephemeral });

            await lockdownSchema.findOneAndDelete({ Guild: interaction.guild.id, Channel: textChannel });

            let duration = moment.duration(ms(lockdownDuration));
            let formattedDuration = duration.format("M [hónap] W [hét] D [nap] H [óra] m [perc]", {
                trim: "all"
            });
    
            new lockdownSchema({
                Guild: interaction.guild.id,
                Channel: textChannel.id,
                Author: interaction.member.id,
                Length: formattedDuration,
                Start: new Date(),
                End: moment().add(parseInt(lockdownDuration.slice(0, -1)), lockdownDuration.slice(-1)).toDate(),
                Reason: reason || null
            }).save();

            lockdownContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().add(parseInt(lockdownDuration.slice(0, -1)), lockdownDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`${reason ? `\n- **Indok:** \`${reason}\`` : ""}`));

            lockdownAndSend();
        }
    }
}