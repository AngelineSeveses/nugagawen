import { useCopy } from '@/localization';
import type { Budget } from '@/types';
import { ChoiceGroup, type ChoiceOption } from './choice-group';

const BUDGETS: Budget[] = ['thrifty', 'moderate', 'splurge'];

interface BudgetSelectorProps {
  label: string;
  value: Budget;
  onChange: (value: Budget) => void;
}

/** How much to spend per person: three tiles with a peso range on each. */
export function BudgetSelector({ label, value, onChange }: BudgetSelectorProps) {
  const copy = useCopy();
  const options: ChoiceOption<Budget>[] = BUDGETS.map((budget) => {
    const { label: name, symbol, range, a11y } = copy.budget[budget];
    // Screen readers would read "₱₱" as "peso sign peso sign", so they get words instead.
    return { value: budget, label: name, prefix: symbol, detail: range, accessibilityLabel: a11y };
  });
  return <ChoiceGroup label={label} options={options} value={value} onChange={onChange} minLabelWidth={72} />;
}
