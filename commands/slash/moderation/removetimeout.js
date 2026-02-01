const { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");

const timeoutSchema = require("../../../models/timeoutModel.js");
const logChannelSchema = require("../../../models/logchannelModel.js");
const modsettingSchema = require("../../../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = {
    name: "removetimeout",
    description: "Tagok felfüggesztéseinek megszűntetése",
    info: "Felfüggesztett tag felfüggesztésének megszűntetése, megadható indokkal.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "tag",
            description: "Tag, akinek meg akarod szüntetni a felfüggesztését",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "indok",
            description: "Megszüntetés indoka (üres: nincs indok)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Moderate Members\`!", flags: MessageFlags.Ephemeral });
        
        // Adatok lekérése, majd ellenőrzése
        const target = interaction.options.getUser("tag");
        const reason = interaction.options.getString("indok");

        const userAuthor = interaction.member;
        const memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});

        if (!memberTarget) return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });

        // Ellenőrzések
        if (target.id === userAuthor.id) return interaction.reply({ content: "Nem veheted le a felfüggesztést magadról!", flags: MessageFlags.Ephemeral });
        if (!memberTarget.communicationDisabledUntil) return interaction.reply({ content: `${target} nincs felfüggesztve!`, flags: MessageFlags.Ephemeral });
        if (target.bot) return interaction.reply({ content: "Botokról nem veheted le a felfüggesztést!", flags: MessageFlags.Ephemeral });
        if (memberTarget.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Adminisztrátorról nem veheted le a felfüggesztést!", flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: `${target} rangja magasabban van az enyémnél, ezért nem tudom levenni róla a felfüggesztést!`, flags: MessageFlags.Ephemeral });
        if (memberTarget.roles.highest.position >= interaction.guild.members.cache.get(interaction.member.id).roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: `${target} rangja magasabban van a tiédnél, ezért nem veheted le róla a felfüggesztést!`, flags: MessageFlags.Ephemeral });

        // Logolás (moderation channel)
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        // Containerek létrehozása
        const removetimeoutContainer = new ContainerBuilder()
        .setAccentColor(0x17bc0f)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Felfüggesztés feloldása: \`${memberTarget.user.username}\` (<@${memberTarget.user.id}>)`))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0x17bc0f)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Felfüggesztés feloldása | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        // Küldés függvénye
        const sendContainer = async () => {
            removetimeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
                      
            interaction.reply({ components: [removetimeoutContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [removetimeoutContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        await timeoutSchema.findOneAndDelete({ Guild: interaction.guild.id, User: target.id });

        // Ha nincs indok
        if (!reason) {
            sendContainer();

            memberTarget.timeout(null, `${userAuthor.user.username}`);

        // Ha van indok
        } else {
            removetimeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));

            sendContainer();

            memberTarget.timeout(null, `Indok: ${reason} - ${userAuthor.user.username}`);
        }
    }
}