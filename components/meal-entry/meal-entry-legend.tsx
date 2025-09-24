export function MealEntryLegend() {
  return (
    <div className="flex items-center space-x-6 p-4 bg-slate-50 rounded-lg border">
      <div className="text-sm font-medium text-slate-700">Meal Codes:</div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-slate-600">B - Breakfast</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-slate-600">L - Lunch</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-slate-600">D - Dinner</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span className="text-sm text-slate-600">- - No meal</span>
        </div>
      </div>
    </div>
  )
}