import { IObject } from '@iote/bricks';
import { Repository } from '@iote/cqrs';

export interface ICommandHandler<TCommand> {
  execute(command: TCommand): Promise<void>;
}

export interface AddNoteToBudgetResult {
  success: boolean;
  id?: string;
}

export interface BudgetNotePayload extends IObject {
  budgetId: string;
  content: string;
  createdAt: Date;
  authorId?: string;
}

export interface BudgetNotesRepository extends Repository<BudgetNotePayload> {
  addNote(note: BudgetNotePayload): Promise<void>;
}