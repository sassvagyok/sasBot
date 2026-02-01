const { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");

const logChannelSchema = require("../../../models/logchannelModel.js");
const modsettingSchema = require("../../../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = {
    name: "unban",
    description: "Tagok kitiltásainak feloldása",
    info: "Kitiltott tag kitiltásának megszűntetése, megadható indokkal.\n`Szükséges jogosultság: Tagok kitiltása`",
    dm_permission: false,
    permission: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: "tag_id",
            description: "Tag, akinek fel akarod oldani a kitiltását (Felhasználó ID)",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 250
        },
        {
            name: "indok",
            description: "Kitiltás feloldásának indoka (üres: nincs indok)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "Nincs jogom ehhez: \`Ban Members\`!", flags: MessageFlags.Ephemeral });
        
        // Megadott paraméterek beolvasása, ellenőrzése
        const reason = interaction.options.getString("indok");
        const userAuthor = interaction.member;
        let target = interaction.options.getString("tag_id").split(" ")[0];
        let memberTarget;

        // Logolás (moderation channel)
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        try {
            memberTarget = await client.users.fetch(target);
        } catch (err) {
            return interaction.reply({ content: "A megadott tag nem található!", flags: MessageFlags.Ephemeral });
        }

        // Containerek létrehozása
        const unbanContainer = new ContainerBuilder()
        .setAccentColor(0x19cc10)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kitiltás feloldása: \`${memberTarget.username}\` (${memberTarget})`))
        .addSeparatorComponents(new SeparatorBuilder());

        const dmContainer = new ContainerBuilder()
        .setAccentColor(0x19cc10)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kitiltás feloldása | ${interaction.guild}`))
        .addSeparatorComponents(new SeparatorBuilder());

        // Küldés függvénye
        const sendContainer = async () => {
            unbanContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));
            interaction.reply({ components: [unbanContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [unbanContainer], flags: MessageFlags.IsComponentsV2 });

            if (!modsettingData || modsettingData?.length === 0 || !modsettingData.DM) return;
            try {
                await memberTarget.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch(err){}
        }

        // Ha van indok
        if (reason) {
            unbanContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Indok:** \`${reason}\``));

            try {
                await interaction.guild.bans.remove(target, `Indok: ${reason} - ${userAuthor.user.username}`);

                return sendContainer();
            } catch (err) {
                return interaction.reply({ content: "A megadott tag nincs kitiltva!", flags: MessageFlags.Ephemeral });
            }

        // Ha nincs indok
        } else {
            try {
                await interaction.guild.bans.remove(target, `${userAuthor.user.username}`);

                return sendContainer();
            } catch (err) {
                return interaction.reply({ content: "A megadott tag nincs kitiltva!", flags: MessageFlags.Ephemeral });
            }
        }
    }
}