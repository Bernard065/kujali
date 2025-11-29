import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';
import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';

interface BudgetWithMeta extends Budget {
  endYear: number;
}

interface AllBudgetsData {
  overview: BudgetRecord[];
  budgets: BudgetWithMeta[];
}

const INITIAL_OVERVIEW: OrgBudgetsOverview = {
  inUse: [],
  underConstruction: [],
  archived: []
};

@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: ['./select-budget.component.scss', 
              '../../components/budget-view-styles.scss'],
})
export class SelectBudgetPageComponent implements OnInit
{
  private readonly _orgBudgetsStore = inject(OrgBudgetsStore);
  private readonly _budgetsStore = inject(BudgetsStore);
  private readonly _dialog = inject(MatDialog);
  private readonly _logger = inject(Logger);

  readonly overview = toSignal(this._orgBudgetsStore.get(), { 
    initialValue: INITIAL_OVERVIEW 
  });
  
  readonly sharedBudgets = toSignal(this._budgetsStore.get(), { 
    initialValue: [] as Budget[] 
  });

  readonly allBudgets = computed<AllBudgetsData>(() => {
    const overview = this.overview();
    const budgets = this.sharedBudgets();
    
    const flattenedOverview = __flatMap(overview) as BudgetRecord[];
    const flattenedBudgets = __flatMap(budgets) as Budget[];
    
    const transformedBudgets: BudgetWithMeta[] = flattenedBudgets.map((budget: Budget) => {
      return {
        ...budget,
        endYear: budget.startYear + budget.duration - 1
      };
    });
    
    return {
      overview: flattenedOverview,
      budgets: transformedBudgets
    };
  });

  readonly showFilter = signal<boolean>(false);

  constructor() {
    effect(() => {
      const data = this.allBudgets();
      this._logger.log(() => `Budgets loaded: ${data.budgets.length} shared, ${data.overview.length} overview records`);
    });
  }

  ngOnInit(): void {
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
  }

  fieldsFilter(value: (budget: Budget) => boolean): void {    
  }

  toogleFilter(value: boolean): void {
    this.showFilter.set(value);
  }

  openDialog(parent: Budget | false): void 
  {
    const data = parent !== false ? parent : false;

    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: data
    });

    dialog.afterClosed().subscribe(() => {
      this._logger.log(() => 'Create Budget dialog was closed');
      });
  }

  canPromote(record: BudgetRecord): boolean {
    const budgetWithFlag = record.budget as Budget & { canBeActivated?: boolean };
    return budgetWithFlag.canBeActivated ?? false;
  }

  setActive(record: BudgetRecord): void 
  {
    const toSave = ___cloneDeep(record.budget);

    type BudgetWithTransientProps = Budget & { 
      canBeActivated?: boolean; 
      access?: object; 
    };

    const budgetToClean = toSave as BudgetWithTransientProps;

    delete budgetToClean.canBeActivated;
    delete budgetToClean.access;

    toSave.status = BudgetStatus.InUse;

    const uiRecord = record as BudgetRecord & { updating?: boolean };
    uiRecord.updating = true;
    
    this._budgetsStore.update(toSave)
      .subscribe(() => {
        uiRecord.updating = false;
        this._logger.log(() => `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`);
      });
  }
}