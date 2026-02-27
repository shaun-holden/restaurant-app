import { formatCurrency } from '../../utils/formatCurrency';

// Renders one option group (e.g. "Size" or "Add-ons").
// group.required + !group.multiSelect → radio buttons (must pick exactly one)
// group.required + group.multiSelect → checkboxes (must pick at least one)
// !group.required + group.multiSelect → optional checkboxes
//
// selectedChoices = array of currently selected choice objects
// onToggle = function(choice) — add or remove a choice from selection

export default function OptionGroupSelector({ group, selectedChoices, onToggle }) {
  const selectedIds = new Set(selectedChoices.map(c => c.id));

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-gray-800">{group.name}</h4>
        {group.required ? (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
        )}
        {group.multiSelect && (
          <span className="text-xs text-gray-400">Choose any</span>
        )}
      </div>

      <div className="space-y-2">
        {group.choices.map(choice => {
          const isSelected = selectedIds.has(choice.id);
          const inputType = group.multiSelect ? 'checkbox' : 'radio';

          return (
            <label
              key={choice.id}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type={inputType}
                  name={group.id} // radio buttons with same name are mutually exclusive
                  checked={isSelected}
                  onChange={() => onToggle(choice, group.multiSelect)}
                  className="accent-orange-500"
                />
                <span className="text-sm text-gray-800">{choice.label}</span>
              </div>
              {parseFloat(choice.priceModifier) !== 0 && (
                <span className="text-sm text-gray-500">
                  +{formatCurrency(choice.priceModifier)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
