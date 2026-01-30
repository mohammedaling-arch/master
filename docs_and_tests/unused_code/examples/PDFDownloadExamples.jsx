// Example: How to add download button to affidavit list/dashboard

import React from 'react';
import { Download } from 'lucide-react';
import { downloadAffidavitPDF, getDownloadButtonProps } from '../utils/downloadUtils';
import { useModal } from '../context/ModalContext';

const AffidavitListItem = ({ affidavit }) => {
    const { showModal } = useModal();
    const downloadProps = getDownloadButtonProps(affidavit);

    const handleDownload = () => {
        downloadAffidavitPDF(affidavit.id, showModal);
    };

    return (
        <div className="affidavit-item">
            <div className="affidavit-info">
                <h3>{affidavit.type}</h3>
                <p>Status: {affidavit.status}</p>
                <p>Date: {new Date(affidavit.created_at).toLocaleDateString()}</p>
            </div>

            <div className="affidavit-actions">
                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={downloadProps.disabled}
                    title={downloadProps.title}
                    className="btn-download"
                >
                    <Download size={18} />
                    Download PDF
                </button>

                {/* Status Badge */}
                {affidavit.status === 'completed' && affidavit.pdf_path && (
                    <span className="badge badge-success">
                        PDF Ready
                    </span>
                )}

                {affidavit.status === 'completed' && !affidavit.pdf_path && (
                    <span className="badge badge-warning">
                        Generating PDF...
                    </span>
                )}
            </div>
        </div>
    );
};

export default AffidavitListItem;


// ============================================
// Example: Staff CFO Approval with Auto PDF Generation
// ============================================

import React, { useState } from 'react';
import api from '../utils/api';
import { useModal } from '../context/ModalContext';

const CFOApprovalPanel = ({ affidavit, onApprovalComplete }) => {
    const { showModal } = useModal();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);

        try {
            // Approve the affidavit
            const response = await api.put(`/affidavits/${affidavit.id}/approve`, {
                nextStatus: 'completed',
                notes: 'Approved by CFO'
            });

            showModal({
                type: 'success',
                title: 'Affidavit Approved',
                message: 'The affidavit has been approved and the PDF is being generated with your signature.'
            });

            // Refresh the list
            if (onApprovalComplete) {
                onApprovalComplete();
            }
        } catch (error) {
            console.error('Approval Error:', error);
            showModal({
                type: 'error',
                title: 'Approval Failed',
                message: error.response?.data?.error || 'Failed to approve affidavit'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);

        try {
            await api.put(`/affidavits/${affidavit.id}/approve`, {
                nextStatus: 'rejected',
                notes: 'Rejected by CFO'
            });

            showModal({
                type: 'info',
                title: 'Affidavit Rejected',
                message: 'The affidavit has been rejected.'
            });

            if (onApprovalComplete) {
                onApprovalComplete();
            }
        } catch (error) {
            console.error('Rejection Error:', error);
            showModal({
                type: 'error',
                title: 'Rejection Failed',
                message: error.response?.data?.error || 'Failed to reject affidavit'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="cfo-approval-panel">
            <h3>Review Affidavit #{affidavit.id}</h3>
            <div className="affidavit-preview">
                <div dangerouslySetInnerHTML={{ __html: affidavit.content }} />
            </div>

            <div className="approval-actions">
                <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="btn btn-success"
                >
                    {isProcessing ? 'Processing...' : 'Approve & Generate PDF'}
                </button>

                <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="btn btn-danger"
                >
                    Reject
                </button>
            </div>

            <div className="info-note">
                <p>
                    <strong>Note:</strong> When you approve this affidavit, a certified PDF will be
                    automatically generated with your signature and the court stamp. The PDF will be
                    available for download by the applicant.
                </p>
            </div>
        </div>
    );
};

export default CFOApprovalPanel;


// ============================================
// Example: User Dashboard with Download
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { downloadAffidavitPDF, isPDFAvailable } from '../utils/downloadUtils';
import { useModal } from '../context/ModalContext';
import { Download, Eye, Edit, Trash2 } from 'lucide-react';

const UserAffidavitDashboard = ({ userId }) => {
    const { showModal } = useModal();
    const [affidavits, setAffidavits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAffidavits();
    }, [userId]);

    const fetchAffidavits = async () => {
        try {
            const response = await api.get(`/affidavits/user/${userId}`);
            setAffidavits(response.data);
        } catch (error) {
            console.error('Failed to fetch affidavits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (affidavitId) => {
        downloadAffidavitPDF(affidavitId, showModal);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'submitted': { class: 'badge-info', text: 'Pending Review' },
            'completed': { class: 'badge-success', text: 'Completed' },
            'rejected': { class: 'badge-danger', text: 'Rejected' }
        };
        const badge = badges[status] || { class: 'badge-secondary', text: status };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    if (loading) {
        return <div className="loading">Loading your affidavits...</div>;
    }

    return (
        <div className="user-affidavit-dashboard">
            <h2>My Affidavits</h2>

            {affidavits.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't filed any affidavits yet.</p>
                    <button className="btn btn-primary">File New Affidavit</button>
                </div>
            ) : (
                <div className="affidavit-list">
                    {affidavits.map((affidavit) => (
                        <div key={affidavit.id} className="affidavit-card">
                            <div className="card-header">
                                <h3>{affidavit.type}</h3>
                                {getStatusBadge(affidavit.status)}
                            </div>

                            <div className="card-body">
                                <p><strong>Filed:</strong> {new Date(affidavit.created_at).toLocaleDateString()}</p>
                                <p><strong>Amount:</strong> ₦{affidavit.amount?.toLocaleString()}</p>

                                {affidavit.status === 'completed' && (
                                    <div className="completion-info">
                                        <p className="success-text">
                                            ✓ Your affidavit has been approved and certified
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="card-actions">
                                {/* Download Button - Only for completed affidavits */}
                                {isPDFAvailable(affidavit) && (
                                    <button
                                        onClick={() => handleDownload(affidavit.id)}
                                        className="btn btn-primary"
                                        title="Download certified PDF"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </button>
                                )}

                                {/* Edit/Delete - Only for non-completed */}
                                {affidavit.status !== 'completed' && (
                                    <>
                                        <button className="btn btn-secondary">
                                            <Edit size={18} />
                                            Edit
                                        </button>
                                        <button className="btn btn-danger">
                                            <Trash2 size={18} />
                                            Delete
                                        </button>
                                    </>
                                )}

                                {/* View Button */}
                                <button className="btn btn-outline">
                                    <Eye size={18} />
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserAffidavitDashboard;
