import { Component, ChangeDetectionStrategy, effect, input, output, viewChild, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';

import { Budget, BudgetRecord } from '@app/model/finance/planning/budgets';

import { ShareBudgetModalComponent } from '../share-budget-modal/share-budget-modal.component';
import { CreateBudgetModalComponent } from '../create-budget-modal/create-budget-modal.component';
import { ChildBudgetsModalComponent } from '../../modals/child-budgets-modal/child-budgets-modal.component';

export interface BudgetWithMeta extends Budget {
  endYear: number;
}

export interface BudgetViewModel {
  overview: BudgetRecord[];
  budgets: BudgetWithMeta[]; 
}

@Component({
  selector: 'app-budget-table',
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetTableComponent {
  
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);

  readonly budgets = input.required<BudgetViewModel>(); 
  readonly canPromote = input(false);

  readonly doPromote = output<void>();

  readonly dataSource = new MatTableDataSource<BudgetWithMeta>();
  
  readonly displayedColumns: string[] = ['name', 'status', 'startYear', 'duration', 'actions'];

  private _overviewBudgets: BudgetRecord[] = [];

  readonly paginator = viewChild(MatPaginator);
  readonly sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const data = this.budgets();
      
      this._overviewBudgets = data.overview;
      
      this.dataSource.data = data.budgets;
    });

    effect(() => {
      const p = this.paginator();
      const s = this.sort();
      
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });
  }

  filterAccountRecords(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  promote() {
    if (this.canPromote()) {
      this.doPromote.emit();
    }
  }

  openShareBudgetDialog(parent: Budget | false): void {
    this._dialog.open(ShareBudgetModalComponent, {
      panelClass: 'no-pad-dialog',
      width: '600px',
      data: parent ? parent : false
    });
  }

  openCloneBudgetDialog(parent: Budget | false): void {
    this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ? parent : false
    });
  }

  openChildBudgetDialog(parent: Budget): void { 
    const parentRecord = this._overviewBudgets.find(b => b.budget.id === parent.id);
    
    const children = parentRecord?.children?.map(c => c.budget) || [];

    this._dialog.open(ChildBudgetsModalComponent, {
      height: 'fit-content',
      minWidth: '600px',
      data: { parent: parent, budgets: children }
    });
  }

  goToDetail(budgetId: string | undefined, action: string) {
    if (!budgetId) return;
    this._router.navigate(['budgets', budgetId, action]).then(() => this._dialog.closeAll());
  }

  deleteBudget(budget: Budget) {
    // Implementation
  }

  translateStatus(status: number): string {
    switch (status) {
      case 1: return 'BUDGET.STATUS.ACTIVE';
      case 0: return 'BUDGET.STATUS.DESIGN';
      case 9: return 'BUDGET.STATUS.NO-USE';
      case -1: return 'BUDGET.STATUS.DELETED';
      default: return '';
    }
  }

  access(requested: 'view' | 'clone' | 'edit'): boolean {  
    switch (requested) {
      case 'view':
      case 'clone':
        return true; 
      case 'edit':
        return true; 
      default:
        return false;
    }
  }
}