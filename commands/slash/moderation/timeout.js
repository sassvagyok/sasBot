const { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");

const timeoutSchema = require("../../../models/timeoutModel.js");
const moderationSchema = require("../../../models/moderationlogModel.js");
const logChannelSchema = require("../../../models/logchannelModel.js");
const modsettingSchema = require("../../../models/modsettingModel.js");

const ms = require("ms");
const moment = require("moment");
require("moment-duration-format");
require("moment-timezone");

module.exports = {
    name: "timeout",
    description: "Tagok felfüggesztése",
    info: "Megadott tag felfüggesztése megadott ideig, megadható indokkal.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akit fel akarsz függeszteni",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "időtartam",
            description: "Felfüggesztés időtartama (m/h/d)",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 100
        },
        {
            name: "indok",
            description: "Felfüggesztés indoka (üres: nincs indok)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        }
    ],
    run: async (client, interaction, args) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Moderate Members\`!", flags: MessageFlags.Ephemeral });
        
        // Megadott paraméterek beolvasása, ellenőrzése
        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");
        const timeoutDuration = interaction.options.getString("időtartam").split(" ")[0];

        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        if (timeoutDuration === parseInt(timeoutDuration) + "m" || timeoutDuration === parseInt(timeoutDuration) + "h" || timeoutDuration === parseInt(timeoutDuration) + "d") {
            if (timeoutDuration.match(/\d+/)[0] > 2592000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
            if (parseInt(ms(timeoutDuration), 10) > 2592000000) return interaction.reply({ content: "A maximum időtartam 30 nap!", flags: MessageFlags.Ephemeral });
        } else return interaction.reply({ content: "Megadható időtartamok: `m/h/d`", flags: MessageFlags.Ephemeral });

        const userAuthor = interaction.member;

        // Ellenőrzések
        if (target == userAuthor) return interaction.reply({ content: "Nem függesztheted fel magadat!", flags: MessageFlags.Ephemeral });
        if (target.bot) return interaction.reply({ content: "Botokat nem függeszthetsz fel!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátort nem függeszthetsz fel!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom felfüggeszteni!`, flags: MessageFlags.Ephemeral });  
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} rangja magasabban van a tiédnél, ezért nem tudod felfüggeszteni!`, flags: MessageFlags.Ephemeral });

        // Logolás (moderation channel + moderation logs)
        let moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const guildModData = await moderationSchema.find({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });

        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        // Moderáció sorszámának lekérése
        let count = 0;
        let header = "";

        if (modsettingData && modsettingData?.Log) {
            if (guildModData.length > 0) {
                const max = guildModData.map(x => x.Count);
                count = Math.max(...max);
            }

            // Ha nincs még moderáció a szerveren
            if (!moderationData) {
                const newData = new moderationSchema({
                    Guild: interaction.guild.id,
                    User: target.id,
                    Count: count
                });
                await newData.save();
            }

            moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });
            await moderationSchema.findOneAndUpdate({ Guild: interaction.guild.id, User: target.id }, { Count: count + 1 });

            header = ` | #${count + 1}`;
        }

        // Containerek létrehozása
        const timeoutContainer = new ContainerBuilder()
        .setAccentColor(0xff9d02)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Felfüggesztés: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)` + header))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0xff9d02)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Felfüggesztés | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        // Küldés függvénye
        const sendContainer = async () => {
            timeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
                        
            interaction.reply({ components: [timeoutContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

            if(logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        // Moderations logolása
        const pushModLog = async (type) => {
            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.Log) return;

            const defaultLog = {
                Number: count + 1,
                Target: target,
                Type: "Timeout",
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Author: interaction.member,
                Length: timeoutDuration
            }

            // Indok
            if (type === 1) defaultLog.Reason = reason;

            moderationData.Timeouts.push(defaultLog);
            await moderationData.save();
        }

        let duration = moment.duration(ms(timeoutDuration));
        let formattedDuration = duration.format("M [hónap] W [hét] D [nap] H [óra] m [perc]", {
            trim: "all"
        });

        const timeoutData = await timeoutSchema.findOne({ Guild: interaction.guild.id, User: target.id });
        if (timeoutData) await timeoutSchema.findOneAndDelete({ Guild: interaction.guild.id, User: target.id });

        new timeoutSchema({
            Guild: interaction.guild.id,
            Channel: interaction.channel.id,
            User: target.id,
            Author: interaction.member.id,
            Length: formattedDuration,
            Start: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
            End: moment().tz("Europe/Budapest").add(parseInt(args[1].slice(0, -1)), args[1].slice(-1)).format("YYYY/MM/DD-HH:mm"),
            Number: modsettingData && modsettingData?.Log ? count + 1 : 0
        })
        .save();

        // Ha nincs indok
        if (!reason) {
            timeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(timeoutDuration.slice(0, -1)), timeoutDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(timeoutDuration.slice(0, -1)), timeoutDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\``));
            
            pushModLog(0);
            sendContainer();

            if (memberTarget.communicationDisabledUntil) memberTarget.timeout(null);
            return memberTarget.timeout(ms(timeoutDuration), `Időtartam: ${timeoutDuration} - ${userAuthor.user.username}`);

        // Ha van indok
        } else {
            timeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(timeoutDuration.slice(0, -1)), timeoutDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`\n- **Indok:** \`${reason}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Lejárat:** \`${moment().tz("Europe/Budapest").add(parseInt(timeoutDuration.slice(0, -1)), timeoutDuration.slice(-1)).format("YYYY/MM/DD HH:mm")} (${formattedDuration})\`\n- **Indok:** \`${reason}\``));

            pushModLog(1);
            sendContainer();

            if (memberTarget.communicationDisabledUntil) memberTarget.timeout(null);
            return memberTarget.timeout(ms(timeoutDuration), reason + " | Időtartam: " + timeoutDuration + ` | (${userAuthor.user.username})`);
        }
    }
}