import { RawOrganisation } from '../models/organisation';

/** Assessment seed data kept intentionally malformed exactly where supplied. */
const seed: RawOrganisation[] = [
  { id: 1, name: 'Northwind Traders', status: 'active', memberCount: 42, owner: { email: 'ops@northwind.example' }, createdAt: '2024-03-11T09:12:00Z' },
  { id: 2, name: '', status: 'ACTIVE', memberCount: '12', owner: { email: 'a@b.example' }, createdAt: 1710150720000 },
  { id: 3, name: null, status: 'Active', memberCount: -1, owner: { email: 'c@d.example' }, createdAt: '2024-01-02T00:00:00Z' },
  { id: 42, name: 'Globex Corporation', status: 'suspended', memberCount: 7, owner: { email: 'hq@globex.example' }, createdAt: '2023-11-30T14:45:10Z' },
  { id: 42, name: 'Globex Corporation Ltd', status: 'actve', memberCount: 7, owner: { email: 'hq@globex.example' }, createdAt: '2023-11-30T14:45:10Z' },
  { id: 6, name: 'شركة الأمل 🚀', status: 'active', memberCount: 3, owner: { email: 'info@amal.example' }, createdAt: '2025-06-01T08:00:00Z' },
  { id: 7, name: 'The Very Long Organisation Name That Somebody Actually Typed Into The Field Because Nobody Validated It And It Keeps Going Well Past Any Reasonable Column Width And Still Has Not Stopped', status: 'inactive', memberCount: 0, owner: { email: 'long@example.com' }, createdAt: '2024-07-19T16:20:00Z' },
  { id: 8, name: 'Initech', status: null, memberCount: null, owner: { email: 'not-an-email' }, createdAt: 'not a date' },
];

const names = ['Acme Services', 'Blue Yonder', 'Cobalt Systems', 'Dunder Mifflin', 'Evergreen Group', 'Fabrikam', 'Globex West', 'Hooli', 'Initech Labs', 'Juniper Works', 'Kestrel Partners', 'Lumon Industries'];
const statuses: unknown[] = ['active', 'inactive', 'suspended', 'ACTIVE', 'Active', 'actve', null];
const extra: RawOrganisation[] = Array.from({ length: 132 }, (_, index) => {
  const id = index + 9;
  const malformed = index % 17 === 0;
  return {
    id: index % 23 === 0 ? 42 : id,
    name: malformed ? (index % 2 === 0 ? '' : null) : `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`,
    status: statuses[index % statuses.length],
    memberCount: index % 19 === 0 ? (index % 2 === 0 ? '12' : -1) : (index * 7) % 450,
    owner: { email: index % 29 === 0 ? 'not-an-email' : `team${id}@directory.example` },
    createdAt: index % 31 === 0 ? 'not a date' : (index % 13 === 0 ? Date.UTC(2024, index % 12, 1) : new Date(Date.UTC(2023 + (index % 3), index % 12, (index % 27) + 1)).toISOString()),
  };
});

export const ORGANISATION_FIXTURE: readonly RawOrganisation[] = [...seed, ...extra];
