import { c as i, r as a, j as e } from "./index-a367903a.js"; import { L as m } from "./list-1b284b06.js"; import { I as u } from "./image-fb628d93.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b = [["path", { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8", key: "mg9rjx" }]], g = i("bold", b);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y = [["line", { x1: "19", x2: "10", y1: "4", y2: "4", key: "15jd3p" }], ["line", { x1: "14", x2: "5", y1: "20", y2: "20", key: "bu0au3" }], ["line", { x1: "15", x2: "9", y1: "4", y2: "20", key: "uljnxc" }]], j = i("italic", y);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k = [["path", { d: "M11 5h10", key: "1cz7ny" }], ["path", { d: "M11 12h10", key: "1438ji" }], ["path", { d: "M11 19h10", key: "11t30w" }], ["path", { d: "M4 4h1v5", key: "10yrso" }], ["path", { d: "M4 9h2", key: "r1h2o0" }], ["path", { d: "M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02", key: "xtkcd5" }]], H = i("list-ordered", k);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M = [["path", { d: "M21 5H3", key: "1fi0y6" }], ["path", { d: "M17 12H7", key: "16if0g" }], ["path", { d: "M19 19H5", key: "vjpgq2" }]], z = i("text-align-center", M);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v = [["path", { d: "M21 5H3", key: "1fi0y6" }], ["path", { d: "M21 12H9", key: "dn1m92" }], ["path", { d: "M21 19H7", key: "4cu937" }]], L = i("text-align-end", v);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I = [["path", { d: "M21 5H3", key: "1fi0y6" }], ["path", { d: "M15 12H3", key: "6jk70r" }], ["path", { d: "M17 19H3", key: "z6ezky" }]], N = i("text-align-start", I), _ = ({ value: s, onChange: r, placeholder: x }) => {
    const n = a.useRef(null), l = a.useRef(null); a.useEffect(() => { n.current && n.current.innerHTML !== s && (n.current.innerHTML = s || "") }, [s]); const t = (o, d = null) => { document.execCommand(o, !1, d), r && r(n.current.innerHTML) }, p = () => { r && r(n.current.innerHTML) }, h = o => { const d = o.target.files[0]; if (d) { const c = new FileReader; c.onload = f => { t("insertImage", f.target.result) }, c.readAsDataURL(d) } }; return e.jsxs("div", {
        style: { border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "white", display: "flex", flexDirection: "column", minHeight: "400px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }, children: [e.jsxs("div", { style: { padding: "0.75rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [e.jsx("button", { onClick: () => t("bold"), className: "editor-btn", title: "Bold", children: e.jsx(g, { size: 18 }) }), e.jsx("button", { onClick: () => t("italic"), className: "editor-btn", title: "Italic", children: e.jsx(j, { size: 18 }) }), e.jsx("div", { style: { width: "1px", background: "#e2e8f0", margin: "0 4px" } }), e.jsx("button", { onClick: () => t("insertUnorderedList"), className: "editor-btn", title: "Bullet List", children: e.jsx(m, { size: 18 }) }), e.jsx("button", { onClick: () => t("insertOrderedList"), className: "editor-btn", title: "Ordered List", children: e.jsx(H, { size: 18 }) }), e.jsx("div", { style: { width: "1px", background: "#e2e8f0", margin: "0 4px" } }), e.jsx("button", { onClick: () => t("justifyLeft"), className: "editor-btn", title: "Align Left", children: e.jsx(N, { size: 18 }) }), e.jsx("button", { onClick: () => t("justifyCenter"), className: "editor-btn", title: "Align Center", children: e.jsx(z, { size: 18 }) }), e.jsx("button", { onClick: () => t("justifyRight"), className: "editor-btn", title: "Align Right", children: e.jsx(L, { size: 18 }) }), e.jsx("div", { style: { width: "1px", background: "#e2e8f0", margin: "0 4px" } }), e.jsx("button", { onClick: () => l.current.click(), className: "editor-btn", title: "Insert Image", children: e.jsx(u, { size: 18 }) }), e.jsx("input", { type: "file", ref: l, onChange: h, accept: "image/*", style: { display: "none" } }), e.jsx("div", { style: { width: "1px", background: "#e2e8f0", margin: "0 4px" } }), e.jsxs("select", { onChange: o => t("formatBlock", o.target.value), style: { padding: "4px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "13px" }, children: [e.jsx("option", { value: "P", children: "Paragraph" }), e.jsx("option", { value: "H1", children: "Heading 1" }), e.jsx("option", { value: "H2", children: "Heading 2" }), e.jsx("option", { value: "H3", children: "Heading 3" })] })] }), e.jsx("div", { ref: n, contentEditable: !0, onInput: p, style: { flex: 1, padding: "2rem", outline: "none", fontSize: "16px", lineHeight: "1.6", fontFamily: "'Inter', system-ui, sans-serif", color: "rgb\(18 37 74\)", overflowY: "auto" }, "data-placeholder": x }), e.jsx("style", {
            children: `
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
            `})]
    })
}; export { _ as R };
