import { FunctionHandler, FunctionContext } from '@ngfi/functions';
import { HandlerTools } from '@iote/cqrs'; 
import { AddNoteToBudgetCommand } from './add-note.command';
import { 
  AddNoteToBudgetResult, 
  BudgetNotesRepository 
} from './add-note.interface';

export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult> {
  
  async execute(
    command: AddNoteToBudgetCommand, 
    context: FunctionContext, 
    tools: HandlerTools 
  ): Promise<AddNoteToBudgetResult> {
    
    if (!command.content?.trim()) {
      throw new Error('Validation Error: Note content cannot be empty.');
    }

    if (!command.budgetId) {
      throw new Error('Validation Error: Budget ID is required.');
    }

    const repository = tools.getRepository('budget-notes') as BudgetNotesRepository;
    
    await repository.addNote({
      budgetId: command.budgetId,
      content: command.content,
      createdAt: new Date(),
      authorId: command.authorId 
    });

    return { success: true };
  }
}