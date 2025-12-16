export default function MandoStudentsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-56 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 w-80 bg-slate-100 rounded animate-pulse mt-2"></div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Loading meal entry data...</p>
                <p className="text-slate-400 text-sm mt-1">Preparing student meal records</p>
            </div>
        </div>
    )
}
