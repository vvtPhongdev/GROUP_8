import {
  CvEvaluationSchema,
  type CvEvaluationData,
  type ResumeDraftData,
} from '@wr/contracts';

export type { CvEvaluationData };

const DEFAULT_GEMINI_EVAL_MODEL = 'gemini-3.5-flash';
const DEFAULT_GEMINI_EVAL_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const splitCsv = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

function normalizeGeminiModel(value: string): string {
  const model = value.trim();
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(model) || /^(?:AIza|AQ\.)/i.test(model)) {
    return DEFAULT_GEMINI_EVAL_MODEL;
  }
  return model;
}

function getGeminiEvalConfig() {
  const numberedApiKeys = Array.from({ length: 6 }, (_, index) =>
    process.env[`GEMINI_API_KEY_${index + 1}`]?.trim(),
  ).filter((key): key is string => Boolean(key));
  const apiKeys = [
    ...numberedApiKeys,
    ...splitCsv(process.env.GEMINI_API_KEYS),
    ...splitCsv(process.env.GEMINI_API_KEY),
  ].filter(
    (key, index, keys) =>
      !/^https?:\/\//i.test(key) && keys.indexOf(key) === index,
  );

  const primaryModel = normalizeGeminiModel(
    process.env.GEMINI_MODEL?.trim() ||
      process.env.GEMINI_CV_MODEL?.trim() ||
      DEFAULT_GEMINI_EVAL_MODEL,
  );
  const models = [
    primaryModel,
    DEFAULT_GEMINI_EVAL_MODEL,
    DEFAULT_GEMINI_EVAL_FALLBACK_MODEL,
    ...splitCsv(process.env.GEMINI_CV_MODELS).map(normalizeGeminiModel),
  ].filter((model, index, configuredModels) => configuredModels.indexOf(model) === index);

  return {
    apiKeys,
    baseUrl: (
      process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
    ).replace(/\/+$/, ''),
    models,
    retryAttempts: 2,
    retryBaseDelayMs: 1000,
  };
}

export interface CvEvaluationInput {
  cvText?: string;
  resume?: ResumeDraftData;
  jobTitle: string;
  jobDescription?: string;
  skillRequirements?: Record<string, unknown> | string[] | string;
  departmentName?: string;
  urgency?: string;
}

const evaluationJsonSchema = {
  type: 'object',
  required: [
    'overallScore',
    'skillsScore',
    'experienceScore',
    'educationScore',
    'matchSummary',
    'matchedSkills',
    'missingSkills',
    'strengths',
    'weaknesses',
    'recommendation',
    'recommendationReason',
  ],
  properties: {
    overallScore: { type: 'number', minimum: 0, maximum: 100 },
    skillsScore: { type: 'number', minimum: 0, maximum: 100 },
    experienceScore: { type: 'number', minimum: 0, maximum: 100 },
    educationScore: { type: 'number', minimum: 0, maximum: 100 },
    matchSummary: { type: 'string' },
    matchedSkills: { type: 'array', items: { type: 'string' } },
    missingSkills: { type: 'array', items: { type: 'string' } },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendation: {
      type: 'string',
      enum: ['SHORTLISTED', 'CONSIDER', 'REJECTED'],
    },
    recommendationReason: { type: 'string' },
  },
};

function normalizeSkillsInput(input?: Record<string, unknown> | string[] | string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return normalizeSkillsInput(parsed);
    } catch {
      return splitCsv(input);
    }
  }
  if (typeof input === 'object') {
    const values: string[] = [];
    for (const key of ['required', 'mandatory', 'technical', 'skills', 'primary', 'optional']) {
      const field = (input as Record<string, unknown>)[key];
      if (Array.isArray(field)) {
        values.push(...field.map(String));
      } else if (typeof field === 'string') {
        values.push(...splitCsv(field));
      }
    }
    if (values.length === 0) {
      Object.values(input).forEach((val) => {
        if (Array.isArray(val)) values.push(...val.map(String));
        else if (typeof val === 'string') values.push(val);
      });
    }
    return values.filter(Boolean);
  }
  return [];
}

function buildEvaluationPrompt(input: CvEvaluationInput): string {
  const reqSkills = normalizeSkillsInput(input.skillRequirements);
  const resume = input.resume;
  const candidateSkills = [
    ...(resume?.skills?.technical ?? []),
    ...(resume?.skills?.softSkills ?? []),
  ];

  return `Bạn là một Chuyên gia Tuyển dụng Cao cấp (Senior Tech Recruiter / HR Director).
Nhiệm vụ của bạn là đánh giá và chấm điểm mức độ phù hợp giữa Hồ sơ ứng viên (CV) và Yêu cầu tuyển dụng của doanh nghiệp.

### THÔNG TIN VỊ TRÍ TUYỂN DỤNG:
- Vị trí: ${input.jobTitle}
- Phòng ban: ${input.departmentName || 'Không xác định'}
- Mức độ ưu tiên: ${input.urgency || 'NORMAL'}
- Mô tả công việc: ${input.jobDescription || 'Xem kỹ năng yêu cầu bên dưới'}
- Kỹ năng yêu cầu: ${reqSkills.length > 0 ? reqSkills.join(', ') : 'Không có danh sách cụ thể, đánh giá theo mô tả công việc'}

### HỒ SƠ ỨNG VIÊN (CV):
- Họ tên: ${resume?.personalInfo?.fullName || 'Ứng viên'}
- Chức danh hiện tại: ${resume?.currentRole || 'Chưa cập nhật'}
- Tổng số năm kinh nghiệm: ${resume?.yearsOfExperience ?? 'Không xác định'}
- Kỹ năng của ứng viên: ${candidateSkills.join(', ') || 'Chưa liệt kê'}
- Tóm tắt bản thân: ${resume?.summary || 'Không có'}
- Kinh nghiệm làm việc:
${(resume?.workExperience ?? [])
  .map(
    (exp) =>
      `  * ${exp.position || 'Vị trí'} tại ${exp.company || 'Công ty'} (${exp.startDate || ''} - ${
        exp.isCurrent ? 'Hiện tại' : exp.endDate || ''
      }): ${(exp.achievements ?? []).join('; ')}`,
  )
  .join('\n') || 'Không có chi tiết'}
- Học vấn:
${(resume?.education ?? [])
  .map((edu) => `  * ${edu.degree || ''} ${edu.major || ''} tại ${edu.school || ''}`)
  .join('\n') || 'Không có chi tiết'}

${input.cvText ? `\n### NỘI DUNG VĂN BẢN ĐẦY ĐỦ CỦA CV:\n${input.cvText.slice(0, 4000)}` : ''}

### NGUYÊN TẮC ĐÁNH GIÁ VÀ CHẤM ĐIỂM:
1. overallScore (0 - 100): Điểm tổng thể phù hợp với vị trí.
   - >= 70: Phù hợp tốt đến xuất sắc -> Khuyến nghị 'SHORTLISTED'.
   - 50 - 69: Phù hợp một phần hoặc có tiềm năng -> Khuyến nghị 'CONSIDER'.
   - < 50: Không đáp ứng yêu cầu cốt lõi -> Khuyến nghị 'REJECTED'.
2. skillsScore (0 - 100): Điểm khớp kỹ năng chuyên môn kỹ thuật.
3. experienceScore (0 - 100): Điểm số năm và độ liên quan của các dự án / kinh nghiệm thực tế.
4. educationScore (0 - 100): Điểm học vấn, chuyên ngành và chứng chỉ.
5. matchedSkills: Danh sách các kỹ năng của ứng viên khớp với yêu cầu tuyển dụng.
6. missingSkills: Danh sách các kỹ năng yêu cầu mà ứng viên còn thiếu hoặc chưa thể hiện rõ trong CV.
7. strengths: 2-4 điểm mạnh nổi bật nhất của ứng viên bằng tiếng Việt.
8. weaknesses: 1-3 điểm còn thiếu, hạn chế hoặc cần kiểm tra kỹ trong phỏng vấn bằng tiếng Việt.
9. matchSummary: Nhận xét tổng quan súc tích, khách quan bằng tiếng Việt (2-4 câu).
10. recommendation: Một trong ba giá trị: 'SHORTLISTED' | 'CONSIDER' | 'REJECTED'.
11. recommendationReason: Lý do ngắn gọn dẫn đến khuyến nghị này bằng tiếng Việt.

Hãy trả về kết quả định dạng JSON chuẩn theo schema được cung cấp.`;
}

function fallbackEvaluation(input: CvEvaluationInput): CvEvaluationData {
  const reqSkills = normalizeSkillsInput(input.skillRequirements);
  const resume = input.resume;
  const candidateSkills = (resume?.skills?.technical ?? []).map((s) => s.toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of reqSkills) {
    const clean = req.trim().toLowerCase();
    if (candidateSkills.some((s) => s.includes(clean) || clean.includes(s))) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const skillCoverage =
    reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 75;
  const expYears = resume?.yearsOfExperience ?? 1;
  const expScore = Math.min(100, Math.round(Math.max(40, expYears * 20)));
  const eduScore = (resume?.education?.length ?? 0) > 0 ? 80 : 60;
  const overallScore = Math.round(skillCoverage * 0.5 + expScore * 0.35 + eduScore * 0.15);

  const recommendation =
    overallScore >= 70 ? 'SHORTLISTED' : overallScore >= 50 ? 'CONSIDER' : 'REJECTED';

  return {
    overallScore,
    skillsScore: skillCoverage,
    experienceScore: expScore,
    educationScore: eduScore,
    matchSummary: `Ứng viên đáp ứng ${matched.length}/${reqSkills.length || 1} kỹ năng cốt lõi cho vị trí ${input.jobTitle}.`,
    matchedSkills: matched,
    missingSkills: missing,
    strengths: [
      `Có kỹ năng kỹ thuật phù hợp: ${matched.slice(0, 3).join(', ') || 'Nền tảng tốt'}`,
      `Kinh nghiệm làm việc: ${expYears} năm`,
    ],
    weaknesses: missing.length > 0 ? [`Chưa thể hiện kinh nghiệm với: ${missing.slice(0, 3).join(', ')}`] : [],
    recommendation,
    recommendationReason: `Điểm tổng hợp đạt ${overallScore}/100 dựa trên độ khớp kỹ năng và kinh nghiệm.`,
    evaluatedAt: new Date().toISOString(),
    model: 'fallback-heuristic',
  };
}

export async function evaluateCvWithAi(input: CvEvaluationInput): Promise<CvEvaluationData> {
  const config = getGeminiEvalConfig();

  if (config.apiKeys.length === 0) {
    return fallbackEvaluation(input);
  }

  const prompt = buildEvaluationPrompt(input);
  const parts = [{ text: prompt }];

  for (const model of config.models) {
    for (const apiKey of config.apiKeys) {
      for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
        try {
          const response = await fetch(
            `${config.baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                  responseFormat: {
                    text: {
                      mimeType: 'APPLICATION_JSON',
                      schema: evaluationJsonSchema,
                    },
                  },
                },
              }),
            },
          );

          if (!response.ok) {
            if (response.status >= 500 && attempt < config.retryAttempts) {
              await new Promise((resolve) =>
                setTimeout(resolve, config.retryBaseDelayMs * 2 ** (attempt - 1)),
              );
              continue;
            }
            continue;
          }

          const payload = (await response.json().catch(() => ({}))) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          const parsedJson = JSON.parse(rawText);
          const validated = CvEvaluationSchema.parse({
            ...parsedJson,
            evaluatedAt: new Date().toISOString(),
            model,
          });

          return validated;
        } catch {
          // If JSON parse or validation fails on this attempt, continue to next try/key
          continue;
        }
      }
    }
  }

  // All Gemini attempts failed, return robust heuristic evaluation
  return fallbackEvaluation(input);
}
