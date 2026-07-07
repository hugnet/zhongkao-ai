export interface Agent {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  skills: Skill[];
  color: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  subject: string;
  steps: string[];
  triggers: string[];
  boundaries: string[];
  examples: string[];
  tags: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  subscription?: 'free' | 'monthly' | 'yearly';
  createdAt: string;
}
