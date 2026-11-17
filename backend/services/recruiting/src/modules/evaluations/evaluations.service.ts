import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { evaluateCvWithAi } from '@wr/ai';
import { AuditLogService } from '@wr/database';
import {
  AuditAction,
  AuditEntityType,
  type CvEvaluationData,
  type EvaluateCvRequest,
} from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async evaluateCandidateCv(payload: EvaluateCvRequest & { actorRole?: string }): Promise<{
    cvDocumentId: string;
    requestId: string;
    evaluation: CvEvaluationData;
    screeningStatus: string;
    applicationStatus?: string;
  }> {
    const { cvDocumentId, requestId, autoUpdateStatus = true, actorUserId = 'SYSTEM' } = payload;

    const cv = await this.prisma.candidateCV.findUnique({
      where: { id: cvDocumentId },
      include: { candidate: true },
    });

    if (!cv) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CandidateCV with ID ${cvDocumentId} not found`,
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
      include: { department: true, jobPosting: true },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `RecruitmentRequest with ID ${requestId} not found`,
      });
    }

    const structuredData = (cv.structuredData as Record<string, any>) || {};
    const resume = structuredData.resume;

    // Call AI Evaluation via Gemini API (with heuristic fallback)
    const evaluation = await evaluateCvWithAi({
      cvText: cv.rawText,
      resume,
      jobTitle: request.position,
      jobDescription: request.jobDescription,
      skillRequirements: request.skillRequirements as any,
      departmentName: request.department?.name,
      urgency: request.urgency,
    });

    // Merge evaluation into candidateCV structuredData
    const updatedStructuredData: Prisma.InputJsonValue = {
      ...structuredData,
      evaluation: {
        ...evaluation,
        requestId,
        jobTitle: request.position,
      },
    };

    let nextScreeningStatus = cv.screeningStatus;
    let nextApplicationStatus: string | undefined;

    if (autoUpdateStatus) {
      if (evaluation.recommendation === 'SHORTLISTED') {
        nextScreeningStatus = 'SHORTLISTED';
        nextApplicationStatus = 'SCREENING';
      } else if (evaluation.recommendation === 'REJECTED') {
        nextScreeningStatus = 'REJECTED';
        nextApplicationStatus = 'REJECTED';
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.candidateCV.update({
        where: { id: cvDocumentId },
        data: {
          structuredData: updatedStructuredData,
          screeningStatus: nextScreeningStatus,
        },
      });

      if (nextApplicationStatus) {
        await tx.application.updateMany({
          where: {
            requestId,
            candidateId: cv.candidateId,
          },
          data: {
            status: nextApplicationStatus,
          },
        });
      }
    });

    await this.auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_EVALUATED,
        fromStatus: cv.screeningStatus,
        toStatus: nextScreeningStatus,
        performedById: actorUserId,
        metadata: {
          requestId,
          overallScore: evaluation.overallScore,
          skillsScore: evaluation.skillsScore,
          experienceScore: evaluation.experienceScore,
          recommendation: evaluation.recommendation,
          model: evaluation.model,
        },
      })
      .catch((err) => console.error('Failed to write audit log for CV_EVALUATED:', err));

    return {
      cvDocumentId,
      requestId,
      evaluation,
      screeningStatus: nextScreeningStatus,
      applicationStatus: nextApplicationStatus,
    };
  }

  async getCvEvaluation(cvDocumentId: string, _requestId?: string) {
    const cv = await this.prisma.candidateCV.findUnique({
      where: { id: cvDocumentId },
      select: {
        id: true,
        candidateId: true,
        fileName: true,
        screeningStatus: true,
        structuredData: true,
        updatedAt: true,
      },
    });

    if (!cv) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CandidateCV with ID ${cvDocumentId} not found`,
      });
    }

    const structured = (cv.structuredData as Record<string, any>) || {};
    return {
      cvDocumentId: cv.id,
      candidateId: cv.candidateId,
      fileName: cv.fileName,
      screeningStatus: cv.screeningStatus,
      evaluation: structured.evaluation || null,
      updatedAt: cv.updatedAt,
    };
  }

  findAll() {
    return { message: 'Evaluations module active' };
  }
}
