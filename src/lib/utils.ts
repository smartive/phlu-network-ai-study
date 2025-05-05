import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum AppStep {
  ONBOARDING = '1-onboarding',
  QUESTIONNAIRE_1 = '2-questionnaire',
  EXPLANATION = '3-explanation',
  NETWORK_MAP = '4-network-map',
  INTERVIEW = '5-interview',
  QUESTIONNAIRE_2 = '6-questionnaire',
  THANK_YOU = '7-thank-you',
}
