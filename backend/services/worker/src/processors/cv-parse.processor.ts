import { Prisma } from '@prisma/client';
import {
  buildCvSearchText,
  evaluateCvWithAi,
  extractCvWithAi,
  extractText,
  isCvAiConfigured,
  parseCandidateTemplateCv,
  parseGenericCvWithAlgorithm,
} from '@wr/ai';
import { AuditAction, AuditEntityType, CvParseJobPayload } from '@wr/contracts';
import { AuditLogService, prisma } from '@wr/database';
import { logger } from '../logger';

const auditLog = new AuditLogService(prisma);
const INTERRUPTED_PROCESSING_ERROR =
  'CV processing was interrupted before completion. Please upload or replace the CV to retry.';

export async function failStaleCvProcessingJobs(staleAfterMs = 5 * 60 * 1000): Promise<number> {
  const result = await prisma.candidateCV.updateMany({
    where: {
      processingStatus: 'PROCESSING',
      parsedAt: null,
      updatedAt: { lt: new Date(Date.now() - staleAfterMs) },
    },
    data: {
      processingStatus: 'FAILED',
      processingError: INTERRUPTED_PROCESSING_ERROR,
    },
  });

  return result.count;
}

export async function processCvParseJob(
  payload: CvParseJobPayload,
): Promise<{ cvDocumentId: string; rawText: string } | null> {
  const { cvDocumentId, filePath } = payload;
  const cvRecord = await prisma.candidateCV.findUnique({
    where: { id: cvDocumentId },
    include: { candidate: true },
  });

  if (!cvRecord) throw new Error(`CandidateCV with id ${cvDocumentId} not found`);

  if (cvRecord.processingStatus === 'COMPLETED' && cvRecord.parsedAt) {
    logger.log(`[Idempotency] CandidateCV ${cvDocumentId} has already been parsed. Skipping job.`);
    const resume = (cvRecord.structuredData as any)?.resume;
    return cvRecord.rawText
      ? { cvDocumentId, rawText: buildCvSearchText(cvRecord.rawText, resume) }
      : null;
  }

  await prisma.candidateCV.update({
    where: { id: cvDocumentId },
    data: { processingStatus: 'PROCESSING', processingError: null },
  });

  await auditLog
    .log({
      entityType: AuditEntityType.CV,
      entityId: cvDocumentId,
      action: AuditAction.CV_PARSE_STARTED,
      toStatus: 'PARSING',
      performedById: 'SYSTEM',
    })
    .catch((err) => logger.error('Failed to write audit log for CV_PARSE_STARTED:', err));

  try {
    const ext = filePath.split('.').pop()?.toUpperCase();
    const fileType =
      ext === 'DOCX' || cvRecord.fileType === 'DOCX'
        ? 'DOCX'
        : ext === 'DOC' || cvRecord.fileType === 'DOC'
          ? 'DOC'
          : 'PDF';

    const aiConfigured = isCvAiConfigured();
    let localText = cvRecord.rawText.trim();
    if (!localText) {
      try {
        localText = (await extractText(filePath, fileType)).trim();
      } catch (localError) {
        if (!aiConfigured) throw localError;
        logger.warn(
          `Local CV extraction failed for ${cvDocumentId}; continuing with vision OCR: ${
            localError instanceof Error ? localError.message : String(localError)
          }`,
        );
      }
    }

    const hasReliableLocalText = localText.replace(/\s/g, '').length >= 200;
    let extraction = null;
    let templateMatched = false;

    // 1. Check if the CV matches the official RMS candidate template
    if (localText && payload.parserPreference !== 'GEMINI_API') {
      try {
        const templateResult = await parseCandidateTemplateCv({ fileType, rawText: localText });
        if (templateResult.matched) {
          extraction = templateResult.extraction;
          templateMatched = true;
          logger.log(
            `CV ${cvDocumentId} matched RMS official template. Parsed algorithmically with 0 AI token cost.`,
          );
        }
      } catch (parserError) {
        logger.warn(
          `Official template parser failed for ${cvDocumentId}: ${
            parserError instanceof Error ? parserError.message : String(parserError)
          }`,
        );
      }
    }

    // 2. If not official template and AI is configured, use Gemini AI for accurate extraction
    if (!extraction && aiConfigured) {
      try {
        extraction = await extractCvWithAi({
          fileName: cvRecord.fileName,
          fileType,
          fileUrl: filePath,
          rawText: localText,
        });
        logger.log(`CV ${cvDocumentId} accurately extracted using Gemini AI.`);
      } catch (aiError) {
        logger.warn(
          `Gemini AI extraction failed for ${cvDocumentId}; attempting heuristic fallback: ${
            aiError instanceof Error ? aiError.message : String(aiError)
          }`,
        );
      }
    }

    // 3. Fallback to generic heuristic parser if AI extraction was unavailable or failed
    if (!extraction && localText) {
      try {
        const genericResult = parseGenericCvWithAlgorithm({
          rawText: localText,
          fileName: cvRecord.fileName,
        });
        if (genericResult.matched) {
          extraction = genericResult.extraction;
          logger.log(`CV ${cvDocumentId} parsed via generic heuristic rules.`);
        }
      } catch (parserError) {
        logger.warn(
          `Generic heuristic parser failed for ${cvDocumentId}: ${
            parserError instanceof Error ? parserError.message : String(parserError)
          }`,
        );
      }
    }

    const hasUsableModelText = localText.trim().length > 0;
    if (!extraction && !hasUsableModelText && !hasReliableLocalText) {
      throw new Error(
        'No readable text was found. Configure GEMINI_API_KEY or GEMINI_API_KEYS to OCR scanned or image-based CV files.',
      );
    }

    const aiText = extraction?.documentText.trim() ?? '';
    const rawText = aiText.length >= localText.length ? aiText : localText;
    const method = extraction?.method ?? 'LOCAL_TEXT';
    const extractedAt = new Date();
    const cvStructuredData = extraction
      ? ({
          resume: extraction.resume,
          confidence: extraction.confidence,
          warnings: extraction.warnings,
          method,
          model: extraction.model ?? null,
          templateMatched,
          parserPreference: payload.parserPreference ?? 'AUTO',
        } as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    const existingProfileData =
      cvRecord.candidate.structuredData && typeof cvRecord.candidate.structuredData === 'object'
        ? (cvRecord.candidate.structuredData as Record<string, unknown>)
        : {};
    const nextProfileData = extraction
      ? ({
          ...existingProfileData,
          resume: extraction.resume,
          skills: extraction.resume.skills?.technical ?? [],
          currentRole: extraction.resume.currentRole ?? existingProfileData.currentRole,
          yearsOfExperience:
            extraction.resume.yearsOfExperience ?? existingProfileData.yearsOfExperience,
          experience: extraction.resume.workExperience ?? [],
          education: extraction.resume.education ?? [],
          cvExtraction: {
            cvDocumentId,
            confidence: extraction.confidence,
            warnings: extraction.warnings,
            method,
            model: extraction.model ?? null,
            extractedAt: extractedAt.toISOString(),
          },
        } as Prisma.InputJsonValue)
      : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.candidateCV.update({
        where: { id: cvDocumentId },
        data: {
          rawText,
          parsedAt: extractedAt,
          processingStatus: 'COMPLETED',
          processingMethod: method,
          processingError: null,
          structuredData: cvStructuredData,
          extractedAt: extraction ? extractedAt : null,
        },
      });
      if (nextProfileData) {
        await tx.candidateProfile.update({
          where: { id: cvRecord.candidateId },
          data: {
            structuredData: nextProfileData,
            ...(extraction?.resume.summary && !cvRecord.candidate.summary
              ? { summary: extraction.resume.summary }
              : {}),
            ...(extraction?.resume.personalInfo?.phoneNumber && !cvRecord.candidate.phone
              ? { phone: extraction.resume.personalInfo.phoneNumber }
              : {}),
          },
        });
      }
    });

    await auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_PARSE_COMPLETED,
        fromStatus: 'PARSING',
        toStatus: 'PARSED',
        performedById: 'SYSTEM',
        metadata: {
          method,
          model: extraction?.model ?? null,
          confidence: extraction?.confidence ?? null,
        },
      })
      .catch((err) => logger.error('Failed to write audit log for CV_PARSE_COMPLETED:', err));

    logger.log(`CV ${cvDocumentId} parsed and stored (type=${fileType}, method=${method})`);

    // Automatic AI evaluation callback for candidate's active applications
    try {
      const applications = await prisma.application.findMany({
        where: { candidateId: cvRecord.candidateId },
        include: {
          request: {
            include: { department: true },
          },
        },
      });

      for (const app of applications) {
        if (app.request) {
          const evalResult = await evaluateCvWithAi({
            cvText: rawText,
            resume: extraction?.resume,
            jobTitle: app.request.position,
            jobDescription: app.request.jobDescription,
            skillRequirements: app.request.skillRequirements as any,
            departmentName: app.request.department?.name,
            urgency: app.request.urgency,
          });

          const currentCv = await prisma.candidateCV.findUnique({
            where: { id: cvDocumentId },
            select: { structuredData: true, screeningStatus: true },
          });

          const nextData = {
            ...((currentCv?.structuredData as Record<string, any>) || {}),
            evaluation: {
              ...evalResult,
              requestId: app.requestId,
              jobTitle: app.request.position,
            },
          };

          const newScreeningStatus =
            evalResult.recommendation === 'SHORTLISTED'
              ? 'SHORTLISTED'
              : evalResult.recommendation === 'REJECTED'
                ? 'REJECTED'
                : currentCv?.screeningStatus || 'PENDING';

          await prisma.candidateCV.update({
            where: { id: cvDocumentId },
            data: {
              structuredData: nextData as Prisma.InputJsonValue,
              screeningStatus: newScreeningStatus,
            },
          });

          if (evalResult.recommendation === 'SHORTLISTED') {
            await prisma.application.update({
              where: { id: app.id },
              data: { status: 'SCREENING' },
            });
          } else if (evalResult.recommendation === 'REJECTED') {
            await prisma.application.update({
              where: { id: app.id },
              data: { status: 'REJECTED' },
            });
          }

          logger.log(
            `Automated AI evaluation for candidate ${cvRecord.candidateId} on request ${app.requestId}: score=${evalResult.overallScore}, recommendation=${evalResult.recommendation}`,
          );
        }
      }
    } catch (evalErr) {
      logger.warn(
        `Post-parse AI evaluation skipped or failed: ${
          evalErr instanceof Error ? evalErr.message : String(evalErr)
        }`,
      );
    }

    return { cvDocumentId, rawText: buildCvSearchText(rawText, extraction?.resume) };
  } catch (err) {
    await prisma.candidateCV
      .update({
        where: { id: cvDocumentId },
        data: {
          processingStatus: 'FAILED',
          processingError: err instanceof Error ? err.message : String(err),
        },
      })
      .catch((updateErr) => logger.error('Failed to persist CV processing failure:', updateErr));

    await auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_PARSE_FAILED,
        fromStatus: 'PARSING',
        toStatus: 'FAILED',
        performedById: 'SYSTEM',
        reason: err instanceof Error ? err.message : String(err),
      })
      .catch((logErr) => logger.error('Failed to write audit log for CV_PARSE_FAILED:', logErr));

    throw err;
  }
}
