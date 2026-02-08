/**
 * Message type definitions for agent playground chat
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensIn?: number;
  tokensOut?: number;
  costCents?: number;
}
