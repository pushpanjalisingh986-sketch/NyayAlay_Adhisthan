import { ProcedureDefinition } from './procedure.types';

export const PROCEDURES: Record<string, ProcedureDefinition> = {
  fir: {
    id: 'fir',
    title: 'Filing an FIR',
    description:
      'General information steps about filing a First Information Report under BNSS.',
    startStepId: 'start',
    steps: {
      start: {
        id: 'start',
        title: 'What is an FIR?',
        body: 'An FIR (First Information Report) is a written record of information about a cognizable offence. This is general legal information only and not legal advice.',
        options: [
          { id: 'where', label: 'Where should I go?', nextStepId: 'where' },
          { id: 'refuse', label: 'What if police refuse?', nextStepId: 'refuse' },
        ],
      },
      where: {
        id: 'where',
        title: 'Jurisdiction',
        body: 'Generally, approach the police station that has jurisdiction over the place where the incident occurred. Provide a clear account of facts. Request a copy of the FIR after registration.',
        options: [
          { id: 'next', label: 'What details to carry?', nextStepId: 'details' },
          { id: 'back', label: 'Back', nextStepId: 'start' },
        ],
      },
      details: {
        id: 'details',
        title: 'Useful details',
        body: 'Where possible, preserve evidence: time/place, description of incident, documents, photos, IMEI/bills if relevant, and witness information. This is general information only.',
        options: [
          { id: 'done', label: 'Finish', nextStepId: 'end' },
          { id: 'refuse', label: 'What if police refuse?', nextStepId: 'refuse' },
        ],
      },
      refuse: {
        id: 'refuse',
        title: 'If registration is refused',
        body: 'If police refuse to register an FIR in a cognizable offence, the law provides remedies. Exact options depend on facts. Consider consulting a verified lawyer for case-specific guidance.',
        options: [{ id: 'done', label: 'Finish', nextStepId: 'end' }],
      },
      end: {
        id: 'end',
        title: 'End of guide',
        body: 'This procedure guide provides general information only and does not constitute legal advice. For advice specific to your situation, please consult a verified lawyer.',
        isTerminal: true,
      },
    },
  },

  theft: {
    id: 'theft',
    title: 'Theft – general next steps',
    description: 'General information after theft of movable property (e.g. phone).',
    startStepId: 'start',
    steps: {
      start: {
        id: 'start',
        title: 'Immediate practical steps',
        body: 'Under general criminal law information (BNS context), consider preserving evidence (bills, IMEI, messages, CCTV) and reporting at the relevant police station. This is not legal advice.',
        options: [
          { id: 'evidence', label: 'What evidence helps?', nextStepId: 'evidence' },
          { id: 'fir', label: 'How does FIR fit in?', nextStepId: 'fir_link' },
        ],
      },
      evidence: {
        id: 'evidence',
        title: 'Evidence checklist',
        body: 'Useful items may include purchase proof, IMEI number, photos, location/time details, and any messages or CCTV references. Keep copies if possible.',
        options: [
          { id: 'fir', label: 'Reporting / FIR', nextStepId: 'fir_link' },
          { id: 'done', label: 'Finish', nextStepId: 'end' },
        ],
      },
      fir_link: {
        id: 'fir_link',
        title: 'Reporting the incident',
        body: 'Reporting at the police station with jurisdiction and requesting FIR registration is a common next step for cognizable offences. See the FIR procedure guide for general process information.',
        options: [{ id: 'done', label: 'Finish', nextStepId: 'end' }],
      },
      end: {
        id: 'end',
        title: 'End of guide',
        body: 'General information only. Consult a verified lawyer for advice specific to your facts.',
        isTerminal: true,
      },
    },
  },

  domestic_violence: {
    id: 'domestic_violence',
    title: 'Domestic violence – safety first',
    description: 'General information and safety-oriented guidance. Not legal advice.',
    startStepId: 'start',
    steps: {
      start: {
        id: 'start',
        title: 'Safety and support',
        body: 'If you are in danger, prioritize safety. You may contact emergency services or women’s helpline 181. This is general information only.',
        helpline: '181',
        options: [
          { id: 'options', label: 'What options exist generally?', nextStepId: 'options' },
          { id: 'urgent', label: 'I need urgent help', nextStepId: 'urgent' },
        ],
      },
      urgent: {
        id: 'urgent',
        title: 'Urgent support',
        body: 'Consider contacting police emergency services and/or women’s helpline 181. A Protection Officer or verified lawyer can also be approached for appropriate remedies under applicable law.',
        helpline: '181',
        options: [{ id: 'done', label: 'Finish', nextStepId: 'end' }],
      },
      options: {
        id: 'options',
        title: 'General pathways',
        body: 'Depending on facts, pathways may involve police, Protection Officer mechanisms under the Protection of Women from Domestic Violence Act, 2005, and relevant BNS provisions. Exact remedies depend on circumstances.',
        options: [
          { id: 'urgent', label: 'Urgent help', nextStepId: 'urgent' },
          { id: 'done', label: 'Finish', nextStepId: 'end' },
        ],
      },
      end: {
        id: 'end',
        title: 'End of guide',
        body: 'This is general legal information only and does not constitute legal advice. For advice specific to your situation, please consult a verified lawyer or contact helpline 181.',
        helpline: '181',
        isTerminal: true,
      },
    },
  },
};