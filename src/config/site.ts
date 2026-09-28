// Site-wide settings. Paste your Telegram channel link (https://t.me/...)
// to show the "Get weekly deadline alerts" button on /opportunities.
export const TELEGRAM_CHANNEL_URL = '';

export const CONTACT_EMAIL = 'bitwiseschool@gmail.com';
export const WHATSAPP_NUMBER = '919988728749';
export const WHATSAPP_DISPLAY = '+91 99887 28749';
export const PARENT_COMPANY_URL = 'https://www.bitwiseventuresgroup.org';

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61578938786384',
  x: 'https://x.com/bitwiseschool',
  instagram: 'https://www.instagram.com/bitwiseschooloftechnology/',
  linkedin: 'https://www.linkedin.com/in/bitwise-school-of-technology-5a5296377/',
  youtube: 'https://www.youtube.com/@bitwiseschool',
} as const;

// Forms have no backend yet: they open WhatsApp, the visitor's email app or
// Gmail in the browser with the message filled in, addressed to us.
const emailBody = (lines: string[]) => encodeURIComponent(lines.join('\r\n'));

export const mailtoLink = (subject: string, lines: string[]) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${emailBody(lines)}`;

// For visitors with no email app set up (common on laptops).
export const gmailComposeLink = (subject: string, lines: string[]) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${emailBody(lines)}`;

export const whatsappLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
