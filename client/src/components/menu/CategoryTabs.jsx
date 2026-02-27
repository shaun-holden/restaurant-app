// Renders a scrollable row of category filter tabs.
// selectedId = currently active category (null = "All")
// onSelect = callback when user clicks a tab
export default function CategoryTabs({ categories, selectedId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedId === null
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-600 border hover:bg-gray-50'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedId === cat.id
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 border hover:bg-gray-50'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
