import React, { useEffect, useState } from 'react';
import {
    Search, ChevronUp, ChevronDown, ChevronsUpDown,
    Download, Filter, ArrowLeft, ArrowRight
} from 'lucide-react';

const SpendTableView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('amount');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const perPage = 50;

    useEffect(() => {
        fetchTableData();
    }, [currentPage, sortBy, sortOrder, searchTerm]);

    const fetchTableData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
                sort_by: sortBy,
                sort_order: sortOrder,
                search: searchTerm
            });

            const res = await fetch(`/api/spend-analysis/table?${params}`);
            if (!res.ok) throw new Error('Failed to fetch table data');
            const json = await res.json();

            setData(json.records);
            setTotalPages(json.pages);
            setTotalRecords(json.total);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const exportToCSV = () => {
        if (data.length === 0) return;

        const headers = [
            'PO Number', 'Vendor Name', 'Item Description', 'Enriched Description', 'Operating Unit',
            'Quantity', 'Amount (INR)', 'PO Date', 'Buyer Name', 'Currency'
        ];

        const csvData = data.map(row => [
            row.po_number || '',
            row.vendor_name || '',
            row.item_description || '',
            row.enriched_description || '',
            row.operating_unit || '',
            row.quantity || 0,
            row.amount || 0,
            row.po_date || '',
            row.buyer_name || '',
            row.currency_code || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spend_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ChevronsUpDown className="w-4 h-4 text-slate-500" />;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-4 h-4 text-cyan-400" />
            : <ChevronDown className="w-4 h-4 text-cyan-400" />;
    };

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-400">
                Error loading data: {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by vendor, item, PO number..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                </div>

                {/* Export Button */}
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Results Info */}
            <div className="text-sm text-slate-400">
                Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalRecords)} of {totalRecords.toLocaleString()} records
            </div>

            {/* Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('po_number')}
                                >
                                    <div className="flex items-center gap-2">
                                        PO Number
                                        <SortIcon column="po_number" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('vendor_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Vendor
                                        <SortIcon column="vendor_name" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('item_description')}
                                >
                                    <div className="flex items-center gap-2">
                                        Item Description
                                        <SortIcon column="item_description" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('enriched_description')}
                                >
                                    <div className="flex items-center gap-2">
                                        Enriched Desc
                                        <SortIcon column="enriched_description" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('operating_unit')}
                                >
                                    <div className="flex items-center gap-2">
                                        Operating Unit
                                        <SortIcon column="operating_unit" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Quantity
                                        <SortIcon column="quantity" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Amount
                                        <SortIcon column="amount" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort('po_date')}
                                >
                                    <div className="flex items-center gap-2">
                                        PO Date
                                        <SortIcon column="po_date" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Buyer
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    className="hover:bg-slate-700/30 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                                        {row.po_number || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-200 font-medium">
                                        {row.vendor_name || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate" title={row.item_description}>
                                        {row.item_description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-cyan-400 font-medium max-w-[200px] truncate" title={row.enriched_description}>
                                        {row.enriched_description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {row.operating_unit || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300 text-right font-mono">
                                        {row.quantity ? row.quantity.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-cyan-400 text-right font-semibold">
                                        {formatCurrency(row.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {row.po_date || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {row.buyer_name || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
                <div className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg border border-slate-700 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === pageNum
                                        ? 'bg-cyan-600 text-white font-semibold'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg border border-slate-700 transition-colors text-sm"
                    >
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpendTableView;
