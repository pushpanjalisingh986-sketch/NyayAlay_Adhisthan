export type ProcedureId = 'fir' | 'theft' | 'domestic_violence';

export interface ProcedureOption {
  id: string;
  label: string;
  nextStepId: string;
}

export interface ProcedureStep {
  id: string;
  title: string;
  body: string;
  options?: ProcedureOption[];
  isTerminal?: boolean;
  helpline?: string;
}

export interface ProcedureDefinition {
  id: ProcedureId;
  title: string;
  description: string;
  startStepId: string;
  steps: Record<string, ProcedureStep>;
}