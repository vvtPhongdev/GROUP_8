import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EvaluationsService } from './evaluations.service';
import type { EvaluateCvRequest } from '@wr/contracts';

@Controller()
export class EvaluationsController {
  constructor(private readonly service: EvaluationsService) {}

  @MessagePattern('evaluations.evaluate_cv')
  async evaluateCv(@Payload() payload: EvaluateCvRequest & { actorRole?: string }) {
    return this.service.evaluateCandidateCv(payload);
  }

  @MessagePattern('evaluations.create')
  async createEvaluation(@Payload() payload: EvaluateCvRequest & { actorRole?: string }) {
    return this.service.evaluateCandidateCv(payload);
  }

  @MessagePattern('evaluations.get_cv_evaluation')
  async getCvEvaluation(@Payload() payload: { cvDocumentId: string; requestId?: string }) {
    return this.service.getCvEvaluation(payload.cvDocumentId, payload.requestId);
  }

  @MessagePattern('evaluations.get')
  async getEvaluation(@Payload() payload: { id: string }) {
    return this.service.getCvEvaluation(payload.id);
  }

  @MessagePattern('evaluations.findAll')
  findAll() {
    return this.service.findAll();
  }
}
