import { FunctionHandler, FunctionContext } from '@ngfi/functions';
import { HandlerTools } from '@iote/cqrs'; 
import { AddNoteToBudgetCommand } from './add-note.command';

export interface ICommandHandler<TCommand> {
  execute(command: TCommand): Promise<void>;
}

export interface AddNoteToBudgetResult {
  success: boolean;
  id?: string;
}

export interface BudgetNotePayload {
  budgetId: string;
  content: string;
  createdAt: Date;
}

export interface BudgetNotesRepository {
  addNote(note: BudgetNotePayload): Promise<void>;
}

export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult> {
  
  async execute(
    command: AddNoteToBudgetCommand, 
    context: FunctionContext, 
    tools: HandlerTools 
  ): Promise<AddNoteToBudgetResult> {
    
    if (!command.content || command.content.trim().length === 0) {
      throw new Error('Validation Error: Note content cannot be empty.');
    }

    if (!command.budgetId) {
      throw new Error('Validation Error: Budget ID is required.');
    }

    const repository = tools.getRepository('budget-notes') as unknown as BudgetNotesRepository;
    
    await repository.addNote({
      budgetId: command.budgetId,
      content: command.content,
      createdAt: new Date()
    });

    return { success: true };
  }
}