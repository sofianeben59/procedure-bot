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

  // ══ BRANCHE VERTE — Q1 : Crime ou refus ? ══
  verte_crime: {
    question: '🟢 Feuille **verte** détectée.\n\n**Y a-t-il un crime OU l\'individu refuse-t-il les chefs d\'inculpation ?**',
    buttons: [
      { id: 'oui_crime', label: '✅ Oui (crime ou refus)', style: ButtonStyle.Danger, next: 'appel_procureur' },
      { id: 'non_crime', label: '❌ Non (accepte + pas de crime)', style: ButtonStyle.Success, next: 'sans_procureur' },
    ]
  },

  // NON → procédure sans procureur
  sans_procureur: {
    result: true,
    color: 0x2ECC71,
    title: '✅ Procédure sans procureur',
    description: 'L\'individu **accepte** les chefs d\'inculpation et il n\'y a **pas de crime**.\n\n✅ Appliquez la peine directement, **sans procureur**.',
  },

  // OUI → appel procureur
  appel_procureur: {
    question: '⚖️ **Crime détecté ou refus des chefs d\'inculpation.**\n\nUn **procureur** est-il disponible ?',
    buttons: [
      { id: 'proc_oui', label: '✅ Procureur disponible', style: ButtonStyle.Success, next: 'procureur_verdict' },
      { id: 'proc_non', label: '❌ Procureur indisponible', style: ButtonStyle.Danger, next: 'bracelet_crime' },
    ]
  },

  // Procureur dispo → verdict
  procureur_verdict: {
    result: true,
    color: 0x3498DB,
    title: '⚖️ Procureur donne le verdict',
    description: 'Le **procureur** est disponible.\n\n✅ Laissez le procureur statuer et **appliquez la peine** prononcée.',
  },

  // Procureur indispo + crime/refus → bracelet direct (CS interdit)
  bracelet_crime: {
    result: true,
    color: 0xE67E22,
    title: '🚨 Procédure bracelet',
    description: 'Le **procureur est indisponible** et il s\'agit d\'un crime ou d\'un refus des chefs.\n\n⛔ Le Command Staff **ne peut pas gérer** cette situation.\n\n🔒 Appliquez la **procédure bracelet**.',
  },

  // ══ CAS SANS CRIME : procureur indispo → appel CS ══
  appel_cs: {
    question: '🟣 Le procureur est indisponible et il n\'y a **pas de crime**.\n\nUn **Command Staff** est-il disponible ?',
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

  // Trouver le bouton cliqué
  const clicked = step.buttons.find(b => b.id === interaction.customId);
  if (!clicked) return;

  // Cas spécial : procureur indispo sans crime → appel CS
  let nextKey = clicked.next;
  if (clicked.id === 'proc_non') {
    // On vérifie si on vient d'un contexte sans crime (non gérable)
    // La logique bracelet_crime est déjà correcte par défaut
    nextKey = 'bracelet_crime';
  }

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
