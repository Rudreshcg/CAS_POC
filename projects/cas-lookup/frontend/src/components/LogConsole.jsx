import React, { useEffect, useRef } from 'react';

export default function LogConsole({ logs }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (logs.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs shadow-inner mt-6">
            {logs.map((log, i) => (
                <div key={i} className={`mb-1 border-b border-slate-800 pb-1 ${log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                            log.type === 'success' ? 'text-green-400' :
                                'text-slate-400'
                    }`}>
                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                    {log.message}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
