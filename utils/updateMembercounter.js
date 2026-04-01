import { PermissionFlagsBits } from "discord.js";
import membercounterSchema from "../models/membercounterModel.js";

export const updateMembercounter = async (guildMember) => {
    const membercounterData = await membercounterSchema.findOne({ Guild: guildMember.guild.id });

    if (!membercounterData) return;

    const guild = guildMember.guild;
    const memberCount = guild.memberCount;
    const formattedChannelName = membercounterData.Name.includes("[tagok]") ? membercounterData.Name.replace("[tagok]", memberCount) : `${membercounterData.Name}: ${memberCount}`;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return;

    const channel = guild.channels.cache.get(membercounterData.Channel);

    if (!channel) return membercounterSchema.deleteOne({ _id: membercounterData._id })
    if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.Connect)) return;

    channel.setName(formattedChannelName);

    membercounterData.Member = memberCount;
    await membercounterData.save();
}