import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import banLogSchema from "../../../models/banModel.js";
import moderationSchema from "../../../models/moderationlogModel.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import ms from "ms";
import moment from "moment";
import "moment-duration-format";
import "moment-timezone";

export default {
    name: "ban",
    description: "Tagok kitiltása",
    info: "Megadott tag kitiltása, megadható indokkal és lehetőséggel az ideiglenes kitiltásra.\n`Szükséges jogosultság: Tagok kitiltása`",
    dm_permission: false,
    permission: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akit ki akarsz tiltani",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "indok",
            description: "Kitiltás indoka (üres: nincs indok)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        },
        {
            name: "időtartam",
            description: "Kitiltás időtartama (m/h/d) (üres: nincs lejárat)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 100
        },
        {
            name: "törlés",
            description: "A tag üzeneteinek törlése ennyi órával visszamenőleg (üres: nincs törlés)",
            type: ApplicationCommandOptionType.Number,
            required: false,
            minValue: 1,
            maxValue: 168
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Ban Members\`!", flags: MessageFlags.Ephemeral });
        
        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");
        const banDuration = interaction.options.getString("időtartam");
        const remove = interaction.options.getNumber("törlés") * 3600 || 0;
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        if (banDuration) {
            if (banDuration === parseInt(banDuration) + "m" || banDuration === parseInt(banDuration) + "h" || banDuration === parseInt(banDuration) + "d") {
                if (banDuration.match(/\d+/)[0] > 2592000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
                if (parseInt(ms(banDuration), 10) > 2592000000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
            } else return interaction.reply({ content: "Megadható időtartamok: `m/h/d`", flags: MessageFlags.Ephemeral });
        }

        const userAuthor = interaction.member;

        if (target.id === userAuthor.id) return interaction.reply({ content: "Nem tilthatod ki magadat!", flags: MessageFlags.Ephemeral });
        if (target.bot) return interaction.reply({ content: "Botokat nem tilthatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátort nem tilthatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom kitiltani!`, flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} rangja magasabban van a tiédnél, ezért nem tudod kitiltani!`, flags: MessageFlags.Ephemeral  });

        let moderationLog = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const guildModData = await moderationSchema.find({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        let count = 0;
        let header = "";

        if (modsettingData && modsettingData?.Log) {
            if (guildModData.length > 0) {
                const max = guildModData.map(x => x.Count);
                count = Math.max(...max);
            }

            if (!moderationLog) {
                const newData = new moderationSchema({
                    Guild: interaction.guild.id,
                    User: target.id,
                    Count: count
                });
                await newData.save();
            }

            moderationLog = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            await moderationSchema.findOneAndUpdate({ Guild: interaction.guild.id, User: target.id }, { Count: count + 1 });

            header = ` | #${count + 1}`;
        }

        const banContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kitiltás: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)` + header))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kitiltás | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        const sendContainer = async () => {
            banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            interaction.reply({ components: [banContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            
            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [banContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        const pushModLog = async (type) => {
            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.Log) return;

            const defaultLog = {
                Number: count + 1,
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Target: target,
                Author: interaction.member,
                Type: "Ban"
            }

            if (type === 1 || type === 2) defaultLog.Length = banDuration;
            if (type === 2 || type === 3) defaultLog.Reason = reason;

            moderationLog.Bans.push(defaultLog);
            await moderationLog.save();
        }

        if (!banDuration) {
            if (!reason) {
                remove !== 0 ? banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- Üzenetek törölve ${remove / 3600} órával visszamelőleg`)) : "";
                
                pushModLog(0);
                await sendContainer();

                return memberTarget.ban({
                    reason: userAuthor.user.username,
                    deleteMessageSeconds: remove
                });
            } else {
                banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\`${remove !== 0 ? `\n- Üzenetek törölve ${remove / 3600} órával visszamelőleg` : ""}`));
                dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));

                pushModLog(3);
                await sendContainer();

                return memberTarget.ban({
                    reason: `Indok: ${reason} - ${userAuthor.user.username}`,
                    deleteMessageSeconds: remove
                });
            }
        } else {
            const banData = await banLogSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            if (banData) await banLogSchema.findOneAndDelete({ Guild: interaction.guild.id, User: target.id });

            let duration = moment.duration(ms(banDuration));
            let formattedDuration = duration.format("M [hónap] W [hét] D [nap] H [óra] m [perc]", {
                trim: "all"
            });

            new banLogSchema({
                Guild: interaction.guild.id,
                Channel: interaction.channel.id,
                User: target.id,
                Author: interaction.member.id,
                Length: formattedDuration,
                Start: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                End: moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD-HH:mm"),
                Number: modsettingData && modsettingData?.Log ? count + 1 : 0
            }).save();

            if (!reason) {
                banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`${remove !== 0 ? `\n- Üzenetek törölve ${remove / 3600} órával visszamelőleg` : ""}`));
                dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\``));

                pushModLog(1);
                await sendContainer();

                return memberTarget.ban({
                    reason: `Időtartam: ${formattedDuration} - ${userAuthor.user.username}`,
                    deleteMessageSeconds: remove
                });
            } else {
                banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`\n- **Indok:** \`${reason}\`${remove !== 0 ? `\n- Üzenetek törölve ${remove / 3600} órával visszamelőleg` : ""}`));
                dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`\n- **Indok:** \`${reason}\``));

                pushModLog(2);
                await sendContainer();

                return memberTarget.ban({
                    reason: `Indok: ${reason} | Időtartam: ${formattedDuration} - ${userAuthor.user.username}`,
                    deleteMessageSeconds: remove
                });
            }
        }
    }
}