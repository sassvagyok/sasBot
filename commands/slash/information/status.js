const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");
const { version } = require("../../../package.json");

const fetch = require("node-fetch");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    name: "status",
    description: "Technikai információk sasBot-ról",
    info: "Aktuális verzió, válaszidő, uptime és szerverek számának kijelzése.",
    run: async (client, interaction) => {

        await interaction.deferReply();
        
        const msg = await interaction.fetchReply();
        const duration = moment.duration(client.uptime).format("M[h], D[n], H[ó], m[p], s[mp]", { trim: "all" });

        const divergence = await fetch("http://divergence.nyarchlinux.moe/api/divergence")
        const fetchedDivergence = await divergence.json();

        const statusContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- 🛠️ Verzió: \`${version}\`\n- 💢 Válaszidő: \`${msg.createdTimestamp - interaction.createdTimestamp}ms\`\n- ⌛ Uptime: \`${duration}\`\n- 🔌 Szerverek: \`${client.guilds.cache.size}\`\n- 🧶 Divergencia: \`${fetchedDivergence.divergence.toString().substring(0, 8)}\``));

        interaction.editReply({ components: [statusContainer], flags: MessageFlags.IsComponentsV2 });
    }
}