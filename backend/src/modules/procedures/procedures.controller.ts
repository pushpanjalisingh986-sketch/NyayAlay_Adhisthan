import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProceduresService } from './procedures.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Public()
  @Get()
  list() {
    return this.proceduresService.list();
  }

  @Public()
  @Get(':id/start')
  start(@Param('id') id: string) {
    return this.proceduresService.getStart(id);
  }

  @Public()
  @Get(':id/steps/:stepId')
  getStep(@Param('id') id: string, @Param('stepId') stepId: string) {
    return this.proceduresService.getStep(id, stepId);
  }

  @Public()
  @Post(':id/steps/:stepId/choose')
  choose(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() body: { optionId: string },
  ) {
    return this.proceduresService.chooseOption(id, stepId, body.optionId);
  }
}