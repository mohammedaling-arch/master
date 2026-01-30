// Update affidavit content (only if not completed)
app.put('/api/affidavits/:id', upload.single('file'), logActivity, (req, res) => {
    const { id } = req.params;
    const { type, content } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    console.log(`[Deponent Resubmission Debug] START - Affidavit ID: ${id}`);
    console.log(`[Deponent Resubmission Debug] Body:`, req.body);
    if (req.file) console.log(`[Deponent Resubmission Debug] File: ${req.file.filename}`);

    if (!id) return res.status(400).json({ error: 'Affidavit ID is required' });

    // Fetch current state
    db.query('SELECT status, type, content, pdf_path FROM affidavits WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(`[Deponent Resubmission Debug] DB SELECT ERROR:`, err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (results.length === 0) {
            console.warn(`[Deponent Resubmission Debug] RECORD NOT FOUND: ${id}`);
            return res.status(404).json({ error: `Record ${id} not found` });
        }

        const current = results[0];
        console.log(`[Deponent Resubmission Debug] CURRENT STATUS: ${current.status}`);

        if (current.status === 'completed') {
            return res.status(403).json({ error: 'Cannot edit an affidavit that has already been completed.' });
        }

        const updatedType = type || current.type;
        const updatedContent = content || current.content;
        const updatedPath = filePath || current.pdf_path;

        // FORCING STATUS CHANGE
        const nextStatus = 'submitted';

        console.log(`[Deponent Resubmission Debug] EXECUTING UPDATE - ID: ${id}, Status To: ${nextStatus}`);

        const sql = "UPDATE affidavits SET type = ?, content = ?, pdf_path = ?, status = 'submitted', remarks = NULL WHERE id = ?";
        const params = [updatedType, updatedContent, updatedPath, id];

        db.query(sql, params, (updateErr, result) => {
            if (updateErr) {
                console.error(`[Deponent Resubmission Debug] DB UPDATE ERROR:`, updateErr);
                return res.status(500).json({ error: 'Database update failed: ' + updateErr.message });
            }

            console.log(`[Deponent Resubmission Debug] SUCCESS - Rows affected: ${result.affectedRows}`);

            res.json({
                message: 'Your affidavit has been resubmitted successfully.',
                status: 'submitted',
                id: id,
                affected: result.affectedRows
            });
        });
    });
});
