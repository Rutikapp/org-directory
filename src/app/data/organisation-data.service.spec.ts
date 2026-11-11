import { OrganisationDataService, normaliseOrganisation } from './organisation-data.service';
import { RawOrganisation } from '../models/organisation';

describe('normaliseOrganisation', () => {
  it('normalises malformed fixture values without losing the row', () => {
    const row = normaliseOrganisation({ id: 3, name: null, status: 'Active', memberCount: -1, createdAt: 'not a date' }, 2);
    expect(row.name).toBeNull();
    expect(row.status).toBe('active');
    expect(row.memberCount).toBe(0);
    expect(row.createdAt).toBeNull();
  });

  it('parses string counts and millisecond timestamps', () => {
    const raw: RawOrganisation = { id: 2, name: '  Example  ', status: 'ACTIVE', memberCount: '12', createdAt: 1710150720000 };
    const row = normaliseOrganisation(raw, 1);
    expect(row.name).toBe('Example');
    expect(row.memberCount).toBe(12);
    expect(row.createdAt).toBe(1710150720000);
  });

  it('maps unrecognised status and missing owner to safe values', () => {
    const row = normaliseOrganisation({ id: 9, name: '', status: 'actve', owner: { email: 'bad' } }, 8);
    expect(row.status).toBe('unknown');
    expect(row.name).toBeNull();
    expect(row.ownerEmail).toBe('bad');
  });

  it('rebuilds the selected filtered and sorted page after a new record is created', () => {
    const service = new OrganisationDataService();
    service.create({
      name: 'Northwind Renewal', status: 'active', ownerEmail: 'renewal@example.com', memberCount: 4,
    });

    const result = service.snapshot({
      page: 1, query: 'northwind', status: 'active', sort: 'name', direction: 'asc',
    });

    expect(result.total).toBe(2);
    expect(result.items.map((row) => row.name)).toEqual(['Northwind Renewal', 'Northwind Traders']);
  });
});
