import MenuItemCard from './MenuItemCard';
import EmptyState from '../common/EmptyState';

export default function MenuGrid({ items }) {
  if (items.length === 0) {
    return <EmptyState title="No items found" description="Try a different category or search term." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(item => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
