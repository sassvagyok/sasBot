const { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

const timeoutSchema = require("../models/timeoutModel.js");
const logChannelSchema = require("../models/logchannelModel.js");
const modsettingSchema = require("../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = async (client) => {
    setInterval(async () => {
        timeoutSchema.find().then(async (data) => {
            if (!data && !data.length) return;

            data.forEach(async (value) => {
                const guild = client.guilds.cache.get(value.Guild);
                if (!guild) return;

                const channel = guild.channels.cache.get(value.Channel);
                const target = await client.users.fetch(value.User);
                const author = await client.users.fetch(value.Author);
                const length = value.Length;
                const start = value.Start;
                const end = value.End;
                const now = moment().tz("Europe/Budapest").format("YYYY/MM/DD-HH:mm");
                const count = value.Number;

                if (!channel) return;
                if (!target) return;
                if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

                const logChannelData = await logChannelSchema.findOne({ Guild: guild.id });
                const logChannel = guild.channels.cache.get(logChannelData?.Channel);
                const modsettingData = await modsettingSchema.findOne({ Guild: guild.id });

                if (now === end) {
                    const headerTextComponent = new TextDisplayBuilder()
                    .setContent(`### Lejárt felfüggesztés: \`${target.username}\` (${target})${count ? `#${count}` : ""}`);

                    const removetimeoutContainer = new ContainerBuilder()
                    .setAccentColor(0x19cc10)
                    .addTextDisplayComponents(headerTextComponent)
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${start} (${length})\``))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

                    const dmContainer = new ContainerBuilder()
                    .setAccentColor(0x19cc10)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejárt felfüggesztés | ${guild}`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${start} (${length})\``))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

                    if ((!modsettingData || modsettingData?.length === 0 || modsettingData.Send) && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) channel.send({ components: [removetimeoutContainer], flags: MessageFlags.IsComponentsV2 });

                    if (logChannel && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
                    logChannel?.send({ components: [removetimeoutContainer], flags: MessageFlags.IsComponentsV2 });

                    if (!modsettingData || modsettingData?.length == 0 || !modsettingData.DM) return;
                    try {
                        await target.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
                    } catch(err){}

                    await timeoutSchema.deleteOne({ _id: value._id });
                }
            });
        });
    }, 60000);
}