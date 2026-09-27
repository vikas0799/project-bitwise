// Site-wide settings. Paste your Telegram channel link (https://t.me/...)
// to show the "Get weekly deadline alerts" button on /opportunities.
export const TELEGRAM_CHANNEL_URL = '';

export const CONTACT_EMAIL = 'bitwiseschool@gmail.com';
export const WHATSAPP_NUMBER = '919988728749';
export const WHATSAPP_DISPLAY = '+91 99887 28749';

// Forms have no backend yet: they open the visitor's email app with the
// message filled in, addressed to CONTACT_EMAIL.
export const mailtoLink = (subject: string, lines: string[]) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
