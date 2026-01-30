import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Plus, X, Send, Clock, CheckCircle, AlertCircle,
    Filter, Search, Loader2, User, Calendar, Tag, AlertTriangle
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import { useModal } from '../../context/ModalContext';

const SupportTickets = ({ user, isMobile, isStaff = false }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { showModal } = useModal();

    useEffect(() => {
        fetchTickets();
    }, [filterStatus, filterCategory]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (filterCategory) params.append('category', filterCategory);

            const res = await api.get(`/support/tickets?${params.toString()}`);
            setTickets(res.data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to load support tickets' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
            case 'in_progress': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
            case 'resolved': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
            case 'closed': return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
            default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return { bg: '#fee2e2', text: '#991b1b' };
            case 'high': return { bg: '#fed7aa', text: '#9a3412' };
            case 'medium': return { bg: '#fef3c7', text: '#92400e' };
            case 'low': return { bg: '#e0e7ff', text: '#3730a3' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (selectedTicket) {
        return <TicketDetails
            ticketId={selectedTicket}
            onBack={() => { setSelectedTicket(null); fetchTickets(); }}
            isStaff={isStaff}
            user={user}
            isMobile={isMobile}
        />;
    }

    if (showNewTicket) {
        return <NewTicketForm
            onClose={() => setShowNewTicket(false)}
            onSuccess={() => { setShowNewTicket(false); fetchTickets(); }}
            isMobile={isMobile}
        />;
    }

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: 0, color: 'rgb\(18 37 74\)' }}>Support Tickets</h2>
                    <p style={{ color: '#778eaeff', fontSize: '14px', margin: '0.5rem 0 0' }}>Get help with affidavits, probate, and more</p>
                </div>
                <button
                    onClick={() => setShowNewTicket(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    <Plus size={18} /> New Ticket
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        minWidth: '150px'
                    }}
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        minWidth: '150px'
                    }}
                >
                    <option value="">All Categories</option>
                    <option value="affidavit">Affidavit</option>
                    <option value="probate">Probate</option>
                    <option value="payment">Payment</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} />
                    <p style={{ color: '#778eaeff', marginTop: '1rem' }}>Loading tickets...</p>
                </div>
            ) : filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px' }}>
                    <MessageSquare size={48} style={{ margin: '0 auto', color: '#cbd5e1' }} />
                    <p style={{ color: '#778eaeff', marginTop: '1rem' }}>No support tickets found</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredTickets.map((ticket) => {
                        const statusStyle = getStatusColor(ticket.status);
                        const priorityStyle = getPriorityColor(ticket.priority);

                        return (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedTicket(ticket.id)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                whileHover={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>{ticket.ticket_number}</span>
                                            <span
                                                style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    background: statusStyle.bg,
                                                    color: statusStyle.text,
                                                    border: `1px solid ${statusStyle.border}`
                                                }}
                                            >
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                            <span
                                                style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    background: priorityStyle.bg,
                                                    color: priorityStyle.text
                                                }}
                                            >
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'rgb\(18 37 74\)' }}>{ticket.subject}</h3>
                                        <p style={{ margin: 0, color: '#778eaeff', fontSize: '13px', lineHeight: '1.5' }}>
                                            {ticket.description.substring(0, 150)}{ticket.description.length > 150 ? '...' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Tag size={14} /> {ticket.category}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={14} /> {formatDate(ticket.created_at)}
                                        </span>
                                    </div>
                                    {ticket.assigned_name && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', textTransform: 'capitalize' }}>
                                            <User size={14} /> Assigned to: {ticket.assigned_name}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// New Ticket Form Component
const NewTicketForm = ({ onClose, onSuccess, isMobile }) => {
    const [formData, setFormData] = useState({
        subject: '',
        category: 'technical',
        priority: 'medium',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { showModal } = useModal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/support/tickets', formData);
            showModal({ type: 'success', title: 'Success', message: 'Support ticket created successfully' });
            onSuccess();
        } catch (error) {
            console.error('Failed to create ticket:', error);
            showModal({ type: 'error', title: 'Error', message: error.response?.data?.error || 'Failed to create ticket' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '800px', margin: '0 auto' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: 0, color: 'rgb\(18 37 74\)' }}>New Support Ticket</h2>
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.5rem',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px' }}>
                        Subject *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px' }}>
                            Category *
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        >
                            <option value="affidavit">Affidavit</option>
                            <option value="probate">Probate</option>
                            <option value="payment">Payment</option>
                            <option value="technical">Technical</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px' }}>
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px' }}>
                        Description *
                    </label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide detailed information about your issue..."
                        rows={6}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#778eaeff'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                        {submitting ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// Ticket Details Component
const TicketDetails = ({ ticketId, onBack, isStaff, user, isMobile }) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [assigning, setAssigning] = useState(false);
    const { showModal } = useModal();

    useEffect(() => {
        fetchTicketDetails();
        if (isStaff) {
            fetchStaffList();
        }
    }, [ticketId, isStaff]);

    const fetchStaffList = async () => {
        try {
            const res = await api.get('/support/staff-list');
            setStaffList(res.data);
        } catch (error) {
            console.error('Failed to fetch staff list:', error);
        }
    };

    const fetchTicketDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/support/tickets/${ticketId}`);
            setTicket(res.data);
        } catch (error) {
            console.error('Failed to fetch ticket details:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to load ticket details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await api.post(`/support/tickets/${ticketId}/messages`, { message: newMessage });
            setNewMessage('');
            fetchTicketDetails();
        } catch (error) {
            console.error('Failed to send message:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to send message' });
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (status, resolution = '') => {
        try {
            await api.put(`/support/tickets/${ticketId}/status`, { status, resolution });
            showModal({ type: 'success', title: 'Success', message: 'Ticket status updated' });
            fetchTicketDetails();
        } catch (error) {
            console.error('Failed to update status:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to update ticket status' });
        }
    };

    const handleAssignTicket = async () => {
        if (!selectedStaff) {
            showModal({ type: 'error', title: 'Error', message: 'Please select a staff member' });
            return;
        }

        setAssigning(true);
        try {
            await api.put(`/support/tickets/${ticketId}/status`, {
                status: ticket.status,
                assignedTo: selectedStaff === 'unassign' ? null : parseInt(selectedStaff)
            });
            showModal({ type: 'success', title: 'Success', message: 'Ticket assigned successfully' });
            setShowAssignModal(false);
            setSelectedStaff('');
            fetchTicketDetails();
        } catch (error) {
            console.error('Failed to assign ticket:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to assign ticket' });
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} />
                <p style={{ color: '#778eaeff', marginTop: '1rem' }}>Loading ticket details...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto' }} />
                <p style={{ color: '#778eaeff', marginTop: '1rem' }}>Ticket not found</p>
                <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Go Back
                </button>
            </div>
        );
    }

    const statusStyle = getStatusColor(ticket.status);
    const priorityStyle = getPriorityColor(ticket.priority);

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#778eaeff'
                }}
            >
                ← Back to Tickets
            </button>

            <div style={{ background: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>{ticket.ticket_number}</span>
                            <span
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background: statusStyle.bg,
                                    color: statusStyle.text,
                                    border: `1px solid ${statusStyle.border}`
                                }}
                            >
                                {ticket.status.replace('_', ' ')}
                            </span>
                            <span
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background: priorityStyle.bg,
                                    color: priorityStyle.text
                                }}
                            >
                                {ticket.priority}
                            </span>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#778eaeff' }}>
                                {ticket.category}
                            </span>
                        </div>
                        <h2 style={{ margin: '0 0 1rem', fontSize: isMobile ? '1.25rem' : '1.5rem', color: 'rgb\(18 37 74\)' }}>{ticket.subject}</h2>
                        <p style={{ margin: 0, color: '#778eaeff', fontSize: '14px', lineHeight: '1.6' }}>{ticket.description}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                        <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Created</span>
                        <span style={{ color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{formatDate(ticket.created_at)}</span>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Last Updated</span>
                        <span style={{ color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{formatDate(ticket.updated_at)}</span>
                    </div>
                    {ticket.assigned_name && (
                        <div>
                            <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Assigned To</span>
                            <span style={{ color: 'rgb\(18 37 74\)', fontWeight: '600', textTransform: 'capitalize' }}>{ticket.assigned_name}</span>
                        </div>
                    )}
                </div>

                {isStaff && ticket.status !== 'closed' && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {ticket.status === 'open' && (
                            <button
                                onClick={() => handleUpdateStatus('in_progress')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Mark as In Progress
                            </button>
                        )}
                        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                            <button
                                onClick={() => {
                                    const resolution = prompt('Enter resolution notes:');
                                    if (resolution) handleUpdateStatus('resolved', resolution);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Mark as Resolved
                            </button>
                        )}
                        {ticket.status === 'resolved' && (
                            <button
                                onClick={() => handleUpdateStatus('closed')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close Ticket
                            </button>
                        )}
                        {/* Admin Assignment Controls */}
                        {isStaff && user?.role === 'admin' && (
                            <button
                                onClick={() => {
                                    setSelectedStaff(ticket.assigned_to || '');
                                    setShowAssignModal(true);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                <User size={14} />
                                {ticket.assigned_to ? 'Change Assignee' : 'Assign to Staff'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    >
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'rgb\(18 37 74\)' }}>
                            {ticket.assigned_to ? 'Reassign Ticket' : 'Assign Ticket'}
                        </h3>
                        <p style={{ color: '#778eaeff', marginBottom: '1.5rem', fontSize: '14px' }}>
                            Override system auto-assignment or select a specific role:
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#778eaeff', marginBottom: '0.4rem' }}>Filter by Role:</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => {
                                    setSelectedRole(e.target.value);
                                    setSelectedStaff('');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '13px'
                                }}
                            >
                                <option value="all">All Active Staff</option>
                                <option value="admin">Administrator</option>
                                <option value="jurat">Jurat Officer</option>
                                <option value="pr">Probate Registrar</option>
                                <option value="cr">Chief Registrar</option>
                                <option value="cfo">Commissioner for Oaths</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#778eaeff', marginBottom: '0.4rem' }}>Select Staff Member:</label>
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">-- Choose Staff Member --</option>
                                {staffList
                                    .filter(staff => selectedRole === 'all' || staff.role === selectedRole)
                                    .map(staff => (
                                        <option key={staff.id} value={staff.id} style={{ textTransform: 'capitalize' }}>
                                            {staff.name} ({staff.role.toUpperCase()})
                                        </option>
                                    ))}
                                {ticket.assigned_to && (
                                    <optgroup label="Actions">
                                        <option value="unassign">❌ Unassign / Return to Queue</option>
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedStaff('');
                                }}
                                style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignTicket}
                                disabled={assigning || !selectedStaff}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: assigning || !selectedStaff ? '#94a3b8' : '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: assigning || !selectedStaff ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {assigning && <Loader2 className="animate-spin" size={16} />}
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Messages */}
            <div style={{ background: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'rgb\(18 37 74\)' }}>Conversation</h3>

                <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {ticket.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map((msg, index) => (
                            <div
                                key={msg.id}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    background: msg.sender_type === 'staff' ? '#eff6ff' : '#f8fafc',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${msg.sender_type === 'staff' ? '#3b82f6' : '#94a3b8'}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '12px' }}>
                                    <span style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>
                                        {msg.sender_name} {msg.sender_type === 'staff' && <span style={{ color: '#3b82f6', textTransform: 'none' }}>(Staff)</span>}
                                    </span>
                                    <span style={{ color: '#94a3b8' }}>{formatDate(msg.created_at)}</span>
                                </div>
                                <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>{msg.message}</p>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No messages yet</p>
                    )}
                </div>

                {ticket.status !== 'closed' && (
                    <form onSubmit={handleSendMessage}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                rows={3}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: sending || !newMessage.trim() ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Send
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// Helper functions (moved outside components to avoid recreation)
const getStatusColor = (status) => {
    switch (status) {
        case 'open': return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
        case 'in_progress': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
        case 'resolved': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
        case 'closed': return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
        default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'urgent': return { bg: '#fee2e2', text: '#991b1b' };
        case 'high': return { bg: '#fed7aa', text: '#9a3412' };
        case 'medium': return { bg: '#fef3c7', text: '#92400e' };
        case 'low': return { bg: '#e0e7ff', text: '#3730a3' };
        default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
};

export default SupportTickets;
