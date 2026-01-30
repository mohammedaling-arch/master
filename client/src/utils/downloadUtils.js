import api from './api';

/**
 * Downloads a completed affidavit PDF
 * @param {number} affidavitId - The ID of the affidavit to download
 * @param {Function} showModal - Optional modal function to show errors
 * @returns {Promise<void>}
 */
export const downloadAffidavitPDF = async (affidavitId, showModal) => {
    try {
        // Make API request to download PDF
        const response = await api.get(`/affidavits/${affidavitId}/download`, {
            responseType: 'blob' // Important for file downloads
        });

        // Create a blob from the response
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `Affidavit_${affidavitId}_Certified.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (showModal) {
            showModal({
                type: 'success',
                title: 'Download Complete',
                message: 'Your affidavit PDF has been downloaded successfully.'
            });
        }
    } catch (error) {
        console.error('PDF Download Error:', error);

        let errorMessage = 'Failed to download PDF. ';

        if (error.response?.status === 404) {
            errorMessage += 'PDF not yet generated. Please wait for approval.';
        } else if (error.response?.status === 403) {
            errorMessage += 'You do not have permission to download this affidavit.';
        } else {
            errorMessage += error.response?.data?.error || error.message;
        }

        if (showModal) {
            showModal({
                type: 'error',
                title: 'Download Failed',
                message: errorMessage
            });
        } else {
            alert(errorMessage);
        }
    }
};

/**
 * Checks if an affidavit PDF is available for download
 * @param {Object} affidavit - The affidavit object
 * @returns {boolean} - True if PDF is available
 */
export const isPDFAvailable = (affidavit) => {
    return affidavit?.status === 'completed' && affidavit?.pdf_path;
};

/**
 * Gets the download button props for an affidavit
 * @param {Object} affidavit - The affidavit object
 * @returns {Object} - Button props (disabled, title, etc.)
 */
export const getDownloadButtonProps = (affidavit) => {
    if (!affidavit) {
        return {
            disabled: true,
            title: 'Affidavit not found'
        };
    }

    if (affidavit.status !== 'completed') {
        return {
            disabled: true,
            title: 'Affidavit must be completed before download'
        };
    }

    if (!affidavit.pdf_path) {
        return {
            disabled: true,
            title: 'PDF is being generated. Please refresh in a moment.'
        };
    }

    return {
        disabled: false,
        title: 'Download certified affidavit PDF'
    };
};
