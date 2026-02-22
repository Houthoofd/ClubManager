/**
 * MessageCard Stories
 *
 * Storybook stories for the MessageCard component
 * Demonstrates various message types and states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MessageCard } from './MessageCard';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof MessageCard> = {
  title: 'Features/Messages/MessageCard',
  component: MessageCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: { control: 'text' },
    subject: { control: 'text' },
    content: { control: 'text' },
    sender: { control: 'text' },
    senderId: { control: 'text' },
    recipient: { control: 'text' },
    recipientId: { control: 'text' },
    sentDate: { control: 'date' },
    isRead: { control: 'boolean' },
    priority: {
      control: 'select',
      options: ['low', 'normal', 'high', 'urgent'],
    },
    type: {
      control: 'select',
      options: ['info', 'announcement', 'reminder', 'alert', 'personal'],
    },
    hasAttachment: { control: 'boolean' },
    onClick: { action: 'clicked' },
    onMarkAsRead: { action: 'mark-as-read' },
    onReply: { action: 'reply' },
    onDelete: { action: 'delete' },
  },
};

export default meta;
type Story = StoryObj<typeof MessageCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default MessageCard
 * Basic message card with standard information
 */
export const Default: Story = {
  args: {
    id: '1',
    subject: 'Bienvenue au club',
    content: 'Nous sommes ravis de vous accueillir dans notre club. N\'hésitez pas à consulter les cours disponibles.',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'Jean Dupont',
    recipientId: '101',
    sentDate: '2024-01-28T10:00:00Z',
    isRead: false,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};

/**
 * Unread Message
 * Message that hasn't been read yet
 */
export const UnreadMessage: Story = {
  args: {
    id: '2',
    subject: 'Nouveau cours disponible',
    content: 'Un nouveau cours de Yoga vient d\'être ajouté au planning. Inscrivez-vous dès maintenant !',
    sender: 'Sophie Martin',
    senderId: '102',
    recipient: 'Marie Dubois',
    recipientId: '103',
    sentDate: '2024-01-28T14:30:00Z',
    isRead: false,
    priority: 'normal',
    type: 'announcement',
    hasAttachment: false,
  },
};

/**
 * Read Message
 * Message that has been read
 */
export const ReadMessage: Story = {
  args: {
    id: '3',
    subject: 'Confirmation d\'inscription',
    content: 'Votre inscription au cours de Pilates du mercredi a bien été enregistrée.',
    sender: 'Système',
    senderId: '0',
    recipient: 'Pierre Bernard',
    recipientId: '104',
    sentDate: '2024-01-27T09:15:00Z',
    isRead: true,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};

/**
 * High Priority Message
 * Important message requiring attention
 */
export const HighPriority: Story = {
  args: {
    id: '4',
    subject: 'Modification de planning',
    content: 'Le cours de demain est déplacé de 18h à 19h. Merci de prendre note de ce changement.',
    sender: 'Thomas Bernard',
    senderId: '105',
    recipient: 'Claire Rousseau',
    recipientId: '106',
    sentDate: '2024-01-28T16:00:00Z',
    isRead: false,
    priority: 'high',
    type: 'announcement',
    hasAttachment: false,
  },
};

/**
 * Urgent Message
 * Critical message requiring immediate attention
 */
export const UrgentMessage: Story = {
  args: {
    id: '5',
    subject: 'URGENT: Cours annulé',
    content: 'Le cours de ce soir est annulé en raison d\'un imprévu. Veuillez nous excuser pour la gêne occasionnée.',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'Laurent Petit',
    recipientId: '107',
    sentDate: '2024-01-28T17:30:00Z',
    isRead: false,
    priority: 'urgent',
    type: 'alert',
    hasAttachment: false,
  },
};

/**
 * Reminder Message
 * Reminder for upcoming event or deadline
 */
export const ReminderMessage: Story = {
  args: {
    id: '6',
    subject: 'Rappel: Cours demain matin',
    content: 'N\'oubliez pas votre cours de Yoga demain à 8h00. À bientôt !',
    sender: 'Système',
    senderId: '0',
    recipient: 'Emma Blanc',
    recipientId: '108',
    sentDate: '2024-01-28T20:00:00Z',
    isRead: false,
    priority: 'normal',
    type: 'reminder',
    hasAttachment: false,
  },
};

/**
 * Personal Message
 * Direct message from another user
 */
export const PersonalMessage: Story = {
  args: {
    id: '7',
    subject: 'Question sur le cours',
    content: 'Bonjour, j\'aimerais savoir si je peux rattraper le cours que j\'ai manqué la semaine dernière ?',
    sender: 'Julie Laurent',
    senderId: '109',
    recipient: 'Sophie Martin',
    recipientId: '102',
    sentDate: '2024-01-28T11:45:00Z',
    isRead: true,
    priority: 'normal',
    type: 'personal',
    hasAttachment: false,
  },
};

/**
 * Message with Attachment
 * Message containing an attached file
 */
export const WithAttachment: Story = {
  args: {
    id: '8',
    subject: 'Planning du mois de février',
    content: 'Veuillez trouver en pièce jointe le planning complet des cours pour le mois de février.',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'Antoine Roux',
    recipientId: '110',
    sentDate: '2024-01-28T08:00:00Z',
    isRead: false,
    priority: 'normal',
    type: 'announcement',
    hasAttachment: true,
  },
};

/**
 * Long Subject
 * Message with a very long subject line
 */
export const LongSubject: Story = {
  args: {
    id: '9',
    subject: 'Information importante concernant les modifications du planning des cours de la semaine prochaine et les nouvelles inscriptions',
    content: 'Des changements importants ont été apportés au planning.',
    sender: 'Camille Lefevre',
    senderId: '111',
    recipient: 'Isabelle Garnier',
    recipientId: '112',
    sentDate: '2024-01-28T13:20:00Z',
    isRead: false,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};

/**
 * Long Content
 * Message with lengthy content
 */
export const LongContent: Story = {
  args: {
    id: '10',
    subject: 'Règlement intérieur',
    content: 'Chers membres, nous tenons à vous rappeler les règles importantes du club : respecter les horaires, nettoyer les équipements après usage, porter une tenue appropriée, respecter les autres membres et le personnel, ne pas monopoliser les équipements pendant les heures de pointe, signaler tout problème au personnel, et surtout profiter pleinement de votre expérience au club !',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'François Dupuis',
    recipientId: '113',
    sentDate: '2024-01-27T15:00:00Z',
    isRead: true,
    priority: 'normal',
    type: 'announcement',
    hasAttachment: false,
  },
};

/**
 * Old Message
 * Message sent several days ago
 */
export const OldMessage: Story = {
  args: {
    id: '11',
    subject: 'Enquête de satisfaction',
    content: 'Nous aimerions connaître votre avis sur nos services. Merci de prendre quelques minutes pour répondre.',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'Amélie Mercier',
    recipientId: '114',
    sentDate: '2024-01-15T10:00:00Z',
    isRead: true,
    priority: 'low',
    type: 'info',
    hasAttachment: true,
  },
};

/**
 * Recent Message
 * Message sent just minutes ago
 */
export const RecentMessage: Story = {
  args: {
    id: '12',
    subject: 'Nouvelle inscription',
    content: 'Un nouveau membre vient de s\'inscrire à votre cours.',
    sender: 'Système',
    senderId: '0',
    recipient: 'Julien Girard',
    recipientId: '115',
    sentDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};

/**
 * Low Priority Message
 * Non-urgent informational message
 */
export const LowPriority: Story = {
  args: {
    id: '13',
    subject: 'Newsletter mensuelle',
    content: 'Découvrez les actualités du mois et les événements à venir dans notre newsletter.',
    sender: 'Marketing',
    senderId: '2',
    recipient: 'Chloé Fontaine',
    recipientId: '116',
    sentDate: '2024-01-25T12:00:00Z',
    isRead: false,
    priority: 'low',
    type: 'info',
    hasAttachment: true,
  },
};

/**
 * System Message
 * Automated system notification
 */
export const SystemMessage: Story = {
  args: {
    id: '14',
    subject: 'Paiement effectué',
    content: 'Votre paiement mensuel a été traité avec succès. Merci !',
    sender: 'Système',
    senderId: '0',
    recipient: 'Marc Lefebvre',
    recipientId: '117',
    sentDate: '2024-01-28T06:00:00Z',
    isRead: false,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};

/**
 * Message with Actions
 * Message card with reply, mark as read, and delete actions
 */
export const WithActions: Story = {
  args: {
    id: '15',
    subject: 'Proposition de partenariat',
    content: 'Nous aimerions discuter d\'une éventuelle collaboration. Seriez-vous disponible pour un rendez-vous ?',
    sender: 'Carlos Rodriguez',
    senderId: '118',
    recipient: 'Alexandre Bonnet',
    recipientId: '119',
    sentDate: '2024-01-28T09:30:00Z',
    isRead: false,
    priority: 'normal',
    type: 'personal',
    hasAttachment: false,
    onMarkAsRead: (message) => console.log('Mark as read:', message),
    onReply: (message) => console.log('Reply to:', message),
    onDelete: (message) => console.log('Delete:', message),
  },
};

/**
 * Clickable Card
 * Message card that can be clicked
 */
export const Clickable: Story = {
  args: {
    id: '16',
    subject: 'Invitation événement',
    content: 'Vous êtes invité à notre événement portes ouvertes ce samedi.',
    sender: 'Admin ClubManager',
    senderId: '1',
    recipient: 'Lucie Moreau',
    recipientId: '120',
    sentDate: '2024-01-28T10:00:00Z',
    isRead: false,
    priority: 'high',
    type: 'announcement',
    hasAttachment: true,
    onClick: (message) => console.log('Clicked message:', message),
  },
};

/**
 * Draft Message
 * Unfinished message in draft state
 */
export const DraftMessage: Story = {
  args: {
    id: '17',
    subject: 'Brouillon: Question sur abonnement',
    content: 'Je souhaiterais avoir des informations sur...',
    sender: 'Vous',
    senderId: '999',
    recipient: 'Admin ClubManager',
    recipientId: '1',
    sentDate: '2024-01-28T12:00:00Z',
    isRead: true,
    priority: 'normal',
    type: 'personal',
    hasAttachment: false,
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    id: '999',
    subject: 'Sujet du message',
    content: 'Contenu du message...',
    sender: 'Expéditeur',
    senderId: '999',
    recipient: 'Destinataire',
    recipientId: '888',
    sentDate: new Date().toISOString(),
    isRead: false,
    priority: 'normal',
    type: 'info',
    hasAttachment: false,
  },
};
