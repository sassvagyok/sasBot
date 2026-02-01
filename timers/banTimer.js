const { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

const banLogSchema = require("../models/banModel.js")
const logChannelSchema = require("../models/logchannelModel.js");
const modsettingSchema = require("../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = async (client) => {
    setInterval(async () => {
        banLogSchema.find().then(async (data) => {
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
                if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return;

                const logChannelData = await logChannelSchema.findOne({ Guild: guild.id });
                const logChannel = guild.channels.cache.get(logChannelData?.Channel);
                const modsettingData = await modsettingSchema.findOne({ Guild: guild.id });

                if (now === end) {
                    const unbanContainer = new ContainerBuilder()
                    .setAccentColor(0x19cc10)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejárt kitiltás: \`${target.username}\` (${target})` + count ? `| #${count}` : ""))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${start} (${length})\``))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

                    const dmContainer = new ContainerBuilder()
                    .setAccentColor(0x19cc10)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejárt kitiltás | ${guild}`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${start} (${length})\``))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

                    try {
                        await guild.bans.remove(target.id, `Lejárt kitiltás - ${author.username}`);

                        if ((!modsettingData || modsettingData?.length === 0 || modsettingData.Send) && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) channel.send({ components: [unbanContainer], flags: MessageFlags.IsComponentsV2 });

                        if (logChannel && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
                        logChannel?.send({ components: [unbanContainer], flags: MessageFlags.IsComponentsV2 });

                        if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
                        try {
                            await target.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
                        } catch(err){}
                    } catch (err) {
                        return await banLogSchema.deleteOne({ _id: value._id });
                    }

                    await banLogSchema.deleteOne({ _id: value._id });
                }
            });
        });
    }, 60000);
}