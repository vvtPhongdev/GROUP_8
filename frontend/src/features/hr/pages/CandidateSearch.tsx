import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  HRActionButton,
  HRCard,
  HRDashboardPage,
  HREmptyState,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
  HRStatusBadge,
} from '../components';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface CampaignDetail {
  requestId: string;
  jobPostingId?: string;
  title: string;
  position: string;
  status: string;
  departmentName: string;
  headcount: number;
  salaryRange?: string;
  jobDescription?: string;
  requiredSkills: string[];
  deadline?: string;
}

interface ApplicationCandidateCv {
  id: string;
  fileName?: string;
  fileType?: string;
  parsedAt?: string | null;
  screeningStatus?: string;
  structuredData?: {
    evaluation?: {
      overallScore?: number;
      technicalFit?: number;
      strengths?: string[];
      weaknesses?: string[];
      recommendation?: 'STRONG_MATCH' | 'CONSIDER' | 'REJECT';
      recommendationReason?: string;
      matchedSkills?: string[];
      gaps?: string[];
    };
    resume?: {
      contact?: {
        name?: string;
        email?: string;
        phone?: string;
      };
      summary?: string;
      skills?: string[];
      workExperience?: Array<{
        company?: string;
        role?: string;
        period?: string;
        responsibilities?: string[];
      }>;
      education?: Array<{
        institution?: string;
        degree?: string;
        year?: string;
      }>;
    };
  } | null;
}

interface ApplicationItem {
  id: string;
  requestId: string;
  candidateId: string;
  status: string; // SUBMITTED | SCREENING | SHORTLISTED | INTERVIEWING | REJECTED | ...
  createdAt: string;
  candidate?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    structuredData?: Record<string, unknown> | null;
    cvDocuments?: ApplicationCandidateCv[];
  };
  request?: {
    id: string;
    position: string;
    department?: { name: string } | null;
    headcount: number;
    skillRequirements?: unknown;
    jobDescription?: string;
  };
}

interface RankedCandidate {
  applicationId: string;
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  appliedDate: string;
  applicationStatus: string;
  cvDocumentId?: string;
  cvFileName?: string;
  aiScore: number; // 0 - 100
  technicalFit: number; // 0 - 100
  aiRecommendation: 'STRONG_MATCH' | 'CONSIDER' | 'REJECT' | 'PENDING';
  aiReason?: string;
  strengths: string[];
  weaknesses: string[];
  skills: string[];
  resumeData?: ApplicationCandidateCv['structuredData'];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const extractSkills = (requirements: unknown): string[] => {
  if (!requirements || typeof requirements !== 'object') return [];
  const val = requirements as { skills?: unknown; required?: unknown };
  const arr = Array.isArray(val.skills) ? val.skills : val.required;
  if (Array.isArray(arr)) {
    return arr.filter((s): s is string => typeof s === 'string' && Boolean(s.trim()));
  }
  return [];
};

const getRankBadge = (rankIndex: number) => {
  if (rankIndex === 0) return { label: '🥇 Rank 1', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (rankIndex === 1) return { label: '🥈 Rank 2', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  if (rankIndex === 2) return { label: '🥉 Rank 3', color: 'bg-orange-100 text-orange-800 border-orange-300' };
  return { label: `#${rankIndex + 1}`, color: 'bg-gray-100 text-gray-700 border-gray-200' };
};

const getRecommendationBadge = (rec: RankedCandidate['aiRecommendation']) => {
  switch (rec) {
    case 'STRONG_MATCH':
      return { text: 'Strong Match', tone: 'approved' as const, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'CONSIDER':
      return { text: 'Consider', tone: 'pending' as const, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'REJECT':
      return { text: 'Not Qualified', tone: 'rejected' as const, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { text: 'Pending AI Review', tone: 'slate' as const, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
};

// ─── Component ──────────────────────────────────────────────────────────────

export const CandidateSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRequestId = searchParams.get('requestId') || '';
  const { token } = useAuth();

  // State
  const [campaigns, setCampaigns] = useState<CampaignDetail[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(queryRequestId);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [evaluatingCvId, setEvaluatingCvId] = useState<string | null>(null);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFullJd, setShowFullJd] = useState(false);
  const [inspectingCandidate, setInspectingCandidate] = useState<RankedCandidate | null>(null);

  // Popup state for active AI evaluation progress & results
  const [aiPopup, setAiPopup] = useState<{
    visible: boolean;
    active: boolean;
    candidateName: string;
    step: 'EXTRACTING' | 'MATCHING' | 'SCORING' | 'COMPLETED';
    progress: number;
    result?: {
      overallScore: number;
      technicalFit: number;
      recommendation: 'STRONG_MATCH' | 'CONSIDER' | 'REJECT';
      recommendationReason: string;
    };
  } | null>(null);

  // Dispatch In-App Notification & refresh Header Bell icon
  const sendInAppNotification = async (title: string, body: string) => {
    try {
      await apiRequest('/notifications', token, {
        method: 'POST',
        body: JSON.stringify({
          type: 'SYSTEM',
          title,
          body,
          relatedEntityId: selectedRequestId,
          relatedEntityType: 'RecruitmentRequest',
        }),
      });
    } catch (e) {
      console.warn('[CandidateSearch] Failed to create in-app notification:', e);
    } finally {
      window.dispatchEvent(new CustomEvent('notification-refresh'));
    }
  };

  // 1. Fetch campaigns (Job Postings + Recruitment Requests)
  useEffect(() => {
    let mounted = true;
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const [postingsRes, requestsRes] = await Promise.all([
          apiRequest<any>('/job-postings', token).catch((err) => {
            console.warn('[CandidateSearch] /job-postings error:', err);
            return [];
          }),
          apiRequest<any>('/recruitment-requests?limit=100', token).catch((err) => {
            console.warn('[CandidateSearch] /recruitment-requests error:', err);
            return { data: [] };
          }),
        ]);

        if (!mounted) return;

        const postings: any[] = Array.isArray(postingsRes)
          ? postingsRes
          : Array.isArray(postingsRes?.data)
          ? postingsRes.data
          : [];

        const requests: any[] = Array.isArray(requestsRes)
          ? requestsRes
          : Array.isArray(requestsRes?.data)
          ? requestsRes.data
          : [];

        const requestMap = new Map<string, any>();
        requests.forEach((r) => {
          if (r?.id) requestMap.set(r.id, r);
        });

        const list: CampaignDetail[] = [];

        // 1. Add campaigns from job postings
        postings.forEach((p) => {
          if (!p) return;
          const req = p.request || requestMap.get(p.requestId) || {};
          const reqId = p.requestId || req.id || p.id;
          if (!reqId) return;

          list.push({
            requestId: reqId,
            jobPostingId: p.id,
            title: p.title || req.position || 'Recruitment Campaign',
            position: req.position || p.title || 'Position Title',
            status: p.status || req.status || 'PUBLISHED',
            departmentName: req.department?.name || p.department?.name || 'Department',
            headcount: req.headcount || 1,
            salaryRange: req.salaryRange || (p.salaryMin ? `${p.salaryMin?.toLocaleString()} - ${p.salaryMax?.toLocaleString()} VND` : 'Negotiable'),
            jobDescription: p.description || p.jobDescription || req.jobDescription || 'No detailed job description provided.',
            requiredSkills: extractSkills(req.skillRequirements || p.requirements || p.skillRequirements),
            deadline: p.expireDate || p.deadline || req.deadline,
          });
        });

        // 2. Add approved requests that are not yet in postings
        requests.forEach((r) => {
          if (!r?.id) return;
          if (!list.some((c) => c.requestId === r.id)) {
            list.push({
              requestId: r.id,
              title: r.position || 'Recruitment Request',
              position: r.position || 'Position Title',
              status: r.status || 'APPROVED',
              departmentName: r.department?.name || 'Department',
              headcount: r.headcount || 1,
              salaryRange: r.salaryRange || 'Negotiable',
              jobDescription: r.jobDescription || 'No detailed job description provided.',
              requiredSkills: extractSkills(r.skillRequirements),
            });
          }
        });

        setCampaigns(list);

        // Default to URL request ID or the first available campaign
        if (list.length > 0) {
          const matched = queryRequestId && list.some((c) => c.requestId === queryRequestId);
          const initialId = matched ? queryRequestId : list[0].requestId;
          setSelectedRequestId(initialId);
          if (!matched && initialId) {
            setSearchParams({ requestId: initialId }, { replace: true });
          }
        }
      } catch (err: any) {
        console.error('[CandidateSearch] Failed to load campaigns:', err);
        if (mounted) {
          setAlertMessage({ type: 'error', text: `Unable to load recruitment campaigns: ${err?.message || 'Unknown error'}` });
        }
      } finally {
        if (mounted) setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
    return () => {
      mounted = false;
    };
  }, [token, queryRequestId]);

  // 2. Load candidates applied specifically to the selected Campaign
  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.requestId === selectedRequestId) || null;
  }, [campaigns, selectedRequestId]);

  const loadCampaignApplications = async (requestId: string) => {
    if (!requestId) return;
    try {
      setLoadingApplications(true);
      const data = await apiRequest<any>(`/applications?requestId=${requestId}`, token);
      const list: ApplicationItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setApplications(list);
    } catch (err) {
      console.warn('[CandidateSearch] Failed to load applications:', err);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      loadCampaignApplications(selectedRequestId);
    }
  }, [selectedRequestId, token]);

  const handleSelectCampaign = (reqId: string) => {
    setSelectedRequestId(reqId);
    setSearchParams({ requestId: reqId });
    setAlertMessage(null);
  };

  // 3. AI Fit Ranking & Mapping
  const rankedCandidates: RankedCandidate[] = useMemo(() => {
    const list: RankedCandidate[] = applications.map((app) => {
      const candidate = app.candidate;
      const cvDoc = candidate?.cvDocuments?.[0];
      const evaluation = cvDoc?.structuredData?.evaluation;
      const resume = cvDoc?.structuredData?.resume;

      const aiScore = evaluation?.overallScore ?? 0;
      const technicalFit = evaluation?.technicalFit ?? 0;

      let aiRecommendation: RankedCandidate['aiRecommendation'] = 'PENDING';
      if (evaluation?.recommendation) {
        aiRecommendation = evaluation.recommendation;
      } else if (aiScore >= 75) {
        aiRecommendation = 'STRONG_MATCH';
      } else if (aiScore >= 50) {
        aiRecommendation = 'CONSIDER';
      } else if (aiScore > 0) {
        aiRecommendation = 'REJECT';
      }

      return {
        applicationId: app.id,
        candidateId: candidate?.id || app.candidateId,
        name: candidate?.fullName || 'Candidate Name Not Provided',
        email: candidate?.email || 'No email provided',
        phone: candidate?.phone || 'No phone provided',
        appliedDate: new Date(app.createdAt).toLocaleDateString('en-US'),
        applicationStatus: app.status,
        cvDocumentId: cvDoc?.id,
        cvFileName: cvDoc?.fileName || 'Resume-Document.pdf',
        aiScore,
        technicalFit,
        aiRecommendation,
        aiReason: evaluation?.recommendationReason || (aiScore > 0 ? `Skills & experience match evaluated at ${aiScore}%` : 'AI evaluation has not been run yet'),
        strengths: evaluation?.strengths || [],
        weaknesses: evaluation?.weaknesses || [],
        skills: resume?.skills || extractSkills(candidate?.structuredData?.skills),
        resumeData: cvDoc?.structuredData,
      };
    });

    // Sort descending by AI Match Score
    return list.sort((a, b) => b.aiScore - a.aiScore);
  }, [applications]);

  // Candidate status filter
  const filteredCandidates = useMemo(() => {
    if (statusFilter === 'ALL') return rankedCandidates;
    if (statusFilter === 'STRONG_MATCH') return rankedCandidates.filter((c) => c.aiRecommendation === 'STRONG_MATCH');
    if (statusFilter === 'CONSIDER') return rankedCandidates.filter((c) => c.aiRecommendation === 'CONSIDER');
    if (statusFilter === 'SHORTLISTED') return rankedCandidates.filter((c) => c.applicationStatus === 'SHORTLISTED' || c.applicationStatus === 'INTERVIEWING');
    if (statusFilter === 'PENDING_EVAL') return rankedCandidates.filter((c) => c.aiRecommendation === 'PENDING');
    return rankedCandidates;
  }, [rankedCandidates, statusFilter]);

  // 4. Trigger Single AI Resume Evaluation
  const handleEvaluateWithAi = async (cvDocId: string, candidateName: string) => {
    if (!cvDocId || !selectedRequestId) {
      setAlertMessage({ type: 'error', text: 'Resume document not found for evaluation.' });
      return;
    }

    try {
      setEvaluatingCvId(cvDocId);
      setAlertMessage(null);

      // Display floating progress HUD
      setAiPopup({
        visible: true,
        active: true,
        candidateName,
        step: 'EXTRACTING',
        progress: 25,
      });

      const timer1 = setTimeout(() => {
        setAiPopup((prev) => (prev && prev.active ? { ...prev, step: 'MATCHING', progress: 60 } : prev));
      }, 700);

      const timer2 = setTimeout(() => {
        setAiPopup((prev) => (prev && prev.active ? { ...prev, step: 'SCORING', progress: 85 } : prev));
      }, 1600);

      const result = await apiRequest<{
        evaluation: {
          overallScore: number;
          technicalFit: number;
          recommendation: 'STRONG_MATCH' | 'CONSIDER' | 'REJECT';
          recommendationReason: string;
        };
      }>('/evaluations/cv', token, {
        method: 'POST',
        body: JSON.stringify({
          cvDocumentId: cvDocId,
          requestId: selectedRequestId,
          autoUpdateStatus: true,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      // Transition popup to completed state
      setAiPopup({
        visible: true,
        active: false,
        candidateName,
        step: 'COMPLETED',
        progress: 100,
        result: result.evaluation,
      });

      // Dispatch in-app notification to Bell icon
      await sendInAppNotification(
        `⚡ AI Evaluation: Scored candidate ${candidateName}`,
        `Achieved ${result.evaluation.overallScore}/100 (${result.evaluation.recommendation}) for ${activeCampaign?.position || 'target position'}.`,
      );

      setAlertMessage({
        type: 'success',
        text: `AI evaluation completed for ${candidateName}: Score ${result.evaluation.overallScore}/100 (${result.evaluation.recommendation}). Notification delivered to the Notification bell!`,
      });

      await loadCampaignApplications(selectedRequestId);
    } catch (err: any) {
      setAiPopup(null);
      setAlertMessage({
        type: 'error',
        text: `AI evaluation service error: ${err.message || 'AI service temporarily busy, please retry'}`,
      });
    } finally {
      setEvaluatingCvId(null);
    }
  };

  // 5. Batch AI Evaluation for all un-evaluated applicants
  const handleBatchEvaluate = async () => {
    const unevaluated = rankedCandidates.filter((c) => c.cvDocumentId && c.aiScore === 0);
    if (unevaluated.length === 0) {
      setAlertMessage({ type: 'success', text: 'All resumes in this campaign have already been evaluated by AI!' });
      return;
    }

    setBatchEvaluating(true);
    setAlertMessage(null);
    let successCount = 0;

    setAiPopup({
      visible: true,
      active: true,
      candidateName: `Evaluating 1/${unevaluated.length}: ${unevaluated[0].name}`,
      step: 'SCORING',
      progress: 10,
    });

    for (let i = 0; i < unevaluated.length; i++) {
      const cand = unevaluated[i];
      setAiPopup({
        visible: true,
        active: true,
        candidateName: `Evaluating ${i + 1}/${unevaluated.length}: ${cand.name}`,
        step: 'SCORING',
        progress: Math.round(((i + 1) / unevaluated.length) * 100),
      });

      try {
        await apiRequest('/evaluations/cv', token, {
          method: 'POST',
          body: JSON.stringify({
            cvDocumentId: cand.cvDocumentId,
            requestId: selectedRequestId,
            autoUpdateStatus: true,
          }),
        });
        successCount++;
      } catch (e) {
        // Continue with next candidate
      }
    }

    setBatchEvaluating(false);

    setAiPopup({
      visible: true,
      active: false,
      candidateName: `${successCount}/${unevaluated.length} candidates`,
      step: 'COMPLETED',
      progress: 100,
    });

    await sendInAppNotification(
      `⚡ AI Evaluation: Batch completed for ${successCount} candidates`,
      `Batch evaluation and candidate ranking finished for campaign ${activeCampaign?.position || ''}.`,
    );

    setAlertMessage({
      type: 'success',
      text: `Completed AI evaluation for ${successCount}/${unevaluated.length} candidate applications! Delivered to the Notification bell.`,
    });
    await loadCampaignApplications(selectedRequestId);
  };

  // 6. Update Screening Status (Shortlist / Reject)
  const handleUpdateApplicationStatus = async (appId: string, nextStatus: 'SHORTLISTED' | 'REJECTED') => {
    try {
      await apiRequest(`/applications/${appId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setAlertMessage({
        type: 'success',
        text: nextStatus === 'SHORTLISTED' ? 'Candidate successfully shortlisted for interview!' : 'Candidate marked as Not Qualified (Rejected).',
      });
      await loadCampaignApplications(selectedRequestId);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: `Unable to update application status: ${err.message}` });
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    const total = rankedCandidates.length;
    const evaluated = rankedCandidates.filter((c) => c.aiScore > 0).length;
    const strongMatch = rankedCandidates.filter((c) => c.aiRecommendation === 'STRONG_MATCH').length;
    const shortlisted = rankedCandidates.filter((c) => c.applicationStatus === 'SHORTLISTED' || c.applicationStatus === 'INTERVIEWING').length;
    return { total, evaluated, strongMatch, shortlisted };
  }, [rankedCandidates]);

  if (loadingCampaigns) {
    return <HRLoadingState label="Loading recruitment campaigns..." />;
  }

  return (
    <HRDashboardPage>
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <HRPageHeader
        eyebrow="AI Recruitment Intelligence"
        title="Candidate Screening & AI Ranking by Campaign"
        description="Candidate resumes submitted to this campaign are comprehensively analyzed against the job description and automatically ranked by suitability."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <HRActionButton
              variant="secondary"
              onClick={() => navigate('/hr/campaigns')}
            >
              Campaigns
            </HRActionButton>
            <HRActionButton
              variant="secondary"
              onClick={() => navigate('/hr/interviews')}
            >
              Interview Schedule
            </HRActionButton>
            {rankedCandidates.some((c) => c.cvDocumentId && c.aiScore === 0) && (
              <HRActionButton
                variant="primary"
                onClick={handleBatchEvaluate}
                disabled={batchEvaluating}
              >
                {batchEvaluating ? '⚡ Evaluating all resumes...' : '⚡ AI Evaluate All Resumes'}
              </HRActionButton>
            )}
          </div>
        }
      />

      {/* Alert Banner */}
      {alertMessage && (
        <HRInlineAlert tone={alertMessage.type === 'success' ? 'approved' : 'rejected'}>
          {alertMessage.text}
        </HRInlineAlert>
      )}

      {/* ─── 1. Campaign Selector & JD Details Banner ──────────────────────────── */}
      <HRCard className="border-teal-command/30 bg-gradient-to-r from-teal-50/50 via-white to-clean-surface shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-command">
                Active Screening Campaign
              </span>
              <div className="mt-1 flex items-center gap-3">
                <select
                  value={selectedRequestId}
                  onChange={(e) => handleSelectCampaign(e.target.value)}
                  className="rounded-lg border border-border-warm bg-white px-3 py-2 text-base font-semibold text-deep-charcoal shadow-sm outline-none focus:border-teal-command focus:ring-1 focus:ring-teal-command md:min-w-[320px]"
                >
                  {campaigns.map((c) => (
                    <option key={c.requestId} value={c.requestId}>
                      {c.title} — [{c.departmentName}] ({c.status})
                    </option>
                  ))}
                </select>

                {activeCampaign && (
                  <HRStatusBadge
                    tone={activeCampaign.status === 'PUBLISHED' || activeCampaign.status === 'ACTIVE' ? 'approved' : 'pending'}
                  >
                    {activeCampaign.status}
                  </HRStatusBadge>
                )}
              </div>
            </div>

            {activeCampaign && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-ink">
                <div>
                  Target Headcount:{' '}
                  <span className="font-bold text-deep-charcoal">{activeCampaign.headcount} positions</span>
                </div>
                <div>
                  Budgeted Compensation:{' '}
                  <span className="font-bold text-deep-charcoal">{activeCampaign.salaryRange}</span>
                </div>
                <div>
                  Department:{' '}
                  <span className="font-bold text-deep-charcoal">{activeCampaign.departmentName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Job Description Details */}
          {activeCampaign && (
            <div className="mt-2 rounded-lg border border-border-warm bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-deep-charcoal">
                  📋 Job Description & Key Requirements
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullJd(!showFullJd)}
                  className="text-xs font-medium text-teal-command hover:underline"
                >
                  {showFullJd ? 'Collapse JD ▲' : 'View Full JD ▼'}
                </button>
              </div>

              {/* Required Skills */}
              {activeCampaign.requiredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-ink">Required Skills:</span>
                  {activeCampaign.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-command"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              {/* JD Body */}
              <div
                className={`mt-2 text-xs leading-relaxed text-slate-ink whitespace-pre-line ${
                  showFullJd ? '' : 'line-clamp-3'
                }`}
              >
                {activeCampaign.jobDescription}
              </div>
            </div>
          )}
        </div>
      </HRCard>

      {/* ─── 2. Metric KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HRCard className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-slate-ink">Total Resumes Submitted</span>
          <span className="text-2xl font-bold text-deep-charcoal">{stats.total}</span>
          <span className="text-[11px] text-secondary">Applications received for this campaign</span>
        </HRCard>

        <HRCard className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-slate-ink">AI Evaluated</span>
          <span className="text-2xl font-bold text-teal-command">
            {stats.evaluated} / {stats.total}
          </span>
          <span className="text-[11px] text-secondary">Automated deep parsing & scoring</span>
        </HRCard>

        <HRCard className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-slate-ink">Strong Match</span>
          <span className="text-2xl font-bold text-emerald-600">{stats.strongMatch}</span>
          <span className="text-[11px] text-secondary">AI score of 75/100 or higher</span>
        </HRCard>

        <HRCard className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-slate-ink">Shortlisted for Interview</span>
          <span className="text-2xl font-bold text-indigo-600">{stats.shortlisted}</span>
          <span className="text-[11px] text-secondary">Ready for interview scheduling</span>
        </HRCard>
      </div>

      {/* ─── 3. Candidate Ranking Table & Action Cards ────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Filter bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-deep-charcoal">
              🏆 Candidate Ranking by AI Fit Score ({filteredCandidates.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-ink">Filter:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-deep-charcoal text-white'
                  : 'border border-border-warm bg-white text-slate-ink hover:bg-stone-50'
              }`}
            >
              All ({rankedCandidates.length})
            </button>
            <button
              onClick={() => setStatusFilter('STRONG_MATCH')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'STRONG_MATCH'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-border-warm bg-white text-slate-ink hover:bg-stone-50'
              }`}
            >
              Strong Match ({rankedCandidates.filter((c) => c.aiRecommendation === 'STRONG_MATCH').length})
            </button>
            <button
              onClick={() => setStatusFilter('CONSIDER')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'CONSIDER'
                  ? 'bg-amber-600 text-white'
                  : 'border border-border-warm bg-white text-slate-ink hover:bg-stone-50'
              }`}
            >
              Consider ({rankedCandidates.filter((c) => c.aiRecommendation === 'CONSIDER').length})
            </button>
            <button
              onClick={() => setStatusFilter('SHORTLISTED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'SHORTLISTED'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-border-warm bg-white text-slate-ink hover:bg-stone-50'
              }`}
            >
              Shortlisted ({rankedCandidates.filter((c) => c.applicationStatus === 'SHORTLISTED' || c.applicationStatus === 'INTERVIEWING').length})
            </button>
          </div>
        </div>

        {/* Candidate List */}
        {loadingApplications ? (
          <HRLoadingState label="Loading campaign applications..." />
        ) : filteredCandidates.length === 0 ? (
          <HREmptyState
            title="No candidates have applied to this campaign yet"
            description={
              activeCampaign
                ? `Campaign "${activeCampaign.title}" has not received direct applications yet. Only candidates who applied specifically to this campaign appear here.`
                : 'Please select a recruitment campaign to view applicant resumes.'
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCandidates.map((cand, idx) => {
              const rank = getRankBadge(idx);
              const recBadge = getRecommendationBadge(cand.aiRecommendation);
              const isEvaluatingThis = evaluatingCvId === cand.cvDocumentId;

              return (
                <HRCard
                  key={cand.applicationId}
                  className="transition-all hover:border-teal-command/40 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* Column 1: Rank & Candidate Details */}
                    <div className="flex items-start gap-4">
                      {/* Rank badge */}
                      <div
                        className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl border font-bold shadow-xs ${rank.color}`}
                      >
                        <span className="text-xs">{rank.label}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-deep-charcoal">{cand.name}</h3>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-bold ${recBadge.bg}`}
                          >
                            {recBadge.text}
                          </span>
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-slate-ink">
                            Status: {cand.applicationStatus}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-ink">
                          <span>📧 {cand.email}</span>
                          <span>📞 {cand.phone}</span>
                          <span>📅 Applied: {cand.appliedDate}</span>
                          <span>📄 {cand.cvFileName}</span>
                        </div>

                        {/* AI Assessment Summary */}
                        {cand.aiScore > 0 ? (
                          <div className="mt-1 text-xs text-deep-charcoal">
                            <span className="font-semibold text-teal-command">AI Evaluation Summary:</span>{' '}
                            {cand.aiReason}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-secondary italic">
                            AI evaluation has not been performed on this resume yet.
                          </div>
                        )}

                        {/* Candidate Strengths */}
                        {cand.strengths.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-emerald-700">Key Strengths:</span>
                            {cand.strengths.slice(0, 3).map((st, i) => (
                              <span
                                key={i}
                                className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800"
                              >
                                ✓ {st}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: AI Fit Scores & Actions */}
                    <div className="flex flex-col items-end gap-3 lg:w-[320px] lg:shrink-0">
                      {/* Overall Fit Gauge */}
                      <div className="w-full rounded-lg border border-border-warm bg-stone-50/60 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-ink">Overall Match Score</span>
                          <span className="text-base font-extrabold text-teal-command">
                            {cand.aiScore > 0 ? `${cand.aiScore}/100` : 'N/A'}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              cand.aiScore >= 75
                                ? 'bg-emerald-500'
                                : cand.aiScore >= 50
                                ? 'bg-amber-500'
                                : cand.aiScore > 0
                                ? 'bg-rose-500'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${cand.aiScore}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-ink">
                          <span>Technical Fit:</span>
                          <span className="font-bold text-deep-charcoal">
                            {cand.technicalFit > 0 ? `${cand.technicalFit}%` : '--'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {cand.cvDocumentId && (
                          <button
                            type="button"
                            onClick={() => handleEvaluateWithAi(cand.cvDocumentId!, cand.name)}
                            disabled={isEvaluatingThis}
                            className="rounded-lg border border-teal-command/30 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-command transition-colors hover:bg-teal-100 disabled:opacity-50"
                          >
                            {isEvaluatingThis ? '⚡ Analyzing...' : '⚡ Re-evaluate AI'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setInspectingCandidate(cand)}
                          className="rounded-lg border border-border-warm bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-ink transition-colors hover:bg-stone-50"
                        >
                          AI Evaluation Details
                        </button>

                        {cand.applicationStatus !== 'SHORTLISTED' && cand.applicationStatus !== 'INTERVIEWING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateApplicationStatus(cand.applicationId, 'SHORTLISTED')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                          >
                            Shortlist for Interview
                          </button>
                        )}

                        {cand.applicationStatus === 'SHORTLISTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/hr/interviews?candidateId=${cand.candidateId}&requestId=${selectedRequestId}`,
                              )
                            }
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                          >
                            Schedule Interview
                          </button>
                        )}

                        {cand.applicationStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateApplicationStatus(cand.applicationId, 'REJECTED')}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </HRCard>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: AI Evaluation Report & Resume Details ─────────────────────── */}
      {inspectingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-warm p-5">
              <div>
                <h3 className="text-lg font-bold text-deep-charcoal">
                  AI Evaluation Report — {inspectingCandidate.name}
                </h3>
                <p className="text-xs text-slate-ink">
                  Matched against position:{' '}
                  <span className="font-semibold text-teal-command">{activeCampaign?.title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCandidate(null)}
                className="rounded-lg p-2 text-slate-ink hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-teal-command/20 bg-teal-50/40 p-4">
                <div>
                  <div className="text-xs text-slate-ink">Overall AI Match Score</div>
                  <div className="text-3xl font-extrabold text-teal-command">
                    {inspectingCandidate.aiScore}/100
                  </div>
                  <div className="mt-1 text-xs font-semibold text-deep-charcoal">
                    {inspectingCandidate.aiRecommendation === 'STRONG_MATCH'
                      ? '✓ Strong match for recruitment requirements'
                      : inspectingCandidate.aiRecommendation === 'CONSIDER'
                      ? '⚠️ Meets baseline requirements, further review needed'
                      : '✗ Does not meet core requirements'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-ink">Technical Fit Score</div>
                  <div className="text-3xl font-extrabold text-deep-charcoal">
                    {inspectingCandidate.technicalFit}%
                  </div>
                  <div className="mt-1 text-xs text-secondary">
                    Independent objective AI assessment
                  </div>
                </div>
              </div>

              {/* Assessment summary */}
              <div>
                <h4 className="text-sm font-bold text-deep-charcoal">📝 Executive AI Assessment Summary</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-ink bg-stone-50 p-3 rounded-lg border border-border-warm">
                  {inspectingCandidate.aiReason || 'No detailed summary provided.'}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    ✓ Key Strengths for Role
                  </h5>
                  {inspectingCandidate.strengths.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs text-emerald-950">
                      {inspectingCandidate.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-secondary italic">No prominent advantages identified.</p>
                  )}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    ⚠️ Identified Skill Gaps / Areas to Probe
                  </h5>
                  {inspectingCandidate.weaknesses.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs text-amber-950">
                      {inspectingCandidate.weaknesses.map((wk, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-secondary italic">No major gaps detected.</p>
                  )}
                </div>
              </div>

              {/* Extracted Skills */}
              {inspectingCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-deep-charcoal">🛠️ Skills Extracted from Resume</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {inspectingCandidate.skills.map((sk, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-slate-ink"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-border-warm p-4 bg-stone-50 rounded-b-2xl">
              <span className="text-xs text-slate-ink">Document: {inspectingCandidate.cvFileName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingCandidate(null)}
                  className="rounded-lg border border-border-warm bg-white px-4 py-2 text-xs font-semibold text-slate-ink hover:bg-stone-100"
                >
                  Close
                </button>
                {inspectingCandidate.applicationStatus !== 'SHORTLISTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateApplicationStatus(inspectingCandidate.applicationId, 'SHORTLISTED');
                      setInspectingCandidate(null);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Shortlist Candidate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL-TIME AI EVALUATION HUD POPUP ─────────────────────────────────── */}
      {aiPopup && aiPopup.visible && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-teal-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header popup */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 font-bold text-sm">
                🤖
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  AI Screening Engine
                </p>
                <p className="text-[11px] text-slate-500">
                  {aiPopup.active ? 'Analyzing in real-time...' : 'Evaluation completed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiPopup((prev) => (prev ? { ...prev, visible: false } : null))}
              className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Body popup */}
          <div className="mt-3.5 space-y-3">
            <div>
              <p className="text-xs font-semibold text-deep-charcoal line-clamp-1">
                {aiPopup.candidateName}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                <span>Analysis progress:</span>
                <span className="font-bold text-teal-700">{aiPopup.progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${aiPopup.progress}%` }}
                />
              </div>
            </div>

            {/* Micro-steps */}
            {aiPopup.active ? (
              <div className="space-y-1.5 rounded-xl bg-teal-50/50 p-2.5 text-[11px]">
                <div className={`flex items-center gap-2 ${aiPopup.step === 'EXTRACTING' ? 'font-bold text-teal-800' : 'text-slate-500'}`}>
                  <span>{aiPopup.step === 'EXTRACTING' ? '🔄' : '✅'}</span>
                  <span>1. Parsing resume text & normalizing skills</span>
                </div>
                <div className={`flex items-center gap-2 ${aiPopup.step === 'MATCHING' ? 'font-bold text-teal-800' : 'text-slate-500'}`}>
                  <span>{aiPopup.step === 'MATCHING' ? '🔄' : aiPopup.progress >= 60 ? '✅' : '⏳'}</span>
                  <span>2. Matching against JD & scoring requirements</span>
                </div>
                <div className={`flex items-center gap-2 ${aiPopup.step === 'SCORING' ? 'font-bold text-teal-800' : 'text-slate-500'}`}>
                  <span>{aiPopup.step === 'SCORING' ? '🔄' : '⏳'}</span>
                  <span>3. Computing composite score & recommendation</span>
                </div>
              </div>
            ) : aiPopup.result ? (
              <div className="space-y-2 rounded-xl bg-emerald-50/60 p-3 border border-emerald-200/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Overall Score:</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {aiPopup.result.overallScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-emerald-800">Recommendation:</span>
                  <span className="inline-flex rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    {aiPopup.result.recommendation === 'STRONG_MATCH'
                      ? 'STRONG MATCH'
                      : aiPopup.result.recommendation === 'CONSIDER'
                      ? 'CONSIDER'
                      : 'NOT QUALIFIED'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-800 bg-white/70 rounded-lg p-2 border border-teal-100">
                  <span>🔔</span>
                  <span className="font-medium">Notification sent to the Header notification bell!</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200/60 text-xs text-emerald-900 flex items-center gap-2">
                <span>🔔</span>
                <span className="font-medium">Evaluation completed and sent to the Notification bell!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </HRDashboardPage>
  );
};
