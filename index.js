require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function mainEmbed() {
  return new EmbedBuilder()
    .setTitle("📦 Evidencija proizvoda")
    .setDescription(
      "🐔 **Piletina**\n" +
      "🥚 **Jaje**\n" +
      "🥩 **Goveđe meso**\n" +
      "🥛 **Kravlje mleko**\n" +
      "🐴 **Seme konja**\n" +
      "🐎 **Dlake grive**\n" +
      "🐷 **Svinjska mast**\n" +
      "🍖 **Svinjsko meso**\n" +
      "🐐 **Kozje mleko**\n" +
      "🥩 **Jareće meso**\n" +
      "💩 **Đubrivo**\n\n" +
      "Klikni **EVIDENTIRAJ** i upiši količine redom."
    )
    .setColor(0x00ff00);
}

function button() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("evidentiraj")
      .setLabel("EVIDENTIRAJ")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
  );
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online kao ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send({
      embeds: [mainEmbed()],
      components: [button()]
    });
  } catch (error) {
    console.error("Greška:", error.message);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === "evidentiraj") {
    const modal = new ModalBuilder()
      .setCustomId("forma_evidencija")
      .setTitle("Evidencija proizvoda");

    const unos = new TextInputBuilder()
      .setCustomId("unos")
      .setLabel("Upiši sve količine redom")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(
        "Piletina: 18\n" +
        "Jaje: 12\n" +
        "Goveđe meso: 12\n" +
        "Kravlje mleko: 12\n" +
        "Seme konja: 18\n" +
        "Dlake grive: 6\n" +
        "Svinjska mast: 12\n" +
        "Svinjsko meso: 12\n" +
        "Kozje mleko: 12\n" +
        "Jareće meso: 12\n" +
        "Đubrivo: 13"
      )
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(unos));

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_evidencija") {
    const unos = interaction.fields.getTextInputValue("unos");

    const logEmbed = new EmbedBuilder()
      .setTitle("📋 Nova evidencija")
      .setDescription(`👤 **Igrač:** ${interaction.user.tag}\n\n${unos}`)
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({
      content: "Evidencija je spremljena.",
      ephemeral: true
    });

    await interaction.channel.send({
      embeds: [logEmbed],
      components: [button()]
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
