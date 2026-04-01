import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { updateMembercounter } from "../../utils/updateMembercounter.js";
import autoRoleSchema from "../../models/autoroleModel.js";
import saverolesSchema from "../../models/saveroleModel.js";
import welcomeSchema from "../../models/welcomeModel.js";

export default {
    name: "guildMemberAdd",
    run: async (client, guildMember) => {
        const addSavedRoles = async () => {
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
    
        const addAutoRoles = async () => {
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
    
        const sendWelcomeMessage = async () => {
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
    
        addSavedRoles();
        addAutoRoles();
        sendWelcomeMessage();
        updateMembercounter(guildMember);
    }
};