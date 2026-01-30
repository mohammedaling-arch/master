import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar,
    ArrowUpDown,
    Download,
    Eye,
    MoreVertical
} from 'lucide-react';

const DataTable = ({
    columns,
    data,
    loading,
    onRowClick,
    actions,
    searchPlaceholder = "Search records...",
    isMobile: isMobileProp,
    dark = false
}) => {
    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

    // Theme colors
    const theme = {
        background: dark ? 'rgb\(18 37 74\)' : '#ffffff',
        border: dark ? '#334155' : '#f1f5f9',
        headerBg: dark ? '#0f172a' : '#f8fafc',
        text: dark ? '#f1f5f9' : 'rgb\(18 37 74\)',
        mutedText: dark ? '#94a3b8' : '#778eaeff',
        inputBg: dark ? '#0f172a' : '#ffffff',
        inputBorder: dark ? '#334155' : '#e2e8f0'
    };

    useEffect(() => {
        const handleResize = () => setIsMobileInternal(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Filter columns for mobile
    const visibleColumns = useMemo(() => {
        if (!isMobile) return columns;
        return columns.filter(col => !col.hiddenMobile);
    }, [columns, isMobile]);

    // Handle Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        let result = [...data];

        // Search Filter
        if (searchTerm) {
            result = result.filter(item => {
                return Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Date Range Filter (assumes 'created_at' field exists)
        if (dateRange.start || dateRange.end) {
            result = result.filter(item => {
                const itemDate = new Date(item.created_at || item.date);
                const start = dateRange.start ? new Date(dateRange.start) : null;
                const end = dateRange.end ? new Date(dateRange.end) : null;

                if (start && itemDate < start) return false;
                if (end && itemDate > end) return false;
                return true;
            });
        }

        // Apply Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig, dateRange]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="glass-card" style={{ padding: isMobile ? '1rem' : '1.5rem', background: theme.background, border: `1px solid ${theme.border}`, boxShadow: dark ? '0 10px 15px -3px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)', color: theme.text }}>
            {/* Header / Controls */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                    />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '10px',
                            border: `1px solid ${theme.inputBorder}`,
                            background: theme.inputBg,
                            color: theme.text,
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto', overflowX: 'auto', paddingBottom: isMobile ? '0.5rem' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: theme.headerBg, padding: '0.5rem 1rem', borderRadius: '10px', border: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>
                        <Calendar size={16} color={theme.mutedText} />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            style={{ background: 'transparent', border: 'none', fontSize: '13px', color: theme.mutedText, outline: 'none' }}
                        />
                        <span style={{ color: theme.border }}>-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            style={{ background: 'transparent', border: 'none', fontSize: '13px', color: theme.mutedText, outline: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
                            {visibleColumns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: theme.mutedText,
                                        cursor: col.sortable ? 'pointer' : 'default',
                                        whiteSpace: 'nowrap',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {col.label}
                                        {col.sortable && <ArrowUpDown size={14} opacity={0.5} />}
                                    </div>
                                </th>
                            ))}
                            {actions && <th style={{ padding: '1rem' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {visibleColumns.map((_, j) => (
                                            <td key={j} style={{ padding: '1rem' }}>
                                                <div style={{ height: '1.25rem', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                            </td>
                                        ))}
                                        {actions && <td style={{ padding: '1rem' }}><div style={{ height: '1.25rem', width: '20px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td>}
                                    </tr>
                                ))
                            ) : currentData.length > 0 ? (
                                currentData.map((row, idx) => (
                                    <motion.tr
                                        key={row.id || idx}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => onRowClick && onRowClick(row)}
                                        style={{
                                            borderBottom: `1px solid ${theme.border}`,
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            transition: 'background 0.2s',
                                            color: theme.text
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = theme.headerBg}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {visibleColumns.map((col) => (
                                            <td key={col.key} style={{ padding: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '12px' : '14px', color: 'inherit' }}>
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {actions(row)}
                                            </td>
                                        )}
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!loading && filteredData.length > itemsPerPage && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${theme.border}`
                }}>
                    <span style={{ fontSize: '13px', color: theme.mutedText }}>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                background: currentPage === 1 ? theme.headerBg : theme.inputBg,
                                color: currentPage === 1 ? (dark ? '#334155' : '#cbd5e1') : theme.mutedText,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                background: currentPage === totalPages ? theme.headerBg : theme.inputBg,
                                color: currentPage === totalPages ? (dark ? '#334155' : '#cbd5e1') : theme.mutedText,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default DataTable;
