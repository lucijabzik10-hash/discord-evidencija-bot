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

const proizvodi = [
  { emoji: "🐔", name: "Piletina" },
  { emoji: "🥚", name: "Jaje" },
  { emoji: "🥩", name: "Goveđe meso" },
  { emoji: "🥛", name: "Kravlje mleko" },
  { emoji: "🐴", name: "Seme konja" },
  { emoji: "🐎", name: "Dlake grive" },
  { emoji: "🐷", name: "Svinjska mast" },
  { emoji: "🍖", name: "Svinjsko meso" },
  { emoji: "🐐", name: "Kozje mleko" },
  { emoji: "🥩", name: "Jareće meso" },
  { emoji: "💩", name: "Đubrivo" }
];

function mainEmbed() {
  return new EmbedBuilder()
    .setTitle("📦 Evidencija proizvoda")
    .setDescription(
      proizvodi.map(p => `${p.emoji} **${p.name}**`).join("\n") +
      "\n\nKlikni **EVIDENTIRAJ** i upiši količine redom."
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

function napraviLog(unos) {
  const brojevi = unos
    .split(/[,\n ]+/)
    .map(x => x.trim())
    .filter(Boolean);

  let tekst = "";

  proizvodi.forEach((p, index) => {
    tekst += `${p.emoji} **${p.name}:** ${brojevi[index] || "0"}\n`;
  });

  return tekst;
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
    console.error("Greška kod slanja početne poruke:", error.message);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === "evidentiraj") {
    const modal = new ModalBuilder()
      .setCustomId("forma_evidencija")
      .setTitle("Evidencija proizvoda");

    const unos = new TextInputBuilder()
      .setCustomId("unos")
      .setLabel("Količine redom")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("18,12,12,12,18,6,12,12,12,12,13")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(unos));

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_evidencija") {
    const unos = interaction.fields.getTextInputValue("unos");
    const logTekst = napraviLog(unos);

    const logEmbed = new EmbedBuilder()
      .setTitle("📋 Nova evidencija")
      .setDescription(`👤 **Igrač:** ${interaction.user.tag}\n\n${logTekst}`)
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
