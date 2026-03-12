const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// ══════════════════════════════════════════════
//  ARBRE DE DÉCISION
// ══════════════════════════════════════════════
const STEPS = {

  // ÉTAPE 1 : Couleur de la feuille
  start: {
    question: '📋 **Quelle est la couleur de la feuille de calcul ?**',
    buttons: [
      { id: 'rouge', label: '🔴 Rouge', style: ButtonStyle.Danger, next: 'rouge_fin' },
      { id: 'verte', label: '🟢 Verte', style: ButtonStyle.Success, next: 'verte_crime' },
    ]
  },

  // ══ BRANCHE ROUGE ══
  rouge_fin: {
    result: true,
    color: 0xE74C3C,
    title: '🔴 Procédure normale',
    description: 'La feuille est **rouge**.\n\n✅ Appliquez la **procédure normale** et la peine correspondante.',
  },

  // ══ BRANCHE VERTE — Q1 : Y a-t-il un crime ? ══
  verte_crime: {
    question: '🟢 Feuille **verte** détectée.\n\n**Y a-t-il un crime ?**',
    buttons: [
      { id: 'crime_oui', label: '✅ Oui, il y a un crime', style: ButtonStyle.Danger, next: 'appel_procureur_crime' },
      { id: 'crime_non', label: '❌ Non, pas de crime', style: ButtonStyle.Success, next: 'verte_accepte' },
    ]
  },

  // ══ BRANCHE VERTE — Q2 : Individu accepte les chefs ? ══
  verte_accepte: {
    question: '🟢 Pas de crime.\n\n**L\'individu accepte-t-il les chefs d\'inculpation ?**',
    buttons: [
      { id: 'accepte_oui', label: '✅ Oui, il accepte', style: ButtonStyle.Success, next: 'sans_procureur' },
      { id: 'accepte_non', label: '❌ Non, il refuse', style: ButtonStyle.Danger, next: 'appel_procureur_sans_crime' },
    ]
  },

  // Accepte + pas de crime → sans procureur
  sans_procureur: {
    result: true,
    color: 0x2ECC71,
    title: '✅ Procédure sans procureur',
    description: 'L\'individu **accepte** les chefs d\'inculpation et il n\'y a **pas de crime**.\n\n✅ Appliquez la peine directement, **sans procureur**.',
  },

  // ══ CAS CRIME : appel procureur ══
  appel_procureur_crime: {
    question: '🚨 **Crime détecté.**\n\nUn **procureur** est-il disponible ?\n\n⚠️ En cas d\'indisponibilité, le CS ne peut pas gérer un crime.',
    buttons: [
      { id: 'proc_crime_oui', label: '✅ Procureur disponible', style: ButtonStyle.Success, next: 'procureur_verdict' },
      { id: 'proc_crime_non', label: '❌ Procureur indisponible', style: ButtonStyle.Danger, next: 'bracelet_crime' },
    ]
  },

  // ══ CAS REFUS SANS CRIME : appel procureur ══
  appel_procureur_sans_crime: {
    question: '⚖️ **L\'individu refuse les chefs d\'inculpation** (pas de crime).\n\nUn **procureur** est-il disponible ?',
    buttons: [
      { id: 'proc_sc_oui', label: '✅ Procureur disponible', style: ButtonStyle.Success, next: 'procureur_verdict' },
      { id: 'proc_sc_non', label: '❌ Procureur indisponible', style: ButtonStyle.Danger, next: 'appel_cs' },
    ]
  },

  // Procureur dispo → verdict
  procureur_verdict: {
    result: true,
    color: 0x3498DB,
    title: '⚖️ Procureur donne le verdict',
    description: 'Le **procureur** est disponible.\n\n✅ Laissez le procureur statuer et **appliquez la peine** prononcée.',
  },

  // Procureur indispo + CRIME → bracelet direct
  bracelet_crime: {
    result: true,
    color: 0xE67E22,
    title: '🚨 Procédure bracelet',
    description: 'Le **procureur est indisponible** et il s\'agit d\'un **crime**.\n\n⛔ Le Command Staff **ne peut pas gérer** un crime.\n\n🔒 Appliquez la **procédure bracelet**.',
  },

  // ══ CAS REFUS SANS CRIME + procureur indispo : appel CS ══
  appel_cs: {
    question: '🟣 Le procureur est indisponible.\n\nUn **Command Staff** est-il disponible ?\n\n*(Pas de crime — le CS peut gérer)*',
    buttons: [
      { id: 'cs_oui', label: '✅ CS disponible', style: ButtonStyle.Success, next: 'cs_verdict' },
      { id: 'cs_non', label: '❌ CS indisponible', style: ButtonStyle.Danger, next: 'bracelet_cs' },
    ]
  },

  // CS dispo → verdict
  cs_verdict: {
    result: true,
    color: 0x9B59B6,
    title: '🟣 Command Staff donne le verdict',
    description: 'Le **Command Staff** est disponible.\n\n✅ Laissez le CS statuer et **appliquez la peine** prononcée.',
  },

  // CS indispo → bracelet
  bracelet_cs: {
    result: true,
    color: 0xE67E22,
    title: '🚨 Procédure bracelet',
    description: 'Le **Command Staff est indisponible**.\n\n🔒 Appliquez la **procédure bracelet**.',
  },
};

// ══════════════════════════════════════════════
//  GESTION DES SESSIONS PAR UTILISATEUR
// ══════════════════════════════════════════════
const sessions = new Map();

// ══════════════════════════════════════════════
//  FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════

function buildQuestion(stepKey) {
  const step = STEPS[stepKey];

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📋 Procédure judiciaire')
    .setDescription(step.question)
    .setFooter({ text: 'Répondez en cliquant sur un bouton ci-dessous.' });

  const row = new ActionRowBuilder().addComponents(
    step.buttons.map(btn =>
      new ButtonBuilder()
        .setCustomId(btn.id)
        .setLabel(btn.label)
        .setStyle(btn.style)
    )
  );

  return { embeds: [embed], components: [row] };
}

function buildResult(step) {
  const embed = new EmbedBuilder()
    .setColor(step.color)
    .setTitle(step.title)
    .setDescription(step.description)
    .setFooter({ text: 'Tapez !procedure pour recommencer.' });

  return { embeds: [embed], components: [] };
}

// ══════════════════════════════════════════════
//  ÉVÉNEMENTS
// ══════════════════════════════════════════════

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Commande !procedure
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() !== '!procedure') return;

  sessions.set(message.author.id, 'start');
  await message.reply(buildQuestion('start'));
});

// Clics sur les boutons
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  const currentStep = sessions.get(userId);

  if (!currentStep) {
    await interaction.reply({
      content: '❌ Session expirée. Tapez `!procedure` pour recommencer.',
      ephemeral: true
    });
    return;
  }

  const step = STEPS[currentStep];
  if (!step || !step.buttons) return;

  const clicked = step.buttons.find(b => b.id === interaction.customId);
  if (!clicked) return;

  const nextKey = clicked.next;
  const nextStep = STEPS[nextKey];
  if (!nextStep) return;

  sessions.set(userId, nextKey);

  if (nextStep.result) {
    sessions.delete(userId);
    await interaction.update(buildResult(nextStep));
  } else {
    await interaction.update(buildQuestion(nextKey));
  }
});

// ══════════════════════════════════════════════
//  DÉMARRAGE
// ══════════════════════════════════════════════
client.login(process.env.DISCORD_TOKEN);
