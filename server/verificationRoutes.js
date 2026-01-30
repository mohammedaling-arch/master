const express = require('express');
const router = express.Router();

module.exports = function (app, db) {
    // Verification Handler: Affidavit
    const verifyAffidavitHandler = (req, res) => {
        let appId = req.params.id;
        console.log(`[VERIFY] Affidavit Request: ${appId}`);

        let dbId = appId;
        if (appId && appId.toUpperCase().startsWith('CRMS-')) {
            dbId = appId.substring(5);
        }

        const sql = `
            SELECT 
                a.id,
                a.created_at, 
                a.content,
                COALESCE(app.first_name, u.first_name) as first_name,
                COALESCE(app.surname, u.surname) as surname
            FROM affidavits a
            LEFT JOIN applicants app ON a.applicant_id = app.id
            LEFT JOIN public_users u ON a.user_id = u.id
            WHERE a.id = ? AND a.status = 'completed'
        `;

        db.query(sql, [dbId], (err, results) => {
            if (err) {
                console.error('[VERIFY ERROR]', err);
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) return res.status(404).json({ error: `Document not found. Checked ID: ${appId}` });

            const data = results[0];
            const deponentName = `${data.first_name || ''} ${data.surname || ''}`.trim() || 'DEPONENT';

            // Return full content
            const content = data.content || 'No content available';

            res.json({
                application_id: `CRMS-${data.id}`,
                deponent_name: deponentName,
                content: content,
                date_modified: data.created_at
            });
        });
    };

    // Verification Handler: Probate
    const verifyProbateHandler = (req, res) => {
        let appId = req.params.id;
        console.log(`[VERIFY] Probate Request: ${appId}`);

        let dbId = appId;
        // Strip PRB/ prefix if present
        if (appId && appId.toUpperCase().startsWith('PRB/')) {
            const parts = appId.split('/');
            dbId = parts[1] || appId;
        }

        const sql = `
            SELECT 
                p.id,
                p.created_at as completed_at, 
                p.deceased_name,
                CONCAT(u.first_name, ' ', u.surname) as applicant_name
            FROM probate_applications p
            LEFT JOIN public_users u ON p.user_id = u.id
            WHERE p.id = ? AND p.status IN ('approved', 'issued', 'completed')
        `;

        db.query(sql, [dbId], (err, results) => {
            if (err) {
                console.error('[VERIFY ERROR]', err);
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) return res.status(404).json({ error: 'Valid approved probate application not found with this ID.' });

            const data = results[0];
            res.json({
                application_id: `PRB/${data.id}`,
                deceased_name: data.deceased_name,
                applicant_name: data.applicant_name,
                completed_at: data.completed_at
            });
        });
    };

    // Register Verification Routes
    app.get('/api/verify/affidavit/:id', verifyAffidavitHandler);
    app.get('/verify/affidavit/:id', verifyAffidavitHandler);
    app.get('/api/verify/probate/:id', verifyProbateHandler);
    app.get('/verify/probate/:id', verifyProbateHandler);

    console.log('[INIT] Verification routes registered');
};
