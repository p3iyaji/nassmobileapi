/** Common API response wrapper */
export interface ApiResponse<T = unknown> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/** Auth */
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthData {
  user: User;
  token: string;
  token_type: string;
  expires_in?: number;
}

/** Category */
export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  resources_count?: number;
}

/** Resource */
export interface Resource {
  id: number;
  title: string;
  slug?: string;
  category_id?: number;
  authors?: string;
  authors_affiliation?: string;
  publisher?: string;
  date_of_publication?: string;
  year_of_publication?: number | string;
  issn_isbn_doi?: string;
  edition?: string;
  volume?: string;
  issue?: string;
  abstract?: string;
  references?: string;
  tags?: string;
  pages?: string;
  cover_image?: string | null;
  is_restricted?: boolean;
  view_count?: number;
  file?: string;
  file_accessible?: boolean;
  can_fetch_file?: boolean;
  file_available?: boolean;
}

/** FAQ */
export interface Faq {
  id: number;
  question: string;
  answer: string;
  order?: number;
}

/** Bill Tracker */
export interface Bill {
  id: string;
  number?: string;
  title: string;
  summary?: string;
  introduced?: string;
  status?: string;
  lastUpdated?: string;
  tags?: string[];
  sponsorName?: string;
  sponsorExternalId?: string;
  source?: string;
  firstReading?: string;
  secondReading?: string;
  thirdReading?: string;
  dateReportLaid?: string;
  billFile?: string;
  externalId?: string;
}

export interface Member {
  id: string;
  assemblyId?: string;
  name: string;
  party?: string;
  district?: string;
  state?: string;
  constituency?: string;
  chamber?: string;
  position?: string;
  gender?: string;
  isActive?: boolean;
  biography?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

export interface Assembly {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string | null;
  status?: string;
}

/** News (WordPress post) */
export interface NewsPost {
  id: number;
  type?: string;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  link?: string;
  date?: string;
  modified?: string;
  author?: string;
  featured_image?: string | null;
  categories?: unknown[];
  tags?: unknown[];
}

/** Search */
export interface SearchResults {
  categories: Category[];
  resources: Resource[];
  faqs: Faq[];
  bill_tracker?: {
    bills: Bill[];
    members: Member[];
    assemblies: Assembly[];
  };
  wordpress?: {
    news: NewsPost[];
    pages?: NewsPost[];
  };
}

export interface SearchResponse {
  success: boolean;
  query: string;
  type?: string;
  results: SearchResults;
  total_count: number;
  counts?: Record<string, number>;
}
