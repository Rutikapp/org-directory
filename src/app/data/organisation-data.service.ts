import { Injectable } from '@angular/core';
import { Observable, switchMap, throwError, timer } from 'rxjs';
import { ORGANISATION_FIXTURE } from './organisations.fixture';
import { Organisation, OrganisationListRequest, OrganisationListResponse, OrganisationStatus, RawOrganisation } from '../models/organisation';

const PAGE_SIZE = 25;
const REQUESTS_PER_MINUTE = 5;

export function normaliseOrganisation(raw: RawOrganisation, index: number): Organisation {
  const owner = typeof raw.owner === 'object' && raw.owner !== null ? raw.owner as Record<string, unknown> : null;
  const rawId = Number(raw.id);
  const id = Number.isFinite(rawId) ? rawId : index + 1;
  const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
  const statusValue = typeof raw.status === 'string' ? raw.status.toLowerCase() : '';
  const status: OrganisationStatus = statusValue === 'active' || statusValue === 'inactive' || statusValue === 'suspended' ? statusValue : 'unknown';
  const memberCountValue = typeof raw.memberCount === 'string' && raw.memberCount.trim() !== '' ? Number(raw.memberCount) : raw.memberCount;
  const memberCount = typeof memberCountValue === 'number' && Number.isFinite(memberCountValue) && memberCountValue >= 0 ? memberCountValue : 0;
  const dateValue = typeof raw.createdAt === 'string' && raw.createdAt.trim() !== '' ? Date.parse(raw.createdAt) : raw.createdAt;
  const createdAt = typeof dateValue === 'number' && Number.isFinite(dateValue) && dateValue > 0 ? dateValue : null;
  const email = owner?.['email'];

  return {
    key: `${id}-${index}`,
    id,
    name: rawName || null,
    status,
    memberCount,
    ownerEmail: typeof email === 'string' && email.trim() !== '' ? email : null,
    createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class OrganisationDataService {
  private rows: RawOrganisation[] = [...ORGANISATION_FIXTURE];
  private readonly requestTimes: number[] = [];
  private nextId = Math.max(...this.rows.map((row) => Number(row.id) || 0)) + 1;

  list(request: OrganisationListRequest): Observable<OrganisationListResponse> {
    const delayMs = 400 + Math.floor(Math.random() * 501);
    return timer(delayMs).pipe(switchMap(() => {
      const now = Date.now();
      while (this.requestTimes.length > 0 && now - (this.requestTimes[0] ?? now) >= 60_000) this.requestTimes.shift();
      if (this.requestTimes.length >= REQUESTS_PER_MINUTE) return throwError(() => new Error('rate-limited'));
      this.requestTimes.push(now);
      if (Math.random() < 0.15) return throwError(() => new Error('temporary-list-failure'));
      return [this.snapshot(request)];
    }));
  }

  snapshot(request: OrganisationListRequest): OrganisationListResponse {
    const query = request.query.trim().toLocaleLowerCase();
    const rows = this.rows.map(normaliseOrganisation).filter((row) => {
      const matchesQuery = !query || (row.name ?? '').toLocaleLowerCase().includes(query);
      const matchesStatus = request.status === 'all' || row.status === request.status;
      return matchesQuery && matchesStatus;
    });
    rows.sort((a, b) => {
      let comparison = 0;
      if (request.sort === 'name') comparison = (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
      else comparison = (a.createdAt ?? Number.NEGATIVE_INFINITY) - (b.createdAt ?? Number.NEGATIVE_INFINITY);
      return comparison * (request.direction === 'asc' ? 1 : -1);
    });
    const start = Math.max(0, request.page - 1) * PAGE_SIZE;
    return { items: rows.slice(start, start + PAGE_SIZE), total: rows.length };
  }

  create(values: { name: string; status: OrganisationStatus; ownerEmail: string; memberCount: number }): Organisation {
    const raw: RawOrganisation = {
      id: this.nextId++,
      name: values.name.trim(),
      status: values.status,
      memberCount: values.memberCount,
      owner: { email: values.ownerEmail.trim() },
      createdAt: new Date().toISOString(),
    };
    this.rows = [raw, ...this.rows];
    return normaliseOrganisation(raw, -this.nextId);
  }

  hasName(name: string): boolean {
    const candidate = name.trim().toLocaleLowerCase();
    return candidate.length > 0 && this.rows.some((row) => typeof row.name === 'string' && row.name.trim().toLocaleLowerCase() === candidate);
  }
}
