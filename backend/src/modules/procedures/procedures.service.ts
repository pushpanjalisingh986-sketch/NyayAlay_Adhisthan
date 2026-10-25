import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PROCEDURES } from './procedure.catalog';
import { ProcedureId } from './procedure.types';

@Injectable()
export class ProceduresService {
  list() {
    return Object.values(PROCEDURES).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
    }));
  }

  getStart(procedureId: string) {
    const procedure = PROCEDURES[procedureId];
    if (!procedure) {
      throw new NotFoundException('Procedure not found');
    }

    const step = procedure.steps[procedure.startStepId];
    return {
      procedureId: procedure.id,
      procedureTitle: procedure.title,
      step,
      disclaimer:
        'This is general legal information only and does not constitute legal advice.',
    };
  }

  getStep(procedureId: string, stepId: string) {
    const procedure = PROCEDURES[procedureId];
    if (!procedure) {
      throw new NotFoundException('Procedure not found');
    }

    const step = procedure.steps[stepId];
    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return {
      procedureId: procedure.id,
      procedureTitle: procedure.title,
      step,
      disclaimer:
        'This is general legal information only and does not constitute legal advice.',
    };
  }

  chooseOption(procedureId: string, stepId: string, optionId: string) {
    const procedure = PROCEDURES[procedureId as ProcedureId];
    if (!procedure) {
      throw new NotFoundException('Procedure not found');
    }

    const step = procedure.steps[stepId];
    if (!step) {
      throw new NotFoundException('Step not found');
    }

    const option = (step.options || []).find((o) => o.id === optionId);
    if (!option) {
      throw new BadRequestException('Invalid option');
    }

    const next = procedure.steps[option.nextStepId];
    if (!next) {
      throw new NotFoundException('Next step not found');
    }

    return {
      procedureId: procedure.id,
      procedureTitle: procedure.title,
      fromStepId: stepId,
      chosenOptionId: optionId,
      step: next,
      disclaimer:
        'This is general legal information only and does not constitute legal advice.',
    };
  }
}