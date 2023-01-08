const { MessageEmbed, EmbedBuilder, ButtonBuilder, MessageButton, ActionRowBuilder, MessageActionRow, MessageAttachment, AttachmentBuilder, ButtonStyle, IntentsBitField, Intents } = require("discord.js");

module.exports = {
    embed: EmbedBuilder || MessageEmbed,
    button: ButtonBuilder || MessageButton,
    actionRow: ActionRowBuilder || MessageActionRow,
    attachment: AttachmentBuilder || MessageAttachment,
    style: ButtonStyle || { 
        Primary: "PRIMARY",
        Secondary: "SECONDARY",
        Success: "SUCCESS",
        Danger: "DANGER",
        Link: "LINK",
    },
    intens: IntentsBitField || Intents
};