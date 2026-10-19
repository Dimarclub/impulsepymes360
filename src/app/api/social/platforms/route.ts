import { NextResponse } from 'next/server'

// Catálogo de plataformas sociales soportadas
export async function GET() {
  return NextResponse.json([
    { id: 'INSTAGRAM', name: 'Instagram', icon: 'Instagram', color: '#E1306C', maxCaption: 2200, supports: ['IMAGE', 'VIDEO', 'CAROUSEL'] },
    { id: 'FACEBOOK', name: 'Facebook', icon: 'Facebook', color: '#1877F2', maxCaption: 63206, supports: ['IMAGE', 'VIDEO', 'TEXT'] },
    { id: 'TIKTOK', name: 'TikTok', icon: 'Music2', color: '#000000', maxCaption: 150, supports: ['VIDEO'] },
    { id: 'X', name: 'X (Twitter)', icon: 'Twitter', color: '#000000', maxCaption: 280, supports: ['IMAGE', 'TEXT'] },
    { id: 'WHATSAPP', name: 'WhatsApp', icon: 'MessageCircle', color: '#25D366', maxCaption: 65536, supports: ['IMAGE', 'TEXT'] },
    { id: 'LINKEDIN', name: 'LinkedIn', icon: 'Linkedin', color: '#0A66C2', maxCaption: 3000, supports: ['IMAGE', 'TEXT'] },
    { id: 'YOUTUBE', name: 'YouTube Shorts', icon: 'Youtube', color: '#FF0000', maxCaption: 1000, supports: ['VIDEO'] },
    { id: 'TELEGRAM', name: 'Telegram', icon: 'Send', color: '#0088CC', maxCaption: 4096, supports: ['IMAGE', 'VIDEO', 'TEXT'] },
    { id: 'PINTEREST', name: 'Pinterest', icon: 'Image', color: '#E60023', maxCaption: 500, supports: ['IMAGE'] },
    { id: 'THREADS', name: 'Threads', icon: 'AtSign', color: '#000000', maxCaption: 500, supports: ['IMAGE', 'TEXT'] },
  ])
}
