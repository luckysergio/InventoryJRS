import { Fragment } from "react";
import { cn } from "../../../../lib/utils";

const TopListCard = ({ title, icon, items, renderItem, emptyMessage }) => {
  return (
    <div className="bg-white rounded-2xl border border-blue-100/60 p-5 shadow-sm shadow-blue-100/40 hover:shadow-lg hover:shadow-blue-100/60 transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-3 border-b border-blue-50">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-lg blur-md opacity-30" />
          <div className="relative p-2 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg shadow-md shadow-blue-200">
            <span className="text-white">{icon}</span>
          </div>
        </div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>

      {/* Content */}
      {!items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
            {icon}
          </div>
          <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-blue-50/50">
          {items.map((item, index) => (
            <Fragment key={item.id || `item-${index}`}>
              {renderItem(item, index)}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopListCard;