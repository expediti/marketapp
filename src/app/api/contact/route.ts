import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const { name, email, subject, message, category } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Please enter a subject (at least 3 characters).' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide message details (at least 10 characters).' },
        { status: 400 }
      );
    }

    // Generate unique tracking ticket ID
    const ticketId = `MMI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Server-side audit log without exposing sensitive credential data
    console.info(`[Contact Form Inquiry] Ticket: ${ticketId} | Category: ${category || 'general'} | Subject: ${subject.trim().slice(0, 50)} | From: ${email.trim()}`);

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Thank you for contacting MarketMyIdea. Your inquiry has been received. Our support team will get back to you within 24–48 business hours.',
    });
  } catch (error: any) {
    console.error('[Contact Form API Error]', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to process inquiry. Please try again or email us directly at contact@marketmyidea.online' },
      { status: 500 }
    );
  }
}
