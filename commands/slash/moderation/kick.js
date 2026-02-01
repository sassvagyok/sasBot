const { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");

const moderationSchema = require("../../../models/moderationlogModel.js");
const logChannelSchema = require("../../../models/logchannelModel.js");
const modsettingSchema = require("../../../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = {
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
        
        // Megadott paraméterek beolvasása, ellenőrzése
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
        const kickContainer = new ContainerBuilder()
        .setAccentColor(0xff6600)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kirúgás: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)` + header))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0xff6600)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kirúgás | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        // Küldés függvénye
        const sendContainer = async () => {
            kickContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            interaction.reply({ components: [kickContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            
            if(logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [kickContainer], flags: MessageFlags.IsComponentsV2 });

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
                Date: moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm"),
                Target: target,
                Author: interaction.member,
                Type: "Kick"
            }

            if (type == 1) defaultLog.Reason = reason;

            moderationData.Kicks.push(defaultLog);
            await moderationData.save();
        }

        // Ha nincs indok
        if (!reason) {
            pushModLog(0);
            sendContainer();

            return memberTarget.kick(`${userAuthor.user.username}`);

        // Ha van indok
        } else {
            kickContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));

            pushModLog(1);
            sendContainer();

            return memberTarget.kick(`Indok: ${reason} - ${userAuthor.user.username}`);
        }
    }
}