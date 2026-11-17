import { CvExtractionSchema, type CvExtractionData, type ResumeDraftData } from '@wr/contracts';

const TEMPLATE_MARKER = 'RMS-CV-TEMPLATE: V1';
const TEMPLATE_MODEL = 'rms-template-parser-v1';
const REQUIRED_HEADINGS = [
  'Professional Summary',
  'Technical Skills',
  'Soft Skills',
  'Languages',
  'Work Experience',
  'Education',
] as const;

type EmbedText = (text: string) => Promise<Float32Array>;

export type CandidateTemplateParseResult =
  | { matched: true; extraction: CvExtractionData; similarity: number }
  | { matched: false; reason: string; similarity?: number };

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized || /^\[[^\]]+\]$/.test(normalized) || /^(?:n\/a|none)$/i.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function section(text: string, heading: string, nextHeadings: readonly string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextHeadings.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(
    new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n\\s*(?:${next})\\b|$)`, 'i'),
  );
  return match?.[1]?.trim() ?? '';
}

function extractLabeledValue(text: string, label: string, labels: string[]) {
  const allLabels = labels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\s+(?:${allLabels}):|\\n|$)`, 'i'));
  return clean(match?.[1]);
}

function splitItems(value: string) {
  return value
    .split(/[,;|•\n]/)
    .map(clean)
    .filter((item): item is string => Boolean(item))
    .map((item) => item.slice(0, 100).trim())
    .filter((item) => item.length > 0);
}

function parseTemplateExperience(text: string): { experience: any[]; yearsOfExperience: number } {
  const expSection = section(text, 'Work Experience', ['Education', 'Certifications', 'Projects']);
  if (!expSection) return { experience: [], yearsOfExperience: 0 };

  const blocks = expSection
    .split(/(?:Company:|\n(?=[A-Z][a-zA-Z0-9\s]+(?:Company|Corp|JSC|Ltd|TNHH|Inc|Group|Software)))/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const experience: any[] = [];
  let totalMonths = 0;
  const currentYear = new Date().getFullYear();

  for (const block of blocks) {
    const lines = block.split('\n').map(clean).filter(Boolean);
    if (lines.length === 0) continue;

    const company =
      extractLabeledValue(block, 'Company', ['Position', 'Duration', 'Dates', 'Achievements']) ||
      lines[0];
    const position =
      extractLabeledValue(block, 'Position', ['Company', 'Duration', 'Dates', 'Achievements']) ||
      lines[1];
    const duration =
      extractLabeledValue(block, 'Duration', ['Company', 'Position', 'Achievements']) ||
      extractLabeledValue(block, 'Dates', ['Company', 'Position', 'Achievements']);

    const achievements: string[] = [];
    const achLines = block.split('\n').filter((l) => /^\s*[-*•]\s*/.test(l));
    for (const ach of achLines) {
      const cleaned = clean(ach.replace(/^\s*[-*•]\s*/, ''));
      if (cleaned) achievements.push(cleaned);
    }

    let startDate: string | undefined;
    let endDate: string | undefined = undefined;
    let isCurrent = false;

    if (duration) {
      const parts = duration.split(/\s*(?:-|–|to|đến)\s*/i);
      startDate = parts[0]?.trim();
      const endPart = parts[1]?.trim()?.toLowerCase();
      if (
        endPart &&
        (endPart.includes('hiện tại') || endPart.includes('present') || endPart.includes('nay'))
      ) {
        isCurrent = true;
        endDate = null as any;
      } else {
        endDate = parts[1]?.trim();
      }

      const startMatch = startDate?.match(/(\d{4})/);
      const endMatch = isCurrent ? currentYear : endDate?.match(/(\d{4})/)?.[1];
      if (startMatch && endMatch) {
        const diff = (Number(endMatch) - Number(startMatch[1])) * 12;
        if (diff > 0 && diff < 400) totalMonths += diff;
      }
    }

    if (company || position) {
      experience.push({
        company: company || 'Không xác định',
        position: position || 'Nhân viên',
        startDate,
        endDate: isCurrent ? null : endDate,
        isCurrent,
        achievements,
      });
    }
  }

  const yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;
  return { experience, yearsOfExperience };
}

function parseTemplateEducation(text: string): any[] {
  const eduSection = section(text, 'Education', ['Certifications', 'Projects', 'Languages']);
  if (!eduSection) return [];

  const blocks = eduSection
    .split(/(?:School:|\n(?=(?:Trường|Đại học|Cao đẳng|University|College)))/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const education: any[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(clean).filter(Boolean);
    if (lines.length === 0) continue;

    const school =
      extractLabeledValue(block, 'School', ['Degree', 'Major', 'Duration', 'Dates', 'GPA']) ||
      lines[0];
    const degree = extractLabeledValue(block, 'Degree', [
      'School',
      'Major',
      'Duration',
      'Dates',
      'GPA',
    ]);
    const major =
      extractLabeledValue(block, 'Major', ['School', 'Degree', 'Duration', 'Dates', 'GPA']) ||
      lines[1];
    const duration = extractLabeledValue(block, 'Duration', ['School', 'Degree', 'Major', 'GPA']);

    if (school) {
      education.push({
        school,
        degree: degree || 'Cử nhân',
        major: major || 'Công nghệ thông tin',
        startDate: duration?.split(/[-–]/)[0]?.trim(),
        endDate: duration?.split(/[-–]/)[1]?.trim(),
      });
    }
  }

  return education;
}

function parseResume(text: string): ResumeDraftData {
  const lines = text
    .split('\n')
    .map(clean)
    .filter((line): line is string => Boolean(line));
  const headings = new Set(REQUIRED_HEADINGS.map((heading) => heading.toLowerCase()));
  const frontMatter = lines.filter(
    (line) =>
      !headings.has(line.toLowerCase()) &&
      !/^(?:email|phone|address|linkedin|github|portfolio):/i.test(line) &&
      !line.includes(TEMPLATE_MARKER) &&
      !/RMS Candidate CV Template/i.test(line),
  );
  const labels = ['Email', 'Phone', 'Address', 'LinkedIn', 'GitHub', 'Portfolio'];
  const personalInfo = {
    fullName: frontMatter[0],
    email: extractLabeledValue(text, 'Email', labels),
    phoneNumber: extractLabeledValue(text, 'Phone', labels),
    address: extractLabeledValue(text, 'Address', labels),
    links: [
      ['LINKEDIN', extractLabeledValue(text, 'LinkedIn', labels)],
      ['GITHUB', extractLabeledValue(text, 'GitHub', labels)],
      ['PORTFOLIO', extractLabeledValue(text, 'Portfolio', labels)],
    ]
      .filter(([, url]) => Boolean(url))
      .map(([type, url]) => ({ type: type as 'LINKEDIN' | 'GITHUB' | 'PORTFOLIO', url: url! })),
  };

  const technicalSection = section(text, 'Technical Skills', [
    'Soft Skills',
    'Languages',
    'Work Experience',
    'Education',
  ]);
  const technical = splitItems(
    technicalSection
      .replace(/(?:Programming languages|Frameworks and libraries|Databases and tools):/gi, ',')
      .replace(/\n/g, ','),
  );
  const softSkills = splitItems(
    section(text, 'Soft Skills', ['Languages', 'Work Experience', 'Education']),
  );
  const languages = section(text, 'Languages', ['Work Experience', 'Education'])
    .split('\n')
    .map(clean)
    .filter((language): language is string => Boolean(language))
    .flatMap((language) => splitItems(language))
    .map((language) => {
      const [name, proficiency] = language.split(/\s+-\s+/, 2);
      const normalizedName = clean(name);
      return normalizedName
        ? {
            name: normalizedName,
            ...(clean(proficiency) ? { proficiency: clean(proficiency) } : {}),
          }
        : undefined;
    })
    .filter((language): language is { name: string; proficiency?: string } => Boolean(language));

  const { experience, yearsOfExperience } = parseTemplateExperience(text);
  const education = parseTemplateEducation(text);

  return {
    personalInfo,
    currentRole: frontMatter[1],
    summary: clean(
      section(text, 'Professional Summary', [
        'Technical Skills',
        'Soft Skills',
        'Languages',
        'Work Experience',
        'Education',
      ]),
    ),
    skills: { technical, softSkills, languages },
    yearsOfExperience: yearsOfExperience > 0 ? yearsOfExperience : undefined,
    workExperience: experience,
    education,
  };
}

/**
 * Identifies CVs created from the official RMS template using marker and headings,
 * then extracts all structured fields with 100% deterministic algorithm without calling LLM APIs.
 */
export async function parseCandidateTemplateCv(input: {
  fileType: 'PDF' | 'DOCX' | 'DOC';
  rawText: string;
  embed?: EmbedText;
}): Promise<CandidateTemplateParseResult> {
  const text = normalizeText(input.rawText);

  // Check template marker (supports PDF, DOCX, DOC)
  const isTemplateMarkerPresent =
    text.includes(TEMPLATE_MARKER) ||
    /RMS-CV-TEMPLATE/i.test(text) ||
    /RMS Candidate CV Template/i.test(text);

  if (!isTemplateMarkerPresent) {
    return { matched: false, reason: 'RMS template marker is missing.' };
  }

  const missingHeadings = REQUIRED_HEADINGS.filter(
    (heading) => !new RegExp(`(?:^|\\n)\\s*${heading}\\b`, 'i').test(text),
  );

  // Allow match if at least 4 of 6 standard headings are present
  if (missingHeadings.length > 2) {
    return {
      matched: false,
      reason: `Required template headings are missing: ${missingHeadings.join(', ')}.`,
    };
  }

  const resume = parseResume(text);
  if (!resume.personalInfo?.fullName || (!resume.personalInfo.email && !resume.personalInfo.phoneNumber)) {
    return {
      matched: false,
      reason: 'Template CV is missing a filled full name or contact information (email/phone).',
    };
  }

  return {
    matched: true,
    similarity: 0.95,
    extraction: CvExtractionSchema.parse({
      documentText: text,
      resume,
      confidence: 0.95,
      warnings: ['Parsed with official RMS template parser.'],
      method: 'LOCAL_TEXT',
      model: TEMPLATE_MODEL,
    }),
  };
}
