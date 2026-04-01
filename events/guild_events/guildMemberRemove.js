import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { updateMembercounter } from "../../utils/updateMembercounter.js";
import saverolesSchema from "../../models/saveroleModel.js";
import farewellSchema from "../../models/farewellModel.js";

export default {
    name: "guildMemberRemove",
    run: async  (client, guildMember) => {
        const saveRoles = async () => {
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
    
        const sendFarewellMessage = async () => {
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
            farewellEmbed.setColor(farewellData.Color ? farewellData.Color : "#17BC0F");
            if (farewellData.Timestamp) farewellEmbed.setTimestamp();
            if (farewellData.Icon) farewellEmbed.setAuthor({ name: farewellData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!`, iconURL: guildMember.user.displayAvatarURL() });
            else farewellEmbed.setAuthor({ name: farewellData.AuthorText ? replacedHeader : `${guildMember.user.username} kilépett!` });
        
            channel.send({ embeds: [farewellEmbed] });
        }
    
        saveRoles();
        sendFarewellMessage();
        updateMembercounter(guildMember);
    }
};