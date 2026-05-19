import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import banLogSchema from "../../../models/banModel.js";
import userModerationSchema from "../../../models/userModerationModel.js";
import serverModerationSchema from "../../../models/serverModerationModel.js";
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
            name: "végleges",
            description: "Tag kitiltása lejárat nélkül",
            type: ApplicationCommandOptionType.Subcommand,
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
                    name: "törlés",
                    description: "A tag üzeneteinek törlése ennyi órával visszamenőleg (üres: nincs törlés)",
                    type: ApplicationCommandOptionType.Number,
                    required: false,
                    minValue: 1,
                    maxValue: 168
                }
            ]
        },
        {
            name: "ideiglenes",
            description: "Tag kitiltása megadott időre",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "tag",
                    description: "Tag, akit ki akarsz tiltani",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "időtartam",
                    description: "Kitiltás időtartama (m/h/d)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                },
                {
                    name: "indok",
                    description: "Kitiltás indoka (üres: nincs indok)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 250
                },
                {
                    name: "törlés",
                    description: "A tag üzeneteinek törlése ennyi órával visszamenőleg (üres: nincs törlés)",
                    type: ApplicationCommandOptionType.Number,
                    required: false,
                    minValue: 1,
                    maxValue: 168
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Ban Members\`!", flags: MessageFlags.Ephemeral });
        
        const subCommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");
        const banDuration = interaction.options.getString("időtartam");
        const remove = interaction.options.getNumber("törlés") * 3600 || 0;
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        const userAuthor = interaction.member;

        if (target.id === userAuthor.id) return interaction.reply({ content: "Nem tilthatod ki magadat!", flags: MessageFlags.Ephemeral });
        if (target.bot) return interaction.reply({ content: "Botokat nem tilthatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátort nem tilthatsz ki!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom kitiltani!`, flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} rangja magasabban van a tiédnél, ezért nem tudod kitiltani!`, flags: MessageFlags.Ephemeral  });

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

            const banEntry = {
                Number: count,
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Target: target,
                Author: interaction.member,
                Type: "Ban",
                Reason: reason || null,
                Length: banDuration || null
            };

            if (!userModerationData) {
                const newData = new userModerationSchema({
                    Guild: interaction.guild.id,
                    User: target.id,
                    Bans: [banEntry]
                });
                await newData.save();
            } else {
                userModerationData.Bans.push(banEntry);
                await userModerationData.save();
            }

            userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            header = ` | #${count}`;
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
            banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm")}\``));
            interaction.reply({ components: [banContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            
            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [banContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        if (subCommand === "végleges") {
            banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${reason ? `- **Indok:** \`${reason}\`` : ""}${remove !== 0 ? `\n- Üzenetek törölve ${remove / 3600} órával visszamelőleg` : ""}\n> Ez a(z) **${userModerationData.Bans.length}.** kitiltása`));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${reason ? `- **Indok:** \`${reason}\`` : ""}\n> Ez a(z) **${userModerationData.Bans.length}.** kitiltásod`));

            await sendContainer();

            return memberTarget.ban({
                reason: `${reason ? `Indok: ${reason} - `: ""}${userAuthor.user.username}`,
                deleteMessageSeconds: remove
            });
        }

        if (subCommand === "ideiglenes") {
            if (banDuration === parseInt(banDuration) + "m" || banDuration === parseInt(banDuration) + "h" || banDuration === parseInt(banDuration) + "d") {
                if (banDuration.match(/\d+/)[0] > 2592000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
                if (parseInt(ms(banDuration), 10) > 2592000000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
            } else return interaction.reply({ content: "Megadható időtartamok: `m/h/d`", flags: MessageFlags.Ephemeral });

            await banLogSchema.findOneAndDelete({ Guild: interaction.guild.id, User: target.id });

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
                Start: new Date(),
                End: moment().add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).toDate(),
                Number: modsettingData && modsettingData?.Log ? count : null,
                Reason: reason || null
            }).save();

            const formattedDate = moment().tz("Europe/Budapest").add(parseInt(banDuration.slice(0, -1)), banDuration.slice(-1)).format("YYYY/MM/DD HH:mm");

            banContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${formattedDate} (${formattedDuration})\`${reason ? `\n- **Indok:** \`${reason}\`` : ""}${remove !== 0 ? `\n- Üzenetek törölve ${remove / 3600} órával visszamelőleg` : ""}\n> Ez a(z) **${userModerationData.Bans.length}.** kitiltása`));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${formattedDate} (${formattedDuration})\`${reason ? `\n- **Indok:** \`${reason}\`` : ""}\n> Ez a(z) **${userModerationData.Bans.length}.** kitiltásod`));

            await sendContainer();

            return memberTarget.ban({
                reason: `${reason ? `Indok: ${reason} | `: ""}Lejár: ${formattedDate} (${formattedDuration}) - ${userAuthor.user.username}`,
                deleteMessageSeconds: remove
            });
        }
    }
}