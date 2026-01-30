import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Type, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        if (onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleImageInsert = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                execCommand('insertImage', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Toolbar */}
            <div style={{
                padding: '0.75rem',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
            }}>
                <button onClick={() => execCommand('bold')} className="editor-btn" title="Bold"><Bold size={18} /></button>
                <button onClick={() => execCommand('italic')} className="editor-btn" title="Italic"><Italic size={18} /></button>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                <button onClick={() => execCommand('insertUnorderedList')} className="editor-btn" title="Bullet List"><List size={18} /></button>
                <button onClick={() => execCommand('insertOrderedList')} className="editor-btn" title="Ordered List"><ListOrdered size={18} /></button>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                <button onClick={() => execCommand('justifyLeft')} className="editor-btn" title="Align Left"><AlignLeft size={18} /></button>
                <button onClick={() => execCommand('justifyCenter')} className="editor-btn" title="Align Center"><AlignCenter size={18} /></button>
                <button onClick={() => execCommand('justifyRight')} className="editor-btn" title="Align Right"><AlignRight size={18} /></button>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                <button onClick={() => fileInputRef.current.click()} className="editor-btn" title="Insert Image">
                    <ImageIcon size={18} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageInsert}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                <select
                    onChange={(e) => execCommand('formatBlock', e.target.value)}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                >
                    <option value="P">Paragraph</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="H3">Heading 3</option>
                </select>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                style={{
                    flex: 1,
                    padding: '2rem',
                    outline: 'none',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: 'rgb\(18 37 74\)',
                    overflowY: 'auto'
                }}
                data-placeholder={placeholder}
            />

            <style>{`
                .editor-btn {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 6px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .editor-btn:hover {
                    background: #f1f5f9;
                    color: rgb\(18 37 74\);
                    border-color: #cbd5e1;
                }
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    cursor: text;
                }
                [contenteditable] h1 { font-size: 2rem; margin-bottom: 1rem; }
                [contenteditable] h2 { font-size: 1.5rem; margin-bottom: 0.75rem; }
                [contenteditable] h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
                [contenteditable] ul, [contenteditable] ol { margin-left: 1.5rem; margin-bottom: 1rem; }
                [contenteditable] img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
