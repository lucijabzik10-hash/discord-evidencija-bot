require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const sessions = new Map();

const proizvodi = [
  { id: "piletina", name: "Piletina", emoji: "🐔" },
  { id: "jaje", name: "Jaje", emoji: "🥚" },
  { id: "govedje_meso", name: "Goveđe meso", emoji: "🥩" },
  { id: "kravlje_mleko", name: "Kravlje mleko", emoji: "🥛" },
  { id: "seme_konja", name: "Seme konja", emoji: "🐴" },
  { id: "dlake_grive", name: "Dlake grive", emoji: "🐎" },
  { id: "svinjska_mast", name: "Svinjska mast", emoji: "🐷" },
  { id: "svinjsko_meso", name: "Svinjsko meso", emoji: "🍖" },
  { id: "kozje_mleko", name: "Kozje mleko", emoji: "🐐" },
  { id: "jarece_meso", name: "Jareće meso", emoji: "🥩" },
  { id: "djubrivo", name: "Đubrivo", emoji: "💩" }
];

function mainEmbed() {
  return new EmbedBuilder()
    .setTitle("📦 Evidencija proizvoda")
    .setDescription(
      proizvodi.map(p => `${p.emoji} **${p.name}**`).join("\n") +
      "\n\nKlikni **EVIDENTIRAJ** za unos količina."
    )
    .setColor(0x00ff00);
}

function startButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("evidentiraj")
      .setLabel("EVIDENTIRAJ")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
  );
}

function productMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("odaberi_proizvod")
      .setPlaceholder("Odaberi proizvod za unos količine")
      .addOptions(
        proizvodi.map(p => ({
          label: p.name,
          value: p.id,
          emoji: p.emoji
        }))
      )
  );
}

function finishButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("zavrsi_evidenciju")
      .setLabel("ZAVRŠI EVIDENCIJU")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Primary)
  );
}

function userStatusEmbed(userId) {
  const data = sessions.get(userId) || {};

  return new EmbedBuilder()
    .setTitle("📝 Tvoja evidencija")
    .setDescription(
      proizvodi
        .map(p => `${p.emoji} **${p.name}:** ${data[p.id] || "0"}`)
        .join("\n")
    )
    .setColor(0xffcc00);
}

function finalLogEmbed(user, data) {
  return new EmbedBuilder()
    .setTitle("📋 Nova evidencija")
    .setDescription(
      `👤 **Igrač:** ${user}\n\n` +
      proizvodi
        .map(p => `${p.emoji} **${p.name}:** ${data[p.id] || "0"}`)
        .join("\n")
    )
    .setColor(0x00ff00)
    .setTimestamp();
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online kao ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send({
      embeds: [mainEmbed()],
      components: [startButton()]
    });
  } catch (error) {
    console.error("Greška:", error.message);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === "evidentiraj") {
    sessions.set(interaction.user.id, {});

    await interaction.reply({
      embeds: [userStatusEmbed(interaction.user.id)],
      components: [productMenu(), finishButton()],
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "odaberi_proizvod") {
    const productId = interaction.values[0];
    const product = proizvodi.find(p => p.id === productId);

    const modal = new ModalBuilder()
      .setCustomId(`unos_${product.id}`)
      .setTitle(`Unos: ${product.name}`);

    const input = new TextInputBuilder()
      .setCustomId("kolicina")
      .setLabel(`Količina za ${product.name}`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("npr. 18")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("unos_")) {
    const productId = interaction.customId.replace("unos_", "");
    const kolicina = interaction.fields.getTextInputValue("kolicina");

    const data = sessions.get(interaction.user.id) || {};
    data[productId] = kolicina;
    sessions.set(interaction.user.id, data);

    await interaction.reply({
      content: "Količina je spremljena.",
      embeds: [userStatusEmbed(interaction.user.id)],
      components: [productMenu(), finishButton()],
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId === "zavrsi_evidenciju") {
    const data = sessions.get(interaction.user.id) || {};

    await interaction.reply({
      content: "Evidencija je završena i logovana.",
      ephemeral: true
    });

    await interaction.channel.send({
      embeds: [finalLogEmbed(interaction.user.tag, data)]
    });

    await interaction.channel.send({
      embeds: [mainEmbed()],
      components: [startButton()]
    });

    sessions.delete(interaction.user.id);
  }
});

client.login(process.env.DISCORD_TOKEN);
