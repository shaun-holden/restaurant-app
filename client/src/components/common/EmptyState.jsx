export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-4xl mb-4">🍽️</p>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
