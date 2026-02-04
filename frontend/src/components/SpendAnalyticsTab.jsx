export default function SpendAnalyticsTab() {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
            <div className="text-blue-500/50 mb-4">
                {/* PieChart icon would be here */}
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-300">Spend Analytics</h2>
            <p className="text-slate-500 mt-2">Analyze spending patterns and opportunities.</p>
            <span className="mt-4 px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">Coming Soon</span>
        </div>
    );
}
