import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import english from './i18n/en.json';
import { OrganisationDataService } from './data/organisation-data.service';
import { Organisation, OrganisationStatus, SortDirection, SortField, StatusFilter } from './models/organisation';

type TranslationKey = keyof typeof english;
type DirectoryStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly formBuilder = inject(FormBuilder);
  private readonly data = inject(OrganisationDataService);
  private routeSubscription?: Subscription;
  private loadSubscription?: Subscription;
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly title = signal(english.appTitle);
  readonly state = signal<DirectoryStatus>('loading');
  readonly organisations = signal<Organisation[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly query = signal('');
  readonly searchInput = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly sortField = signal<SortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly showForm = signal(false);
  readonly submitted = signal(false);
  readonly formMessage = signal<TranslationKey | null>(null);

  readonly pageSize = 25;
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly isEmpty = computed(() => this.state() === 'ready' && this.organisations().length === 0);
  readonly form = this.formBuilder.nonNullable.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(80),
      (control) => this.data.hasName(String(control.value)) ? { uniqueName: true } : null,
    ]),
    status: this.formBuilder.nonNullable.control<OrganisationStatus>('active', Validators.required),
    ownerEmail: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    memberCount: this.formBuilder.nonNullable.control(0, [Validators.min(0)]),
  });

  private readonly validStatuses: readonly StatusFilter[] = ['all', 'active', 'inactive', 'suspended', 'unknown'];
  private readonly validSortFields: readonly SortField[] = ['name', 'createdAt'];

  ngOnInit(): void {
    this.titleService.setTitle(this.t('appTitle'));
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q') ?? '';
      const requestedStatus = params.get('status') as StatusFilter | null;
      const requestedSort = params.get('sort') as SortField | null;
      const requestedDirection = params.get('direction');
      const requestedPage = Number(params.get('page'));
      this.query.set(query);
      this.searchInput.set(query);
      this.statusFilter.set(requestedStatus && this.validStatuses.includes(requestedStatus) ? requestedStatus : 'all');
      this.sortField.set(requestedSort && this.validSortFields.includes(requestedSort) ? requestedSort : 'createdAt');
      this.sortDirection.set(requestedDirection === 'asc' ? 'asc' : 'desc');
      this.page.set(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  t(key: TranslationKey): string {
    return english[key];
  }

  recordCountLabel(): string {
    return this.t('recordCount').replace('{{count}}', new Intl.NumberFormat().format(this.total()));
  }

  onSearch(value: string): void {
    this.searchInput.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.updateUrl({ q: value || null, page: null }), 300);
  }

  onStatusChange(value: string): void {
    const status = this.validStatuses.find((candidate) => candidate === value) ?? 'all';
    this.updateUrl({ status: status === 'all' ? null : status, page: null });
  }

  onSortChange(value: string): void {
    if (value !== 'name' && value !== 'createdAt') return;
    this.updateUrl({ sort: value, page: null });
  }

  onDirectionChange(value: string): void {
    this.updateUrl({ direction: value === 'asc' ? 'asc' : 'desc', page: null });
  }

  movePage(page: number): void {
    this.updateUrl({ page: page > 1 ? page : null });
  }

  retry(): void {
    this.load();
  }

  openForm(): void {
    this.formMessage.set(null);
    this.showForm.set(true);
    this.form.controls.name.updateValueAndValidity();
  }

  closeForm(): void {
    this.showForm.set(false);
    this.submitted.set(false);
    this.formMessage.set(null);
    this.form.reset({ name: '', status: 'active', ownerEmail: '', memberCount: 0 });
  }

  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  createOrganisation(): void {
    this.submitted.set(true);
    this.formMessage.set(null);
    this.form.controls.name.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formMessage.set('formErrorTitle');
      return;
    }

    const value = this.form.getRawValue();
    this.data.create({
      name: value.name,
      status: value.status,
      ownerEmail: value.ownerEmail,
      memberCount: value.memberCount,
    });
    const snapshot = this.data.snapshot({
      page: this.page(), query: this.query(), status: this.statusFilter(),
      sort: this.sortField(), direction: this.sortDirection(),
    });
    this.organisations.set(snapshot.items);
    this.total.set(snapshot.total);
    this.formMessage.set('createSuccess');
    this.form.reset({ name: '', status: 'active', ownerEmail: '', memberCount: 0 });
    this.submitted.set(false);
  }

  statusText(status: OrganisationStatus): string {
    const keys: Record<OrganisationStatus, TranslationKey> = {
      active: 'statusActive', inactive: 'statusInactive', suspended: 'statusSuspended', unknown: 'statusUnknown',
    };
    return this.t(keys[status]);
  }

  private updateUrl(params: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private load(): void {
    this.loadSubscription?.unsubscribe();
    this.state.set('loading');
    this.loadSubscription = this.data.list({
      page: this.page(), query: this.query(), status: this.statusFilter(),
      sort: this.sortField(), direction: this.sortDirection(),
    }).subscribe({
      next: (response) => {
        this.organisations.set(response.items);
        this.total.set(response.total);
        this.state.set('ready');
      },
      error: () => {
        this.organisations.set([]);
        this.state.set('error');
      },
    });
  }
}
