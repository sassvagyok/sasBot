import { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from "discord.js";
import timeoutSchema from "../models/timeoutModel.js";
import logChannelSchema from "../models/logchannelModel.js";
import modsettingSchema from "../models/modsettingModel.js";
import moment from "moment";
import "moment-timezone";

export default (client) => {
    setInterval(async () => {
        try {
            const data = await timeoutSchema.find({ End: { $lte: new Date() } });
            if (!data || !data.length) return;

            for (const value of data) {
                const guild = client.guilds.cache.get(value.Guild);
                if (!guild) continue;

                const channel = guild.channels.cache.get(value.Channel);
                if (!channel) continue;

                const target = await client.users.fetch(value.User).catch(() => null);
                if (!target) {
                    await timeoutSchema.deleteOne({ _id: value._id });
                    continue;
                }

                const author = await client.users.fetch(value.Author).catch(() => null);
                if (!author) continue;

                if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) continue;

                const length = value.Length;
                const count = value.Number;
                const reason = value.Reason;
                
                const formattedStart = moment(value.Start).tz("Europe/Budapest").format("YYYY/MM/DD HH:mm");

                const logChannelData = await logChannelSchema.findOne({ Guild: guild.id });
                const logChannel = guild.channels.cache.get(logChannelData?.Channel);
                const modsettingData = await modsettingSchema.findOne({ Guild: guild.id });

                const removetimeoutContainer = new ContainerBuilder()
                .setAccentColor(0x19cc10)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejárt felfüggesztés: \`${target.username}\` (${target})${count ? ` | #${count}` : ""}`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${formattedStart} (${length})\`${reason ? `\n- **Indok:** \`${reason}\`` : ""}`))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));

                const dmContainer = new ContainerBuilder()
                .setAccentColor(0x19cc10)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lejárt felfüggesztés | ${guild}`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kezdet:** \`${formattedStart} (${length})\`${reason ? `\n- **Indok:** \`${reason}\`` : ""}`))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${author.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));

                if ((!modsettingData || modsettingData?.length === 0 || modsettingData.Send) && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                    channel.send({ components: [removetimeoutContainer], flags: MessageFlags.IsComponentsV2 });
                }

                if (logChannel && logChannel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ViewChannel) && logChannel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                    logChannel.send({ components: [removetimeoutContainer], flags: MessageFlags.IsComponentsV2 });
                }

                if (modsettingData && modsettingData?.length !== 0 && modsettingData.DM) {
                    try {
                        await target.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
                    } catch(err){}
                }

                await timeoutSchema.deleteOne({ _id: value._id });
            }
        } catch (error) {
            console.log(error);
        }
    }, 10000);
}