import { PermissionFlagsBits, EmbedBuilder, ChannelType, ContainerBuilder, TextDisplayBuilder, MessageFlags, ButtonBuilder, ActionRowBuilder, SeparatorBuilder } from "discord.js";
import client from "../index.js";
import autoRoleSchema from "../models/autoroleModel.js";
import welcomeSchema from "../models/welcomeModel.js";
import farewellSchema from "../models/farewellModel.js";
import saverolesSchema from "../models/saveroleModel.js";
import modsettingSchema from "../models/modsettingModel.js";
import membercounterSchema from "../models/membercounterModel.js";

const updateMembercounter = async (guildMember) => {
    const membercounterData = await membercounterSchema.findOne({ Guild: guildMember.guild.id });

    if (!membercounterData) return;

    const guild = guildMember.guild;
    const memberCount = guild.memberCount;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return;

    const channel = guild.channels.cache.get(membercounterData.Channel);

    if (!channel) return membercounterSchema.deleteOne({ _id: membercounterData._id })
    if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.Connect)) return;

    channel.setName(`${membercounterData.Name}: ${memberCount}`);

    membercounterData.Member = memberCount;
    await membercounterData.save();
}

client.on("guildCreate", async (guild) => {
    // Bemutatkozó üzenet
    const channel = guild.channels.cache.filter(x => x.type === ChannelType.GuildText && x.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)).first();

    if (channel) {
        const supportButton = new ButtonBuilder()
        .setStyle("Link")
        .setURL("https://discord.gg/s8XtzBasQF")
        .setLabel("Szerver");

        const docsButton = new ButtonBuilder()
        .setStyle("Link")
        .setURL("https://sassvagyok.github.io/sasBot-docs/")
        .setLabel("Dokumentáció");

        const row = new ActionRowBuilder().addComponents(supportButton, docsButton);

        const introContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Köszönöm, hogy hozzáadtál a szerverhez!\n- Az összes parancs és leírásuk: </help összes:1338161979352813617>\n- Visszajelzés küldése: </feedback:1338161979684159601>"))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addActionRowComponents(row);

        channel.send({ components: [introContainer], flags: MessageFlags.IsComponentsV2 });
    }

    // Modsettings első regisztrálás
    const modsettingData = await modsettingSchema.findOne({ Guild: guild.id });

    if (!modsettingData) {
        const newData = new modsettingSchema({
            Guild: guild.id,
            DM: true,
            Log: true,
            Send: true
        });
        await newData.save();
    }
});

client.on("guildMemberAdd", async guildMember => {

    // Saveroles (belépéskor)
    const saveRoleAdd = async () => {
        const saveroleData = await saverolesSchema.findOne({ Guild: guildMember.guild.id });
        if (!saveroleData) return;
        const savedUser = saveroleData.Users?.find(x => x.UID === guildMember.user.id);
        if (!savedUser) return;
        if (!guildMember.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    
        for (let i = 0; i < savedUser.Roles.length; i++) {
            if (guildMember.guild.roles.cache.find(role => role.id === savedUser.Roles[i]).rawPosition > guildMember.guild.members.me.roles.highest.position) return;
            guildMember.roles.add(savedUser.Roles[i]);
        }

        let index;
        saveroleData.Users.some(function(entry, i) {
            if (entry.UID === savedUser.UID) {
                index = i;
                return true;
            }
        });

        if (index > -1) {
            saveroleData.Users.splice(index, 1);
            await saveroleData.save();
        }
    }

    // Autorole
    const autoroleAdd = async () => {
        const autoRoleData = await autoRoleSchema.findOne({ Guild: guildMember.guild.id });
        if (!autoRoleData) return;
        const autoRoles = autoRoleData.Roles;
        if (!autoRoles) return;
        if (!guildMember.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    
        for (let i = 0; i < autoRoles.length; i++) {
            if (guildMember.guild.roles.cache.find(role => role.id === autoRoles[i]).rawPosition > guildMember.guild.members.me.roles.highest.position) return;
            guildMember.roles.add(autoRoles[i]);
        }
    }

    // Welcome
    const welcomeSend = async () => {
        const welcomeData = await welcomeSchema.findOne({ Guild: guildMember.guild.id });
        if (!welcomeData) return;
        const channel = guildMember.guild.channels.cache.get(welcomeData.Channel);
        if (!channel) return;
        if (!channel.permissionsFor(guildMember.guild.members.me).has(PermissionFlagsBits.ViewChannel && PermissionFlagsBits.SendMessages && PermissionFlagsBits.EmbedLinks)) return;
        
        const replacedDescription = welcomeData.Description?.replace("[tag]", guildMember.user.username);
        const replacedTitle = welcomeData.Title?.replace("[tag]", guildMember.user.username);
        const replacedHeader = welcomeData.AuthorText?.replace("[tag]", guildMember.user.username);
        
        const welcomeEmbed = new EmbedBuilder()
        .setDescription(replacedDescription);

        if (welcomeData.Title) welcomeEmbed.setTitle(replacedTitle);
        welcomeEmbed.setThumbnail(welcomeData.Thumbnail ? welcomeData.Thumbnail : guildMember.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }));
        welcomeEmbed.setColor(welcomeData.Color ? welcomeData.Color : "#E2162E");
        if (welcomeData.Timestamp) welcomeEmbed.setTimestamp();
        if (welcomeData.Icon) welcomeEmbed.setAuthor({ name: welcomeData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!`, iconURL: guildMember.user.displayAvatarURL() });
        else welcomeEmbed.setAuthor({ name: welcomeData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!` });
    
        channel.send({ embeds: [welcomeEmbed] });
    }

    saveRoleAdd();
    autoroleAdd();
    welcomeSend();
    updateMembercounter(guildMember);
});

client.on("guildMemberRemove", async guildMember => {

    // Saverole (kilépéskor)
    const saveroleSave = async () => {
        const saveroleData = await saverolesSchema.findOne({ Guild: guildMember.guild.id });
        if (!saveroleData) return;
        const roles = guildMember.roles.cache.filter((roles) => roles.id !== guildMember.guild.id).map((role) => role.id);
        if (roles.length === 0) return;

        if (saveroleData.Users) {
            saveroleData.Users.push({
                UID: guildMember.user.id,
                Roles: roles
            });
            await saveroleData.save();
        } else {
            saveroleData.Users.push({
                Users: {
                    UID: guildMember.user.id,
                    Roles: guildMember.roles.id
                }
            });
            await saveroleData.save();
        }
    }

    // Farewell
    const farewellSend = async () => {
        const farewellData = await farewellSchema.findOne({ Guild: guildMember.guild.id });
        if (!farewellData) return;
        const channel = guildMember.guild.channels.cache.get(farewellData.Channel);
        if (!channel) return;
        if (!channel.permissionsFor(guildMember.guild.members.me).has(PermissionFlagsBits.ViewChannel && PermissionFlagsBits.SendMessages && PermissionFlagsBits.EmbedLinks)) return;

        const replacedDescription = farewellData.Description?.replace("[tag]", guildMember.user.username);
        const replacedTitle = farewellData.Title?.replace("[tag]", guildMember.user.username);
        const replacedHeader = farewellData.AuthorText?.replace("[tag]", guildMember.user.username);
        
        const farewellEmbed = new EmbedBuilder()
        .setDescription(replacedDescription);

        if (farewellData.Title) farewellEmbed.setTitle(replacedTitle);
        farewellEmbed.setThumbnail(farewellData.Thumbnail ? farewellData.Thumbnail : guildMember.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }));
        farewellEmbed.setColor(farewellData.Color ? farewellData.Color : "#E2162E");
        if (farewellData.Timestamp) farewellEmbed.setTimestamp();
        if (farewellData.Icon) farewellEmbed.setAuthor({ name: farewellData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!`, iconURL: guildMember.user.displayAvatarURL() });
        else farewellEmbed.setAuthor({ name: farewellData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!` });
    
        channel.send({ embeds: [farewellEmbed] });
    }

    saveroleSave();
    farewellSend();
    updateMembercounter(guildMember);
});