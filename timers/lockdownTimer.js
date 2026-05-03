import { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from "discord.js";
import lockdownSchema from "../models/lockdownModel.js";
import logChannelSchema from "../models/logchannelModel.js";
import moment from "moment";
import "moment-timezone";

export default (client) => {
    setInterval(async () => {
        try {
            const data = await lockdownSchema.find({ End: { $lte: new Date() } });
            if (!data || !data.length) return;

            for (const value of data) {
                const guild = client.guilds.cache.get(value.Guild);
                if (!guild) continue;

                const channel = guild.channels.cache.get(value.Channel);
                if (!channel) continue;

                if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel)) continue;
                if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) continue;

                const author = await client.users.fetch(value.Author).catch(() => null);
                if (!author) continue;

                if (channel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessages) && channel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessagesInThreads)) {
                    await lockdownSchema.deleteOne({ _id: value._id });
                    continue;
                }

                channel.permissionOverwrites.delete(guild.roles.everyone, `Lejárt lezárás - ${author.username}`);

                const formattedStart = moment(value.Start).tz("Europe/Budapest").format("YYYY/MM/DD HH:mm");

                const unlockdownContainer = new ContainerBuilder()
                .setAccentColor(0x19cc10)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Automatikus csatorna megnyitás: \`${channel.name}\` (${channel})`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${formattedStart} (${value.Length})\`${value.Reason ? `\n- **Indok:** \`${value.Reason}\`` : ""}`))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));

                if (channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                    channel.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });
                }
                
                const logChannelData = await logChannelSchema.findOne({ Guild: guild.id });
                const logChannel = guild.channels.cache.get(logChannelData?.Channel);

                if (logChannel && logChannel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel) && logChannel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                    logChannel.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });
                }
                
                await lockdownSchema.deleteOne({ _id: value._id });
            }
        } catch (error) {
            console.log(error);
        }
    }, 10000);
}