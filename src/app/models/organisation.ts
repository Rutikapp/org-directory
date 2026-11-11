export type OrganisationStatus = 'active' | 'inactive' | 'suspended' | 'unknown';

export interface RawOrganisation {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  memberCount?: unknown;
  owner?: unknown;
  createdAt?: unknown;
}

export interface Organisation {
  /** Stable row identity; source IDs are not unique in the supplied fixture. */
  key: string;
  id: number;
  name: string | null;
  status: OrganisationStatus;
  memberCount: number;
  ownerEmail: string | null;
  createdAt: number | null;
}

export type StatusFilter = OrganisationStatus | 'all';
export type SortField = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface OrganisationListRequest {
  page: number;
  query: string;
  status: StatusFilter;
  sort: SortField;
  direction: SortDirection;
}

export interface OrganisationListResponse {
  items: Organisation[];
  total: number;
}
