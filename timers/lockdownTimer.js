const { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

const lockdownSchema = require("../models/lockdownModel.js");
const logChannelSchema = require("../models/logchannelModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = async (client) => {
    setInterval(async () => {
        lockdownSchema.find().then(async (data) => {
            if (!data && !data.length) return;
    
            data.forEach(async (value) => {
                const guild = client.guilds.cache.get(value.Guild);
                if (!guild) return;

                const channel = guild.channels.cache.get(value.Channel);
                const author = await client.users.fetch(value.Author);
                const length = value.Length;
                const start = value.Start;
                const end = value.End;
                const now = moment().tz("Europe/Budapest").format("YYYY/MM/DD-HH:mm");

                if (!channel) return;
                if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel)) return;
                if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return;

                const logChannelData = await logChannelSchema.findOne({ Guild: guild.id });
                const logChannel = guild.channels.cache.get(logChannelData?.Channel);

                if (now === end) {
                    if (channel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessages) && channel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessagesInThreads)) return await lockdownSchema.deleteOne({ _id: value._id });
                    channel.permissionOverwrites.delete(channel.guild.roles.everyone, `Lejárt lezárás - ${author.username}`);

                    const unlockdownContainer = new ContainerBuilder()
                    .setAccentColor(0x19cc10)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Automatikus csatorna megnyitás: \`${channel.name}\` (${channel})`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${start} (${length})\``))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

                    if (channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) channel.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });
                    
                    if (logChannel && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
                    logChannel?.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });
                    
                    await lockdownSchema.deleteOne({ _id: value._id });
                }
            });
        });
    }, 60000);
}