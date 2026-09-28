/**
 * Moderation Service Abstraction Layer
 * Inspects chat messages and collaboration notes to detect off-platform circumvention:
 * - Phone numbers (Indian 10-digit mobile patterns, +91, spaced numbers)
 * - Email addresses
 * - Instagram handles / @mentions
 * - External URLs / links
 * Provides balanced detection that flags or warns without breaking natural conversation.
 */

export interface ModerationResult {
  isClean: boolean;
  status: 'clean' | 'flagged' | 'blocked';
  flags: {
    hasPhoneNumber: boolean;
    hasEmail: boolean;
    hasHandle: boolean;
    hasUrl: boolean;
  };
  warningMessage?: string;
  sanitizedBody?: string;
}

export interface IModerationService {
  inspectMessage(content: string): ModerationResult;
}

class ModerationService implements IModerationService {
  // Regex patterns tailored to detect off-platform solicitation
  private phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{2,4}[\-\s]?\d{4,6}\b|(?:\b\d{10}\b)/g;
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private handleRegex = /(?:^|\s)@([a-zA-Z0-9._]{3,30})\b/g;
  private urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;

  inspectMessage(content: string): ModerationResult {
    const hasPhone = this.phoneRegex.test(content);
    // Reset lastIndex for stateful regexes
    this.phoneRegex.lastIndex = 0;

    const hasEmail = this.emailRegex.test(content);
    this.emailRegex.lastIndex = 0;

    const hasHandle = this.handleRegex.test(content);
    this.handleRegex.lastIndex = 0;

    const hasUrl = this.urlRegex.test(content);
    this.urlRegex.lastIndex = 0;

    const isFlagged = hasPhone || hasEmail || hasHandle || hasUrl;

    if (!isFlagged) {
      return {
        isClean: true,
        status: 'clean',
        flags: {
          hasPhoneNumber: false,
          hasEmail: false,
          hasHandle: false,
          hasUrl: false,
        },
      };
    }

    const detectedTypes: string[] = [];
    if (hasPhone) detectedTypes.push('phone numbers');
    if (hasEmail) detectedTypes.push('email addresses');
    if (hasHandle) detectedTypes.push('social handles (@)');
    if (hasUrl) detectedTypes.push('external links');

    const warningMessage = `Notice: To protect escrow payments and dispute guarantees, sharing ${detectedTypes.join(
      ', '
    )} directly is discouraged. All collaboration and approvals must remain inside this workspace.`;

    return {
      isClean: false,
      status: 'flagged',
      flags: {
        hasPhoneNumber: hasPhone,
        hasEmail: hasEmail,
        hasHandle: hasHandle,
        hasUrl: hasUrl,
      },
      warningMessage,
      sanitizedBody: content,
    };
  }
}

export const moderationService: IModerationService = new ModerationService();
