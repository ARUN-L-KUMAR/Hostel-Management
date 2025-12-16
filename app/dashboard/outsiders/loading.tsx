export default function OutsidersLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 w-72 bg-slate-100 rounded animate-pulse mt-2"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>

            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Loading outsiders data...</p>
                <p className="text-slate-400 text-sm mt-1">Preparing outsider meal records</p>
            </div>
        </div>
    )
}
