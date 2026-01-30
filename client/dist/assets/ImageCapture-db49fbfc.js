import { h as O, E as B } from "./html2canvas.esm-7584f2e8.js"; import { c as M, r as x, j as e, e as G, h as L, m as U, a as q, X as J } from "./index-a367903a.js"; import { C as H } from "./credit-card-7df9ba98.js"; import { U as V } from "./SupportTickets-1bec5e21.js"; import { R as Y } from "./refresh-cw-24e393f6.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q = [["path", { d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z", key: "18u6gg" }], ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]], W = M("camera", Q);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]], K = M("check", X);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z = [["path", { d: "M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3", key: "1i73f7" }], ["path", { d: "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3", key: "saxlbk" }], ["path", { d: "M12 20v2", key: "1lh1kg" }], ["path", { d: "M12 14v2", key: "8jcxud" }], ["path", { d: "M12 8v2", key: "1woqiv" }], ["path", { d: "M12 2v2", key: "tus03m" }]], ee = M("flip-horizontal", Z), re = async ({ user: i, applicationId: o, templateTitle: l, content: c, cfoStaff: g, juratName: u, isDraft: p = !1 }) => {
    try {
        const n = document.createElement("div"); n.id = "pdf-export-container", n.style.width = "900px", n.style.padding = "20px", n.style.backgroundColor = "#ffffff", n.style.fontFamily = "Calibri, Arial, sans-serif", n.style.position = "absolute", n.style.left = "-9999px", n.style.top = "0"; const a = "/api".replace("/api", "") || window.location.origin, b = (g == null ? void 0 : g.name) || "COMMISSIONER FOR OATHS", d = (g == null ? void 0 : g.division) || "MAIDUGURI", h = async v => { if (!v) return null; try { const k = await (await fetch(v.startsWith("http") ? v : `${a}${v.startsWith("/") ? "" : "/"}${v}`)).blob(); return new Promise(I => { const E = new FileReader; E.onloadend = () => I(E.result), E.readAsDataURL(k) }) } catch (C) { return console.error("Image load failed:", v, C), null } }, w = await h("/assets/coat_of_arms.png"), y = await h((i == null ? void 0 : i.profile_pic) || (i == null ? void 0 : i.picture_path)), m = await h(i == null ? void 0 : i.signature_path), R = await h(g == null ? void 0 : g.signature_path), r = new Date, P = `${(v => { const C = ["th", "st", "nd", "rd"], k = v % 100; return v + (C[(k - 20) % 10] || C[k] || C[0]) })(r.getDate())} day of ${r.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`; n.innerHTML = `
            <style>
                #pdf-export-body { 
                    color: #000; 
                    line-height: 1.2;
                    font-family: Calibri, Arial, sans-serif;
                }
                #pdf-export-body h2 { 
                    font-size: 16px; 
                    text-align: center; 
                    margin: 0; 
                    padding: 0;
                    font-style: italic;
                    text-transform: uppercase;
                }
                #pdf-export-body h3 { 
                    font-size: 16px; 
                    text-align: center; 
                    margin: 5px 0 20px;
                    font-style: italic;
                    text-transform: uppercase;
                }
                .content-box { 
                    font-size: 13px; 
                     font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                    text-align: justify;
                    min-height: 300px;
                    margin-bottom: 20px;
                    overflow-wrap: break-word;
                }
                .content-box p, .content-box span, .content-box div {
                    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                    margin-bottom: 15px; 
                }

                .official-stamp-box {
                    position: absolute;
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%) rotate(-15deg);
                    width: 170px; 
                    height: 100px; 
                    border: 4px solid #1e3a8a; 
                    border-radius: 8px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    z-index: 5;
                    opacity: 0.9;
                    pointer-events: none;
                }
                .stamp-inner {
                    width: 100%;
                    height: 100vh;
                    border: 2px solid #1e3a8a;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
            </style>
            <div id="pdf-export-body" style="padding: 40px; background: white;">
                <!-- Court Header -->
                <div style="position: relative; text-align: center; margin-bottom: 20px; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    ${y ? `
                    <div style="position: absolute; left: 0; top: 0; z-index: 10;">
                        <img src="${y}" style="width: 80px; height: 95px; object-fit: cover; border: 1px solid #000; padding: 2px;" />
                    </div>
                    `: ""}
                    
                    <img src="${w}" style="width: 80px; height: auto; margin-bottom: 10px;" />
                    <h2>IN THE HIGH COURT OF JUSTICE&nbsp;&nbsp;BORNO STATE&nbsp;&nbsp;OF NIGERIA</h2>
                    <h3>IN THE ${d} JUDICIAL DIVISION</h3>
                </div>

                <!-- Main Content Area -->
                <div class="content-box">
                    ${c || '<p style="text-align:center; font-style:italic;">[No content provided]</p>'}
                </div>

                <!-- Deponent Selection -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
                    <div style="font-size: 11px; font-style: italic; max-width: 350px; text-align: left; margin-bottom: 10px;">
                        ${u ? `This affidavit was translated from English to ${i.language || "Local Language"} by me: ${u} to the Deponent and have understood its contents.` : ""}
                    </div>
                    <div style="text-align: center; width: 250px;">
                        ${m ? `
                        <img src="${m}" style="height: 50px; width: auto; max-width: 200px; filter: contrast(1.1); margin-bottom: 2px;" />
                        `: ""}
                        <div style="border-bottom: 2px solid #000; margin-bottom: 5px;"></div>
                        <div style="font-weight: bold; text-transform: uppercase; font-size: 14px;">${i.first_name || ""} ${i.surname || ""}</div>
                        <div style="font-size: 14px;">DEPONENT</div>
                    </div>
                </div>

                <!-- Sworn Label -->
                <div style="text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">
                    Sworn to at High Court of Justice ${d}
                </div>

                <!-- Footer Section -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; min-height: 200px; border-top: 1px solid #000; padding-top: 20px; position: relative;">
                    <!-- Date and QR -->
                    <div style="display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;">
                        <div style="font-size: 14px;">
                            <strong>DATED THIS:</strong> ${P}
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div id="qr-placeholder" style="width: 80px; height: 80px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; border: 1px solid #ddd;">
                                QR CODE
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: bold; font-family: monospace;">UUID: CRMS-${o}</div>
                                <div style="font-size: 11px; color: #666;">Digitally Signed & Validated</div>
                            </div>
                        </div>
                    </div>

                    <!-- Rectangular Stamp Overlay -->
                    <div class="official-stamp-box">
                        <div class="stamp-inner" style="border: none; background: transparent; height: auto;">
                            <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">HIGH COURT OF</div>
                            <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">JUSTICE</div>
                            <div style="font-size: 12px; margin-bottom: 1px; text-transform: uppercase; color: #1e3a8a; font-weight: 800; letter-spacing: 0.3px;">COMMISSIONER FOR OATHS</div>
                           <div style="font-size: 14px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px; font-weight: 900;">OADR REGISTRY</div>
                        </div>
                    </div>

                    <!-- Commissioner Side -->
                    <div style="text-align: center; position: relative; display: flex; flex-direction: column; align-items: center;">
                        <!-- Content Below Stamp -->
                        <div style="position: relative; z-index: 2;">
                            <div style="font-size: 14px; margin-bottom: 8px; font-weight: bold;">BEFORE ME:</div>
                            
                            ${R ? `
                            <img src="${R}" style="height: 60px; width: auto; max-width: 250px; filter: contrast(1.1); margin: 5px auto; display: block;" />
                            `: `
                            <div style="height: 60px; width: 250px; margin: 5px auto; border-bottom: 2px solid #000;"></div>
                            `}
                            
                            <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; margin-top: 8px;">${b}</div>
                            
                            <div style="font-size: 14px; font-weight: bold; margin-top: 3px;">COMMISSIONER FOR OATHS</div>
                        </div>
                    </div>
                </div>
            </div>
        `, document.body.appendChild(n); const A = await O(n, { scale: 2, useCORS: !0, allowTaint: !0, backgroundColor: "#ffffff" }), T = A.toDataURL("image/png"), j = new B({ orientation: "portrait", unit: "mm", format: "a4" }), _ = j.internal.pageSize.getWidth(), N = j.internal.pageSize.getHeight(), t = 20, s = 20, f = 10, D = 10, S = _ - t - s, z = A.height * S / A.width; j.addImage(T, "PNG", t, f, S, z), p ? (j.setTextColor(200, 200, 200), j.setFontSize(60), j.save(`Affidavit_${o}_Draft.pdf`)) : j.save(`Affidavit_${o}_Certified.pdf`), document.body.removeChild(n)
    } catch (n) { throw console.error("PDF Generation Error:", n), n }
}, se = async ({ user: i, payment: o }) => {
    var l; try {
        const c = document.createElement("div"); c.style.width = "800px", c.style.padding = "40px", c.style.backgroundColor = "#ffffff", c.style.fontFamily = "Calibri, Arial, sans-serif", c.style.position = "absolute", c.style.left = "-9999px"; const g = "/api".replace("/api", "") || window.location.origin, p = await (async d => { if (!d) return null; try { const w = await (await fetch(d.startsWith("http") ? d : `${g}${d.startsWith("/") ? "" : "/"}${d}`)).blob(); return new Promise(y => { const m = new FileReader; m.onloadend = () => y(m.result), m.readAsDataURL(w) }) } catch { return null } })("/assets/coat_of_arms.png"); c.innerHTML = `
            <div style="border: 2px solid rgb\(18 37 74\); padding: 30px; position: relative;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${p}" style="width: 80px; height: auto; margin-bottom: 10px;" />
                    <h2 style="margin: 0; color: rgb\(18 37 74\); text-transform: uppercase; font-size: 20px;">High Court of Justice</h2>
                    <h3 style="margin: 5px 0; color: #778eaeff; font-size: 16px;">Official Payment Receipt</h3>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                    <div>
                        <p style="margin: 0; color: #778eaeff; font-size: 12px;">PAYER / NEXT OF KIN:</p>
                        <h4 style="margin: 5px 0; font-size: 16px;">${i.applicant_first_name || i.first_name || ""} ${i.applicant_surname || i.surname || ""}</h4>
                        <p style="margin: 0; font-size: 13px;">${i.applicant_email || i.email || ""}</p>
                        <p style="margin: 0; font-size: 13px;">${i.applicant_phone || i.phone || ""}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; color: #778eaeff; font-size: 12px;">RECEIPT DETAILS:</p>
                        <p style="margin: 5px 0; font-weight: bold; color: rgb\(18 37 74\);">REF: ${o.transaction_id || "N/A"}</p>
                        <p style="margin: 0; font-size: 13px;">Date: ${new Date(o.payment_date).toLocaleDateString()}</p>
                        <p style="margin: 0; font-size: 13px;">Status: <span style="color: #10b981; font-weight: bold;">${(l = o.payment_status) == null ? void 0 : l.toUpperCase()}</span></p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: left; font-size: 13px;">Description</th>
                            <th style="padding: 12px; text-align: right; font-size: 13px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-weight: bold;">${o.item_paid}</div>
                                <div style="font-size: 11px; color: #778eaeff;">${o.affidavit_title || o.deceased_name || "CRMS Digital Service"}</div>
                            </td>
                            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
                                ₦${parseFloat(o.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 15px; text-align: right; font-weight: bold;">Total Paid</td>
                            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: rgb\(18 37 74\);">
                                ₦${parseFloat(o.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is a computer-generated receipt and requires no physical signature.</p>
                    <p style="margin: 5px 0 0; font-size: 10px; color: #cbd5e1;">CRMS - Borno State Judiciary Digital Services</p>
                </div>
            </div>
        `, document.body.appendChild(c); const n = await O(c, { scale: 2 }), a = n.toDataURL("image/png"), b = new B("p", "mm", "a4"); b.addImage(a, "PNG", 10, 10, 190, n.height * 190 / n.width), b.save(`Receipt_${o.transaction_id}.pdf`), document.body.removeChild(c)
    } catch (c) { console.error("Receipt PDF Error:", c) }
}, le = async ({ application: i, bankInfo: o }) => {
    if (console.log("[PDF] Generating Bank Request Letter...", { application: i, bankInfo: o }), !i || !o) { console.error("[PDF] Missing required data for letter generation"); return } try {
        const l = document.createElement("div"); l.style.width = "800px", l.style.padding = "60px", l.style.backgroundColor = "#ffffff", l.style.fontFamily = "Times New Roman, Times, serif", l.style.position = "absolute", l.style.left = "-9999px", l.style.color = "#000"; const c = "/api".replace("/api", "") || window.location.origin, u = await (async d => { if (!d) return null; try { const w = await (await fetch(d.startsWith("http") ? d : `${c}${d.startsWith("/") ? "" : "/"}${d}`)).blob(); return new Promise(y => { const m = new FileReader; m.onloadend = () => y(m.result), m.readAsDataURL(w) }) } catch { return null } })("/assets/coat_of_arms.png"), p = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); l.innerHTML = `
            <div style="line-height: 1.6; font-size: 16px;">
                <!-- Official Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${u}" style="width: 100px; height: auto; margin-bottom: 10px;" />
                    <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">Borno State Judiciary</h2>
                    <h3 style="margin: 5px 0; font-size: 20px; text-transform: uppercase;">High Court of Justice</h3>
                    <h4 style="margin: 5px 0; font-size: 18px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px;">PROBATE REGISTRY, MAIDUGURI</h4>
                </div>

                <!-- References & Date -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div>Our Ref: <b>BSHC/PR/ADM/${i.id}/${new Date().getFullYear()}</b></div>
                    <div>Date: <b>${p}</b></div>
                </div>

                <!-- Recipient -->
                <div style="margin-bottom: 30px;">
                    <p style="margin: 0;"><b>The Manager,</b></p>
                    <p style="margin: 0;"><b>${o.bank_name},</b></p>
                    <p style="margin: 0;"><b>Maiduguri Branch, Borno State.</b></p>
                </div>

                <p style="margin-bottom: 30px;">Sir/Madam,</p>

                <!-- Subject -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h3 style="text-transform: uppercase; text-decoration: underline; line-height: 1.4; margin: 0;">
                        REQUEST FOR BANK BALANCE IN RESPECT OF THE ESTATE OF <br/>
                        ${i.deceased_name.toUpperCase()} (DECEASED)
                    </h3>
                </div>

                <!-- Body -->
                <p style="text-align: justify; margin-bottom: 20px;">
                    The above subject matter refers, please.
                </p>
                
                <p style="text-align: justify; margin-bottom: 20px;">
                    I am directed to inform you that the above named person died on the <b>${new Date(i.date_of_death).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b> and an application for the grant of Letter of Administration has been filed at this Registry.
                </p>

                <p style="text-align: justify; margin-bottom: 20px;">
                    Information reached this Registry that the Deceased maintained an account with your bank with the following details:
                </p>

                <div style="margin-left: 40px; margin-bottom: 30px;">
                    <p style="margin: 5px 0;">ACCOUNT NAME: <b>${o.bank_account_name.toUpperCase()}</b></p>
                    <p style="margin: 5px 0;">ACCOUNT NUMBER: <b>${o.bank_account}</b></p>
                </div>

                <p style="text-align: justify; margin-bottom: 40px;">
                    Consequently, you are requested to furnish this Registry with the <b>Current Balance</b> standing in the said account to enable us process the application accordingly.
                </p>

                <p style="margin-bottom: 60px;">Accept the assurances of the Probate Registrar, please.</p>

                <!-- Closing -->
                <div style="text-align: right; margin-right: 50px;">
                    <div style="height: 60px;"></div>
                    <p style="margin: 0; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">
                        <b>FOR: PROBATE REGISTRAR</b>
                    </p>
                </div>
            </div>
        `, document.body.appendChild(l); const n = await O(l, { scale: 2 }), a = n.toDataURL("image/png"), b = new B("p", "mm", "a4"); b.addImage(a, "PNG", 10, 10, 190, n.height * 190 / n.width), b.save(`Bank_Request_${o.bank_account}.pdf`), document.body.removeChild(l)
    } catch (l) { console.error("Bank Request Letter PDF Error:", l) }
}, de = ({ amount: i, onSuccess: o, onCancel: l, metadata: c = {}, user: g, itemDescription: u = "Legal Document Fee" }) => { const [p, n] = x.useState({}), [a, b] = x.useState(!0); x.useState(!1); const [d, h] = x.useState(null); x.useEffect(() => { (async () => { try { const r = await q.get("/settings"); n(r.data) } catch (r) { console.error("Failed to load payment settings", r), h("Could not load payment configuration.") } finally { b(!1) } })() }, []), x.useEffect(() => { if (!a && p.paystack_enabled === "1") { const R = document.createElement("script"); R.src = "https://js.paystack.co/v1/inline.js", R.async = !0, document.body.appendChild(R) } }, [a, p]); const w = () => { if (h(null), !window.PaystackPop) { h("Paystack is currently unavailable. Please reload."); return } window.PaystackPop.setup({ key: p.paystack_public_key, email: g.email, amount: Math.round(i * 100), currency: "NGN", ref: `CRMS-${new Date().getTime()}-${Math.floor(Math.random() * 1e3)}`, metadata: { custom_fields: [{ display_name: "Item", variable_name: "item", value: u }, ...Object.keys(c).map(r => ({ display_name: r, variable_name: r, value: c[r] }))] }, callback: r => { console.log("Paystack Success:", r), o({ gateway: "paystack", reference: r.reference, transaction_id: r.transaction, status: "completed" }) }, onClose: () => { console.log("Paystack Closed") } }).openIframe() }, y = () => { h("Remita integration is currently being finalized. Please use Paystack.") }; if (a) return e.jsxs("div", { style: { padding: "2rem", textAlign: "center" }, children: [e.jsx(G, { className: "animate-spin", size: 32, style: { margin: "0 auto" } }), e.jsx("p", { children: "Initializing Secure Payment..." })] }); const m = p.paystack_enabled === "1" || p.remita_enabled === "1"; return e.jsxs("div", { style: { padding: "1.5rem", background: "white", borderRadius: "16px" }, children: [e.jsx("h3", { style: { margin: "0 0 0.5rem", textAlign: "center" }, children: "Choose Payment Method" }), e.jsxs("p", { style: { color: "#778eaeff", textAlign: "center", marginBottom: "2rem", fontSize: "14px" }, children: ["Securely pay ", e.jsxs("strong", { children: ["₦", Number(i).toLocaleString()] })] }), d && e.jsxs("div", { style: { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }, children: [e.jsx(L, { size: 16 }), " ", d] }), !m && e.jsxs("div", { style: { textAlign: "center", padding: "1rem", color: "#d97706" }, children: [e.jsx(L, { size: 32, style: { margin: "0 auto 1rem" } }), e.jsx("p", { children: "No payment gateways are currently active. Please contact support." })] }), e.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: [p.paystack_enabled === "1" && e.jsxs(U.button, { type: "button", whileHover: { scale: 1.02 }, whileTap: { scale: .98 }, onClick: w, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }, children: [e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [e.jsx("img", { src: "https://paystack.com/favicon.png", alt: "Paystack", style: { width: "24px" } }), e.jsxs("div", { style: { textAlign: "left" }, children: [e.jsx("span", { style: { fontWeight: "700", display: "block" }, children: "Pay with Paystack" }), e.jsx("span", { style: { fontSize: "12px", color: "#778eaeff" }, children: "Cards, Bank, USSD, Transfer" })] })] }), e.jsx(H, { size: 20, color: "#3b82f6" })] }), p.remita_enabled === "1" && e.jsxs(U.button, { type: "button", whileHover: { scale: 1.02 }, whileTap: { scale: .98 }, onClick: y, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }, children: [e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [e.jsx("div", { style: { width: "24px", height: "24px", background: "#e11d48", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "14px" }, children: "R" }), e.jsxs("div", { style: { textAlign: "left" }, children: [e.jsx("span", { style: { fontWeight: "700", display: "block" }, children: "Pay with Remita" }), e.jsx("span", { style: { fontSize: "12px", color: "#778eaeff" }, children: "RRR, Government Channels" })] })] }), e.jsx(H, { size: 20, color: "#e11d48" })] })] }), e.jsx("button", { type: "button", onClick: l, style: { width: "100%", marginTop: "2rem", padding: "1rem", background: "#f8fafc", border: "none", borderRadius: "12px", color: "#778eaeff", fontWeight: "600", cursor: "pointer" }, children: "Cancel Payment" })] }) }, ce = ({ onImageCaptured: i, onClose: o, title: l = "Capture Photo", aspectRatio: c = 1, targetWidth: g = 600, targetHeight: u = 600 }) => { const [p, n] = x.useState("choice"), [a, b] = x.useState(null), [d, h] = x.useState(null), [w, y] = x.useState(null), [m, R] = x.useState(!0), r = x.useRef(null); x.useRef(null); const $ = x.useRef(null), P = x.useRef(null); x.useEffect(() => () => { a && a.getTracks().forEach(t => t.stop()) }, [a]), x.useEffect(() => { p === "camera" && a && r.current && (r.current.srcObject = a, r.current.onloadedmetadata = () => { r.current.play().catch(t => console.error("Video play error:", t)) }) }, [p, a]); const A = async () => { try { if (y(null), a && a.getTracks().forEach(f => f.stop()), !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { y("Camera API not supported in this browser or context (requires HTTPS or localhost)."), n("choice"); return } const t = { video: { facingMode: m ? "user" : "environment" } }, s = await navigator.mediaDevices.getUserMedia(t); b(s), n("camera") } catch (t) { console.error("Camera access error:", t), t.name === "NotAllowedError" || t.name === "PermissionDeniedError" ? y("Camera permission denied. Please allow camera access in your browser settings.") : t.name === "NotFoundError" || t.name === "DevicesNotFoundError" ? y("No camera device found.") : t.name === "NotReadableError" || t.name === "TrackStartError" ? y("Camera is already in use by another application.") : y("Could not access camera: " + (t.message || "Unknown error")), n("choice") } }, T = t => { const s = t.target.files[0]; if (!s) return; const f = new FileReader; f.onload = D => { _(D.target.result) }, f.readAsDataURL(s) }, j = () => { if (!r.current) return; const t = r.current, s = document.createElement("canvas"); s.width = t.videoWidth, s.height = t.videoHeight; const f = s.getContext("2d"); m && (f.translate(s.width, 0), f.scale(-1, 1)), f.drawImage(t, 0, 0, s.width, s.height), _(s.toDataURL("image/jpeg")), a && (a.getTracks().forEach(D => D.stop()), b(null)) }, _ = t => { const s = new Image; s.onload = () => { const f = document.createElement("canvas"); f.width = g, f.height = u; const D = f.getContext("2d"), S = s.naturalWidth, z = s.naturalHeight, v = S / z, C = g / u; let k, I, E, F; v > C ? (I = z, k = z * C, E = (S - k) / 2, F = 0) : (k = S, I = S / C, E = 0, F = (z - I) / 2), D.drawImage(s, E, F, k, I, 0, 0, g, u), h(f.toDataURL("image/jpeg", .9)), n("preview") }, s.src = t }, N = () => { fetch(d).then(t => t.blob()).then(t => { const s = new File([t], "captured_image.jpg", { type: "image/jpeg" }); i(s, d), o() }) }; return e.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3e3, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(8px)" }, children: e.jsxs(U.div, { initial: { scale: .9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, style: { background: "rgb\(18 37 74\)", borderRadius: "24px", width: "100%", maxWidth: "500px", overflow: "hidden", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }, children: [e.jsxs("div", { style: { padding: "1.25rem", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [e.jsx("h3", { style: { margin: 0, color: "white", fontSize: "1.1rem", fontWeight: "bold" }, children: l }), e.jsx("button", { onClick: o, style: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }, children: e.jsx(J, { size: 24 }) })] }), e.jsxs("div", { style: { padding: "1.5rem" }, children: [p === "choice" && e.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }, children: [e.jsxs("button", { type: "button", onClick: A, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 1rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", color: "white", cursor: "pointer", transition: "all 0.2s" }, children: [e.jsx("div", { style: { padding: "12px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "50%", color: "#3b82f6" }, children: e.jsx(W, { size: 32 }) }), e.jsx("span", { style: { fontWeight: "bold" }, children: "Take Photo" })] }), e.jsxs("button", { type: "button", onClick: () => { var t; return (t = $.current) == null ? void 0 : t.click() }, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 1rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", color: "white", cursor: "pointer", transition: "all 0.2s" }, children: [e.jsx("div", { style: { padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", color: "#10b981" }, children: e.jsx(V, { size: 32 }) }), e.jsx("span", { style: { fontWeight: "bold" }, children: "Upload File" })] }), e.jsx("input", { type: "file", ref: $, style: { display: "none" }, accept: "image/*", onChange: T }), e.jsx("input", { type: "file", ref: P, style: { display: "none" }, accept: "image/*", capture: m ? "user" : "environment", onChange: T })] }), p === "camera" && e.jsxs("div", { style: { position: "relative", width: "100%", paddingTop: "100%", background: "#000", borderRadius: "16px", overflow: "hidden" }, children: [e.jsx("video", { ref: r, autoPlay: !0, playsInline: !0, muted: !0, onCanPlay: t => t.target.play(), style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transform: m ? "scaleX(-1)" : "none" } }), e.jsx("div", { style: { position: "absolute", top: "10%", left: "10%", right: "10%", bottom: "10%", border: "2px dashed rgba(255,255,255,0.5)", borderRadius: "50%", pointerEvents: "none" } }), e.jsxs("div", { style: { position: "absolute", bottom: "1.5rem", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "1.5rem", alignItems: "center" }, children: [e.jsx("button", { type: "button", onClick: () => R(!m), style: { padding: "10px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer" }, children: e.jsx(ee, { size: 20 }) }), e.jsx("button", { type: "button", onClick: j, style: { width: "64px", height: "64px", borderRadius: "50%", background: "white", border: "4px solid rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: e.jsx("div", { style: { width: "50px", height: "50px", borderRadius: "50%", background: "#3b82f6" } }) }), e.jsx("button", { type: "button", onClick: () => { a && a.getTracks().forEach(t => t.stop()), n("choice") }, style: { padding: "10px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer" }, children: e.jsx(Y, { size: 20 }) })] })] }), p === "preview" && e.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }, children: [e.jsx("div", { style: { width: "250px", height: "250px", borderRadius: "20px", overflow: "hidden", border: "4px solid #3b82f6", boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }, children: e.jsx("img", { src: d, style: { width: "100%", height: "100%", objectFit: "cover" }, alt: "Preview" }) }), e.jsxs("div", { style: { display: "flex", gap: "1rem", width: "100%" }, children: [e.jsx("button", { type: "button", onClick: () => n("choice"), style: { flex: 1, padding: "12px", background: "#334155", border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", cursor: "pointer" }, children: "Retake" }), e.jsxs("button", { type: "button", onClick: N, style: { flex: 2, padding: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }, children: [e.jsx(K, { size: 20 }), " Use This Photo"] })] })] }), w && e.jsxs("div", { style: { marginTop: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "12px", color: "#ef4444", fontSize: "14px", textAlign: "center" }, children: [e.jsx("p", { style: { margin: "0 0 10px 0" }, children: w }), e.jsxs("button", { type: "button", onClick: () => { var t; return (t = P.current) == null ? void 0 : t.click() }, style: { padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }, children: [e.jsx(W, { size: 16, style: { marginBottom: "-3px", marginRight: "5px" } }), "Use Native Camera App"] })] })] })] }) }) }; export { W as C, ce as I, de as P, se as a, le as b, re as g };
