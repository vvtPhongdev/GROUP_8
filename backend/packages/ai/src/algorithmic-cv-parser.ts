import { CvExtractionSchema, type CvExtractionData, type ResumeDraftData } from '@wr/contracts';

const COMMON_TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'Node.js', 'React', 'ReactJS', 'Vue', 'Vue.js', 'Angular',
  'Next.js', 'NestJS', 'Express', 'Express.js', 'Java', 'Spring Boot', 'Spring', 'Python',
  'Django', 'FastAPI', 'Flask', 'C#', '.NET', '.NET Core', 'ASP.NET', 'Golang', 'Go',
  'PHP', 'Laravel', 'Rust', 'C++', 'C', 'Ruby', 'Ruby on Rails', 'Swift', 'Kotlin', 'Flutter',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQL Server',
  'Docker', 'Kubernetes', 'K8s', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'GitHub', 'GitLab',
  'TailwindCSS', 'Bootstrap', 'HTML', 'CSS', 'Sass', 'GraphQL', 'RESTful API', 'Microservices',
  'RabbitMQ', 'Kafka', 'Linux', 'Unit Testing', 'Jest', 'Mocha', 'Prisma', 'TypeORM',
];

const SKILL_NORMALIZE_MAP: Record<string, string> = {
  reactjs: 'React',
  'react.js': 'React',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  'vue.js': 'Vue',
  'express.js': 'Express',
  golang: 'Go',
  k8s: 'Kubernetes',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
};

export type AlgorithmicParseResult =
  | { matched: true; extraction: CvExtractionData }
  | { matched: false; reason: string };

function clean(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized || /^\[[^\]]+\]$/.test(normalized) || /^(?:n\/a|none)$/i.test(normalized)) {
    return undefined;
  }
  return normalized;
}

export function parseGenericCvWithAlgorithm(input: {
  rawText: string;
  fileName?: string;
}): AlgorithmicParseResult {
  const text = input.rawText.replace(/\r\n/g, '\n').trim();

  // If text is too short or likely a scanned image
  if (text.replace(/\s/g, '').length < 150) {
    return {
      matched: false,
      reason: 'CV text is too short or document is a scanned image with no text layer.',
    };
  }

  // 1. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : undefined;

  // 2. Extract Phone Number (Vietnam + International)
  const phoneMatch = text.match(/(?:(?:\+84|84|0)[35789]\d{8}\b)|(?:\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)/);
  const phoneNumber = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : undefined;

  // 3. Extract Links
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);

  const links: Array<{ type: 'GITHUB' | 'LINKEDIN' | 'PORTFOLIO'; url: string }> = [];
  if (githubMatch) links.push({ type: 'GITHUB', url: githubMatch[0] });
  if (linkedinMatch) links.push({ type: 'LINKEDIN', url: linkedinMatch[0] });

  // 4. Extract Full Name: inspect top lines
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let fullName: string | undefined;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (
      line &&
      line.length >= 3 &&
      line.length <= 45 &&
      !line.includes('@') &&
      !/\d{3,}/.test(line) &&
      !/(curriculum vitae|resume|hồ sơ|cv|thông tin|profile|contact)/i.test(line)
    ) {
      fullName = clean(line);
      break;
    }
  }

  // 5. Extract Technical Skills via dictionary matching with word boundary
  const detectedSkills = new Set<string>();
  for (const skill of COMMON_TECH_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      const lower = skill.toLowerCase();
      const normalized = SKILL_NORMALIZE_MAP[lower] || skill;
      detectedSkills.add(normalized);
    }
  }

  // 6. Estimate Years of Experience from Date Ranges
  const dateRanges = text.matchAll(
    /(?:(0[1-9]|1[0-2])[\/\.-])?(\d{4})\s*(?:-|–|to|đến)\s*(?:(0[1-9]|1[0-2])[\/\.-])?(\d{4}|hiện tại|present|nay)/gi,
  );
  let totalExperienceYears = 0;
  const currentYear = new Date().getFullYear();

  for (const match of dateRanges) {
    const startYearStr = match[2];
    const endStr = (match[4] || '').toLowerCase();
    const startYear = startYearStr ? parseInt(startYearStr, 10) : 0;
    const endYear =
      endStr.includes('hiện tại') || endStr.includes('present') || endStr.includes('nay')
        ? currentYear
        : parseInt(endStr, 10);

    if (startYear && endYear && endYear >= startYear && endYear <= currentYear + 1) {
      const diff = endYear - startYear;
      if (diff > 0 && diff <= 15) {
        totalExperienceYears += diff;
      }
    }
  }

  const estimatedYears =
    totalExperienceYears > 0 ? Math.min(25, totalExperienceYears) : undefined;

  // Check completeness confidence:
  // Must have: fullName + (email or phone) + at least 2 technical skills
  const hasName = Boolean(fullName);
  const hasContact = Boolean(email || phoneNumber);
  const skillCount = detectedSkills.size;

  if (!hasName || !hasContact || skillCount < 2) {
    return {
      matched: false,
      reason: `Algorithmic parser insufficient fields: hasName=${hasName}, hasContact=${hasContact}, skills=${skillCount}. Fallback to AI OCR.`,
    };
  }

  const resume: ResumeDraftData = {
    personalInfo: {
      fullName,
      email,
      phoneNumber,
      links,
    },
    skills: {
      technical: Array.from(detectedSkills),
    },
    yearsOfExperience: estimatedYears,
  };

  return {
    matched: true,
    extraction: CvExtractionSchema.parse({
      documentText: text,
      resume,
      confidence: 0.85,
      warnings: ['Parsed with fast algorithmic rule engine.'],
      method: 'LOCAL_TEXT',
      model: 'rms-heuristic-algorithm',
    }),
  };
}
