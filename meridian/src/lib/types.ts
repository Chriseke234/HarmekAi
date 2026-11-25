/**
 * Core domain types for Meridian — AI-Native Professional Network.
 */

export type WorkplaceType = "remote" | "hybrid" | "onsite";
export type EmploymentType = "full_time" | "contract" | "part_time" | "internship";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type ArtifactType = "repo" | "case_study" | "publication" | "live_product" | "design";
export type IntentTag = "hiring" | "collaboration" | "advice" | "general";
export type ApplicationStatus =
  | "applied"
  | "viewed"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "offer";

export type PostCategory = "shipped" | "engineering" | "hiring" | "design" | "career";

export interface ProofArtifact {
  id: string;
  profileId: string;
  artifactType: ArtifactType;
  title: string;
  url: string;
  summary: string;
  skillsTags: string[];
  verifiedSource: string;
  thumbnailUrl: string;
  metricsLabel: string;
}

export interface ExperienceItem {
  id: string;
  companyName: string;
  title: string;
  employmentType: EmploymentType;
  location: string;
  startDate: string;
  endDate: string | null;
  summary: string;
}

export interface ProfileSkill {
  id: string;
  skillName: string;
  proficiency: "working" | "proficient" | "expert";
  linkedArtifactCount: number;
}

export interface Profile {
  id: string;
  handle: string;
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  openToWork: boolean;
  workEmailVerified: boolean;
  verifiedDomain: string | null;
  connectionsCount: number;
  profileViews30d: number;
  skills: ProfileSkill[];
  artifacts: ProofArtifact[];
  experiences: ExperienceItem[];
}

export interface Organisation {
  id: string;
  slug: string;
  name: string;
  domain: string;
  domainVerified: boolean;
  industry: string;
  sizeBand: string;
  hqLocation: string;
  logoUrl: string;
  coverUrl: string;
  description: string;
  avgResponseHours: number;
  responseRatePct: number;
}

export interface JobListing {
  id: string;
  orgId: string;
  org: Organisation;
  title: string;
  description: string;
  responsibilities: string[];
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  requiredSkills: string[];
  status: "active" | "paused" | "closed" | "expired";
  expiresAt: string;
  createdAt: string;
  applicantCount: number;
  interviewStages: string[];
}

export interface JobFitResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  applicantName: string;
  applicantHandle: string;
  applicantAvatar: string;
  selectedArtifactTitles: string[];
  coverNote: string;
  matchScore: number;
  status: ApplicationStatus;
  createdAt: string;
}

export interface IntentMessage {
  id: string;
  senderName: string;
  senderHandle: string;
  senderAvatar: string;
  senderHeadline: string;
  online: boolean;
  intentTag: IntentTag;
  relatedJobTitle?: string;
  body: string;
  createdAt: string;
  unread: boolean;
  attachedArtifact?: string;
}

export interface FeedComment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorHeadline: string;
  authorVerified: boolean;
  category: PostCategory;
  createdAt: string;
  title?: string;
  body: string;
  imageUrl?: string;
  linkedArtifact?: {
    title: string;
    metrics: string;
    url: string;
    source: string;
  };
  linkedJobId?: string;
  tags: string[];
  reactions: {
    insightful: number;
    shipped: number;
    support: number;
  };
  comments: FeedComment[];
  reposts: number;
}

export interface NotificationItem {
  id: string;
  type: "hiring" | "artifact" | "message" | "connection";
  title: string;
  detail: string;
  href: string;
  timeAgo: string;
  unread: boolean;
}
