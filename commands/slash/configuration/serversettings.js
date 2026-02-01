const { PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");

const autoRoleSchema = require("../../../models/autoroleModel.js");
const djRoleSchema = require("../../../models/djroleModel.js");
const farewellSchema = require("../../../models/farewellModel.js");
const membercounterSchema = require("../../../models/membercounterModel.js");
const saverolesSchema = require("../../../models/saveroleModel.js");
const welcomeSchema = require("../../../models/welcomeModel.js");
const musicChannelSchema = require("../../../models/musicchannelModel.js");

module.exports = {
    name: "serversettings",
    description: "A szerver konfigurációja",
    info: "A szerveren beállított sasBot-konfigurációk listája.\n`Szükséges jogosultság: Adminisztrátor`",
    has_embed: true,
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    run: async (client, interaction) => {

        const autoRoleData = await autoRoleSchema.findOne({ Guild: interaction.guild.id });
        const djRoleData = await djRoleSchema.findOne({ Guild: interaction.guild.id });
        const farewellData = await farewellSchema.findOne({ Guild: interaction.guild.id });
        const membercounterData = await membercounterSchema.findOne({ Guild: interaction.guild.id });
        const saveroleData = await saverolesSchema.findOne({ Guild: interaction.guild.id });
        const welcomeData  = await welcomeSchema.findOne({ Guild: interaction.guild.id });
        const musicChannelData = await musicChannelSchema.findOne({ Guild: interaction.guild.id });

        const djRole = interaction.guild.roles.cache.get(djRoleData?.Role);

        const serversettingsContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Szerver konfigurációja"))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Automatikus rangok:** \`${autoRoleData ? autoRoleData.Roles.length : "0"}\`\n- **Rangok elmentése:** \`${saveroleData ? "Bekapcsolva" : "Kikapcsolva"}\`\n- **DJ Rang:** ${djRole ? djRole : "`Nincs beállítva`"}\n- **Zenecsatorna:** ${musicChannelData ? `<#${musicChannelData.Channel}>` : "`Nincs beállítva`"}\n- **Tagszámláló csatorna:** ${membercounterData ? `<#${membercounterData.Channel}>` : "`Nincs beállítva`"}\n- **Búcsúüzenet csatornája:** ${farewellData ? `<#${farewellData.Channel}>` : "`Nincs beállítva`"}\n- **Üdvözlő üzenet csatornája:** ${welcomeData ? `<#${welcomeData.Channel}>` : "`Nincs beállítva`"}`));
        
        interaction.reply({ components: [serversettingsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
    }
}