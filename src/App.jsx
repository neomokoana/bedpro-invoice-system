import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import {
  LayoutDashboard, FileText, Users, Settings, Plus, Search,
  Eye, Mail, Printer, X, Check, Trash2, ArrowLeft, Send,
  Package, TrendingUp, AlertCircle, Clock, ChevronDown,
  CheckCircle2, Circle, Timer, MailCheck, FileEdit, ImageIcon, Zap
} from "lucide-react";

/* ── EMAILJS CONFIG ──────────────────────────────────────────────── */
// Sign up at https://emailjs.com, create an email service, and paste your IDs here.
// The public key is safe to expose in browser code — EmailJS uses it to send emails on your behalf.
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";

/* ── CONSTANTS ─────────────────────────────────────────────────── */
const RED = "#E8191A";
const BLK = "#111111";

const COMPANY = {
  name:"Bed Pro", address:"47 Furniture Avenue, Pretoria, Gauteng, 0001",
  phone:"012 345 6789", email:"info@bedpro.co.za", vatNumber:"4130456789",
};

const PRODUCTS = [
  {id:1,name:"King Size Bed Frame",price:4999,cat:"Beds"},
  {id:2,name:"Queen Size Bed Frame",price:3499,cat:"Beds"},
  {id:3,name:"Single Bed Frame",price:1999,cat:"Beds"},
  {id:4,name:"Orthopaedic Mattress (King)",price:6999,cat:"Mattresses"},
  {id:5,name:"Memory Foam Mattress (Queen)",price:4999,cat:"Mattresses"},
  {id:6,name:"Pillow-Top Mattress (Single)",price:2999,cat:"Mattresses"},
  {id:7,name:"Delivery & Assembly",price:450,cat:"Services"},
  {id:8,name:"Upholstered Headboard",price:1850,cat:"Accessories"},
  {id:9,name:"Bedside Table",price:899,cat:"Accessories"},
  {id:10,name:"Mattress Protector",price:349,cat:"Accessories"},
];

const SEED_CUSTOMERS = [
  {id:1,name:"Themba Nkosi",email:"themba.nkosi@gmail.com",phone:"082 456 7890",address:"14 Oak Street, Pretoria",company:""},
  {id:2,name:"Sarah van der Merwe",email:"sarah@vdminteriors.co.za",phone:"071 234 5678",address:"7 Pine Avenue, Centurion",company:"VDM Interiors"},
  {id:3,name:"Sipho Dlamini",email:"sipho@dlaminigroup.co.za",phone:"083 789 0123",address:"22 Jacaranda Road, Midrand",company:"Dlamini Group"},
  {id:4,name:"Lisa Coetzee",email:"lisa@coetzee.net",phone:"076 345 6789",address:"5 Mimosa Lane, Sandton",company:""},
  {id:5,name:"Ahmed Moosa",email:"ahmed@moosafurn.co.za",phone:"084 567 8901",address:"33 Rose Street, Johannesburg",company:"Moosa Furnishings"},
];

const todayStr  = () => new Date().toISOString().split("T")[0];
const dueDateStr= (d=15) => { const x=new Date(); x.setDate(x.getDate()+d); return x.toISOString().split("T")[0]; };
const past      = (d)    => { const x=new Date(); x.setDate(x.getDate()-d); return x.toISOString().split("T")[0]; };

const SEED_INVOICES = [
  {id:1,number:"BP-0001",customerId:1,status:"paid",issueDate:past(57),dueDate:past(42),paidAt:past(38),
   items:[{id:1,productId:1,description:"King Size Bed Frame",qty:1,unitPrice:4999},{id:2,productId:4,description:"Orthopaedic Mattress (King)",qty:1,unitPrice:6999},{id:3,productId:7,description:"Delivery & Assembly",qty:1,unitPrice:450}],
   taxRate:15,discount:0,notes:"Thank you for choosing Bed Pro!"},
  {id:2,number:"BP-0002",customerId:2,status:"sent",issueDate:past(36),dueDate:dueDateStr(6),
   items:[{id:1,productId:2,description:"Queen Size Bed Frame",qty:2,unitPrice:3499},{id:2,productId:5,description:"Memory Foam Mattress (Queen)",qty:2,unitPrice:4999},{id:3,productId:8,description:"Upholstered Headboard",qty:2,unitPrice:1850},{id:4,productId:7,description:"Delivery & Assembly",qty:1,unitPrice:450}],
   taxRate:15,discount:5,notes:"Guest rooms order for VDM Interiors project."},
  {id:3,number:"BP-0003",customerId:3,status:"unpaid",issueDate:past(17),dueDate:dueDateStr(4),
   items:[{id:1,productId:3,description:"Single Bed Frame",qty:3,unitPrice:1999},{id:2,productId:6,description:"Pillow-Top Mattress (Single)",qty:3,unitPrice:2999}],
   taxRate:15,discount:0,notes:""},
  {id:4,number:"BP-0004",customerId:4,status:"unpaid",issueDate:past(32),dueDate:past(17),
   items:[{id:1,productId:1,description:"King Size Bed Frame",qty:1,unitPrice:4999},{id:2,productId:10,description:"Mattress Protector",qty:2,unitPrice:349}],
   taxRate:15,discount:0,notes:""},
  {id:5,number:"BP-0005",customerId:5,status:"draft",issueDate:todayStr(),dueDate:dueDateStr(15),
   items:[{id:1,productId:2,description:"Queen Size Bed Frame",qty:1,unitPrice:3499},{id:2,productId:5,description:"Memory Foam Mattress (Queen)",qty:1,unitPrice:4999},{id:3,productId:9,description:"Bedside Table",qty:2,unitPrice:899}],
   taxRate:15,discount:10,notes:"Special order for Moosa Furnishings showroom."},
];

/* ── STYLES ───────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

  *, .box-sizing { box-sizing: border-box; }
  body { margin: 0; font-family: 'DM Sans', sans-serif; background: #F6F6F6; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }

  @keyframes toastIn { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* Layout */
  .app-layout { display: flex; height: 100vh; overflow: hidden; font-family: 'DM Sans', sans-serif; background: #F6F6F6; }
  .app-sidebar { width: 220px; background: #111111; display: flex; flex-direction: column; flex-shrink: 0; height: 100vh; position: sticky; top: 0; }
  .app-main { flex: 1; overflow: auto; padding: 32px 36px; max-width: 1100px; }
  .app-main.wide { max-width: none; }

  /* Sidebar */
  .sidebar-logo { padding: 28px 22px 18px; }
  .sidebar-divider { width: calc(100% - 44px); height: 1px; background: #1a1a1a; margin: 0 22px 10px; }
  .sidebar-nav { flex: 1; padding: 4px 12px; }
  .nav-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 9px; border: none; background: transparent; color: #666; font-size: 13px; font-weight: 400; margin-bottom: 3px; cursor: pointer; text-align: left; font-family: inherit; transition: background .12s, color .12s; }
  .nav-btn:hover { background: #1c1c1c; color: #ccc; }
  .nav-btn.active { background: #E8191A; color: #fff; font-weight: 700; }
  .nav-badge { background: #E8191A; color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 10px; font-weight: 800; }
  .sidebar-footer { padding: 16px 22px; border-top: 1px solid #1a1a1a; }
  .sidebar-footer-company { font-size: 11px; color: #444; }
  .sidebar-footer-location { font-size: 10px; color: #333; margin-top: 2px; }

  /* Logo */
  .logo { font-size: 28px; font-weight: 800; letter-spacing: -1; line-height: 1; font-family: 'DM Sans', sans-serif; }
  .logo-bed { color: #E8191A; }
  .logo-pro { color: #111111; }

  /* Cards */
  .card { background: #fff; border-radius: 13px; padding: 24px; border: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
  .card.no-pad { padding: 0; overflow: hidden; }
  .card-sm { padding: 18px 20px; }
  .card-hover { transition: opacity .15s; }
  .card-hover:hover { opacity: 0.85; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s, background .15s; border: none; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary { background: #E8191A; color: #fff; }
  .btn-dark { background: #111111; color: #fff; }
  .btn-outline { background: #fff; color: #444; border: 1px solid #e0e0e0; }
  .btn-ghost { background: transparent; color: #666; border: 1px solid transparent; }
  .btn-success { background: #16a34a; color: #fff; }
  .btn-icon { display: flex; }
  .btn-sm { padding: 8px 14px; font-size: 12px; }
  .btn-xs { padding: 6px 12px; font-size: 12px; border: 1px solid #fca5a5; border-radius: 7px; background: none; cursor: pointer; font-family: inherit; font-weight: 700; color: #E8191A; white-space: nowrap; }

  /* Badges */
  .badge { background: var(--badge-bg, #f1f5f9); color: var(--badge-c, #475569); border-radius: 20px; padding: 4px 11px; font-size: 11px; font-weight: 700; letter-spacing: 0.4; text-transform: uppercase; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--badge-border, #cbd5e1); }
  .badge-paid   { --badge-bg: #dcfce7; --badge-c: #15803d; --badge-border: #86efac; }
  .badge-unpaid { --badge-bg: #fef9c3; --badge-c: #a16207; --badge-border: #fde047; }
  .badge-sent   { --badge-bg: #dbeafe; --badge-c: #1d4ed8; --badge-border: #93c5fd; }
  .badge-draft  { --badge-bg: #f1f5f9; --badge-c: #475569; --badge-border: #cbd5e1; }
  .badge-overdue{ --badge-bg: #fee2e2; --badge-c: #dc2626; --badge-border: #fca5a5; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; }
  .table-header { background: #fafafa; }
  .th { padding: 12px 18px; text-align: left; font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 0.8; text-transform: uppercase; }
  .th-right { text-align: right; }
  .tr { border-top: 1px solid #f8f8f8; }
  .tr-overdue { background: #fff9f9; }
  .tr-paid { background: #fafffe; }
  .tr-hover:hover { background: #fafafa; }
  .td { padding: 14px 18px; font-size: 13px; }
  .td-num { font-weight: 700; color: #111; }
  .td-muted { color: #aaa; }
  .td-dark { color: #444; }

  /* Forms */
  .field { margin-bottom: 16px; }
  .field-label { display: block; font-size: 11px; font-weight: 700; color: #888; margin-bottom: 6px; letter-spacing: 0.6; text-transform: uppercase; }
  .input { width: 100%; padding: 10px 13px; border-radius: 8px; border: 1px solid #e5e5e5; font-size: 14px; outline: none; background: #fff; font-family: inherit; color: #111111; box-sizing: border-box; }
  .input:focus { border-color: #E8191A; }
  .input-error { border-color: #dc2626; }
  .input-search { padding-left: 34px; }
  .error-msg { font-size: 11px; color: #dc2626; margin-top: 4px; font-weight: 600; }
  .textarea { resize: vertical; height: 90px; }

  /* Grid */
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
  .grid-2-280 { display: grid; grid-template-columns: 1fr 280px; gap: 18px; margin-bottom: 24px; }
  .grid-legend { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px; }
  .grid-center { display: flex; align-items: center; justify-content: center; }

  /* Flex */
  .flex { display: flex; }
  .flex-col { display: flex; flex-direction: column; }
  .flex-center { display: flex; align-items: center; }
  .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
  .flex-end { display: flex; justify-content: flex-end; }
  .flex-1 { flex: 1; }
  .flex-shrink-0 { flex-shrink: 0; }
  .gap-6 { gap: 6px; }
  .gap-8 { gap: 8px; }
  .gap-10 { gap: 10px; }
  .gap-12 { gap: 12px; }
  .gap-14 { gap: 14px; }
  .gap-18 { gap: 18px; }

  /* Spacing */
  .mb-0 { margin-bottom: 0; }
  .mb-4 { margin-bottom: 4px; }
  .mb-6 { margin-bottom: 6px; }
  .mb-14 { margin-bottom: 14px; }
  .mb-18 { margin-bottom: 18px; }
  .mb-24 { margin-bottom: 24px; }
  .mb-28 { margin-bottom: 28px; }
  .mb-30 { margin-bottom: 30px; }
  .mt-2 { margin-top: 2px; }
  .mt-3 { margin-top: 3px; }
  .mt-4 { margin-top: 4px; }
  .mt-5 { margin-top: 5px; }
  .mt-6 { margin-top: 6px; }
  .mt-7 { margin-top: 7px; }
  .ml-auto { margin-left: auto; }
  .ml-6 { margin-left: 6px; }

  /* Typography */
  .text-xs { font-size: 10px; }
  .text-sm { font-size: 11px; }
  .text-base { font-size: 13px; }
  .text-lg { font-size: 14px; }
  .text-xl { font-size: 15px; }
  .text-2xl { font-size: 18px; }
  .text-3xl { font-size: 22px; }
  .text-white { color: #fff; }
  .text-red { color: #E8191A; }
  .text-black { color: #111; }
  .text-muted { color: #aaa; }
  .text-dark { color: #444; }
  .text-green { color: #16a34a; }
  .text-orange { color: #d97706; }
  .text-sm-orange { color: #d97706; background: #fef9c3; border-radius: 6px; padding: 3px 9px; border: 1px solid #fde047; font-size: 12px; font-weight: 700; }
  .text-sm-red { color: #dc2626; background: #fee2e2; border-radius: 6px; padding: 3px 9px; border: 1px solid #fca5a5; font-size: 12px; font-weight: 800; }
  .font-bold { font-weight: 700; }
  .font-800 { font-weight: 800; }
  .uppercase { text-transform: uppercase; }
  .tracking-wide { letter-spacing: 0.8; }
  .tracking-wider { letter-spacing: 1px; }
  .leading-tight { line-height: 1; }
  .leading-normal { line-height: 1.4; }
  .leading-loose { line-height: 1.8; }

  /* Status Dropdown */
  .dropdown-ref { position: relative; display: inline-block; }
  .dropdown-trigger { display: inline-flex; align-items: center; gap: 5px; background: transparent; border: none; cursor: pointer; padding: 0; }
  .dropdown-panel { position: absolute; top: calc(100% + 8px); left: 0; z-index: 60; background: #fff; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.18); border: 1px solid #f0f0f0; min-width: 260px; overflow: hidden; }
  .dropdown-header { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
  .dropdown-header-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 0.8; text-transform: uppercase; margin-bottom: 8px; }
  .dropdown-header-row { display: flex; align-items: flex-start; gap: 8px; }
  .dropdown-header-desc { font-size: 11px; color: #888; line-height: 1.4; padding-top: 2px; }
  .dropdown-overdue-alert { margin-top: 8px; font-size: 11px; color: #dc2626; background: #fee2e2; border-radius: 6px; padding: 5px 10px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .dropdown-body { padding: 8px; }
  .dropdown-section-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 0.8; text-transform: uppercase; padding: 4px 8px 8px; }
  .dropdown-option { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; border: none; background: transparent; cursor: pointer; font-family: inherit; text-align: left; transition: background .1s; }
  .dropdown-option:hover { background: #f8f8f8; }
  .dropdown-icon-wrap { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dropdown-option-text { flex: 1; }
  .dropdown-option-title { font-size: 13px; font-weight: 700; color: #111; }
  .dropdown-option-sub { font-size: 11px; color: #aaa; margin-top: 1px; }
  .dropdown-paid-tag { font-size: 10px; font-weight: 800; color: #16a34a; background: #dcfce7; border-radius: 5px; padding: 2px 8px; border: 1px solid #86efac; flex-shrink: 0; }

  /* Status Legend */
  .legend-card { margin-bottom: 20px; padding: 18px 22px; }
  .legend-title { font-size: 12px; font-weight: 700; color: #aaa; letter-spacing: 0.6; text-transform: uppercase; margin-bottom: 14px; }
  .legend-item { background: var(--legend-bg, #f1f5f9); border-radius: 10px; padding: 14px; border: 1px solid var(--legend-border, #cbd5e1); position: relative; }
  .legend-badge-auto { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 800; background: #E8191A; color: #fff; border-radius: 4px; padding: 2px 5px; letter-spacing: 0.4; }
  .legend-item-title { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
  .legend-item-desc { font-size: 11px; opacity: 0.75; line-height: 1.5; }
  .legend-tip { display: flex; align-items: flex-start; gap: 8px; background: #fff1f1; border-radius: 8px; padding: 10px 14px; border: 1px solid #fecaca; font-size: 12px; color: #991b1b; line-height: 1.5; }
  .legend-tip-icon { flex-shrink: 0; margin-top: 1px; }
  .legend-tip-text strong { font-weight: 700; }
  .legend-tip-text em { font-style: normal; color: #ef4444; }

  /* Dashboard */
  .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .dash-title { font-size: 26px; font-weight: 800; color: #111; }
  .dash-subtitle { color: #aaa; font-size: 13px; margin-top: 4px; }
  .stat-accent { opacity: 0.2; margin-top: 2px; }
  .stat-value { font-size: 22px; font-weight: 800; line-height: 1; }
  .stat-label { font-size: 11px; font-weight: 700; color: #bbb; letter-spacing: 0.6; text-transform: uppercase; margin-bottom: 10px; }
  .stat-sub { font-size: 11px; color: #ccc; margin-top: 6px; }
  .dash-alert { background: #fff1f1; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 18px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
  .dash-alert-icon { flex-shrink: 0; }
  .dash-alert-text { flex: 1; font-size: 13px; color: #991b1b; font-weight: 700; }
  .dash-alert-text span { color: #ef4444; margin-left: 6px; font-weight: 400; }
  .table-view-all { font-size: 12px; color: #E8191A; background: none; border: none; cursor: pointer; font-weight: 700; }
  .table-header-row { padding: 18px 22px; border-bottom: 1px solid #f5f5f5; display: flex; justify-content: space-between; align-items: center; }
  .table-header-title { font-size: 14px; font-weight: 700; color: #111; }
  .td-date-overdue { font-weight: 700; color: #E8191A; }
  .td-date-paid { color: #ccc; font-weight: 400; }
  .td-date-normal { color: #444; font-weight: 400; }

  /* Invoice List */
  .invoice-list-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .invoice-list-title { font-size: 26px; font-weight: 800; color: #111; }
  .invoice-list-subtitle { color: #aaa; font-size: 13px; margin-top: 4px; }
  .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 280px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #bbb; }
  .filter-btn { padding: 7px 13px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: background .1s, color .1s; background: #fff; }
  .filter-btn-active { border-color: #111; background: #111; color: #fff; }
  .filter-count { background: rgba(0,0,0,.12); color: inherit; border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 800; }
  .filter-count-dark { background: #f0f0f0; color: #999; }
  .td-company { font-size: 13px; font-weight: 600; color: #333; }
  .td-company-sub { font-size: 11px; color: #bbb; }
  .td-right { text-align: right; }
  .td-green { color: #16a34a; }
  .td-amount { font-size: 14px; font-weight: 800; color: #111; }
  .td-paid-at { font-size: 11px; color: #aaa; }
  .td-dash { font-size: 11px; color: #aaa; }
  .empty-state { padding: 48px; text-align: center; color: #ccc; font-size: 14px; }

  /* Create Invoice */
  .create-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
  .back-btn { background: none; border: none; cursor: pointer; color: #aaa; display: flex; align-items: center; gap: 6px; font-size: 13px; font-family: inherit; }
  .back-btn:hover { color: #666; }
  .create-divider { width: 1px; height: 18px; background: #e0e0e0; }
  .create-title { font-size: 24px; font-weight: 800; color: #111; }
  .create-number { font-size: 13px; color: #bbb; }
  .create-number span { font-weight: 700; color: #E8191A; }
  .section-title { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
  .line-items-table .th { padding: 9px 10px; }
  .line-item-td { padding: 10px 6px 10px 0; width: 42%; }
  .line-item-td-qty { padding: 10px 8px; width: 70px; }
  .line-item-td-price { padding: 10px 8px; width: 130px; }
  .line-item-td-total { padding: 10px 8px; font-size: 14px; font-weight: 700; color: #111; min-width: 110px; }
  .line-item-td-action { padding: 10px 0 10px 6px; }
  .delete-btn { background: none; border: none; cursor: pointer; color: #e0e0e0; padding: 4px; border-radius: 5px; transition: color .1s; }
  .delete-btn:hover { color: #E8191A; }
  .add-line-btn { width: 100%; padding: 9px; border: 1px dashed #ddd; border-radius: 8px; background: none; cursor: pointer; font-size: 12px; color: #bbb; display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; transition: border-color .1s, color .1s; }
  .add-line-btn:hover { border-color: #E8191A; color: #E8191A; }
  .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #888; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
  .summary-total { display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #111; padding-top: 14px; }
  .summary-total-val { color: #E8191A; }
  .customer-preview { background: #fafafa; border-radius: 9px; padding: 12px 14px; font-size: 12px; border-left: 3px solid #E8191A; }
  .customer-preview-name { font-weight: 700; color: #111; margin-bottom: 2px; }
  .customer-preview-company { color: #888; }
  .customer-preview-contact { color: #aaa; margin-top: 3px; line-height: 1.6; }

  /* Preview Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .modal-panel { background: #fff; border-radius: 16px; width: 100%; max-width: 820px; max-height: 92vh; overflow: auto; display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(0,0,0,.3); }
  .modal-header { padding: 16px 26px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; position: sticky; top: 0; background: #fff; z-index: 10; }
  .modal-header-left { display: flex; align-items: center; gap: 10px; }
  .modal-header-title { font-size: 15px; font-weight: 800; color: #111; }
  .modal-header-sub { font-size: 13px; color: #bbb; }
  .modal-header-right { display: flex; gap: 8px; align-items: center; }
  .modal-close { background: none; border: none; cursor: pointer; color: #bbb; padding: 6px; border-radius: 6px; display: flex; }
  .modal-close:hover { color: #666; }
  .modal-alert { padding: 10px 26px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid; font-size: 13px; font-weight: 600; }
  .modal-alert-overdue { background: #fee2e2; border-color: #fecaca; color: #991b1b; }
  .modal-alert-warning { background: #fef9c3; border-color: #fde047; color: #a16207; }
  .modal-body { padding: 36px 44px; flex: 1; }
  .modal-invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; margin-bottom: 32px; border-bottom: 3px solid #E8191A; }
  .modal-company-info { font-size: 11px; color: #bbb; margin-top: 7px; line-height: 1.8; }
  .modal-invoice-num-label { font-size: 28px; font-weight: 800; color: #E8191A; letter-spacing: 2px; text-transform: uppercase; }
  .modal-invoice-num { font-size: 18px; font-weight: 800; color: #111; margin-top: 4px; }
  .modal-invoice-date { font-size: 12px; color: #bbb; margin-top: 6px; line-height: 1.8; }
  .modal-bill-to-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .modal-bill-to-name { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 3px; }
  .modal-bill-to-company { font-size: 13px; color: #888; }
  .modal-bill-to-contact { font-size: 12px; color: #aaa; margin-top: 5px; line-height: 1.8; }
  .modal-amount-due-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; text-align: right; }
  .modal-amount-due { font-size: 38px; font-weight: 800; color: #E8191A; line-height: 1; }
  .modal-amount-due-date { font-size: 12px; color: #aaa; margin-top: 7px; text-align: right; }
  .modal-table .th { padding: 11px 16px; }
  .modal-table .td { padding: 12px 16px; font-size: 13px; }
  .modal-table .td-right { text-align: right; color: #888; }
  .modal-table .td-total { font-weight: 700; color: #111; }
  .modal-totals { margin-left: auto; width: 270px; }
  .modal-totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #888; border-bottom: 1px solid #f5f5f5; }
  .modal-total-final { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 20px; font-weight: 800; color: #111; }
  .modal-total-final-val { color: #E8191A; }
  .modal-notes { margin-top: 24px; padding: 14px 18px; background: #fafafa; border-radius: 8px; border-left: 3px solid #E8191A; font-size: 13px; color: #666; }
  .modal-footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #bbb; }

  /* Email Modal */
  .email-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .email-modal { background: #fff; border-radius: 16px; padding: 32px; width: 460px; box-shadow: 0 24px 80px rgba(0,0,0,.3); }
  .email-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .email-modal-title { font-size: 18px; font-weight: 800; color: #111; }
  .email-modal-sub { font-size: 13px; color: #aaa; margin-top: 3px; }

  /* Customers */
  .search-wrap-lg { position: relative; margin-bottom: 18px; max-width: 300px; }
  .td-name { font-weight: 700; color: #111; }
  .td-settled { color: #16a34a; }

  /* Settings */
  .settings-title { font-size: 26px; font-weight: 800; color: #111; margin-bottom: 6px; }
  .settings-subtitle { color: #aaa; font-size: 13px; margin-bottom: 28px; }
  .settings-section { padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1px solid #f5f5f5; font-size: 14px; font-weight: 700; color: #111; }

  /* Toast */
  .toast { position: fixed; bottom: 24px; right: 24px; z-index: 300; background: #111; color: #fff; border-radius: 10px; padding: 13px 20px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 9px; box-shadow: 0 8px 30px rgba(0,0,0,.25); animation: toastIn .2s ease; }
  .toast-error { background: #E8191A; }
  .toast-check { color: #4ade80; flex-shrink: 0; }

  /* Settings */
  .settings-page { max-width: 860px; }
  .settings-tabs { display: flex; gap: 4px; border-bottom: 2px solid #f0f0f0; margin-bottom: 28px; }
  .settings-tab { padding: 10px 20px; border-radius: 8px 8px 0 0; border: none; background: transparent; color: #888; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, color .15s; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .settings-tab:hover { color: #333; background: #f5f5f5; }
  .settings-tab.active { color: #E8191A; border-bottom-color: #E8191A; background: #fff; }
  .settings-section-title { font-size: 14px; font-weight: 700; color: #111; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1px solid #f5f5f5; }
  .settings-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .settings-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .settings-logo-area { border: 2px dashed #e0e0e0; border-radius: 12px; padding: 28px; text-align: center; transition: border-color .15s; cursor: pointer; }
  .settings-logo-area:hover { border-color: #E8191A; }
  .settings-logo-area.drag-over { border-color: #E8191A; background: #fff1f1; }
  .settings-logo-preview { width: 120px; height: 120px; border-radius: 10px; object-fit: contain; margin: 0 auto 12px; display: block; background: #fafafa; }
  .settings-logo-placeholder { width: 120px; height: 120px; border-radius: 10px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; background: #fafafa; margin-bottom: 12px; }
  .settings-logo-text { font-size: 11px; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 700; }
  .logo-upload-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; color: #444; cursor: pointer; font-family: inherit; margin-top: 8px; transition: border-color .15s, color .15s; }
  .logo-upload-btn:hover { border-color: #E8191A; color: #E8191A; }
  .settings-logo-row { display: flex; gap: 24px; align-items: flex-start; }
  .settings-logo-info { flex: 1; }

  /* Toggle */
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-info { flex: 1; }
  .toggle-title { font-size: 13px; font-weight: 600; color: #111; }
  .toggle-desc { font-size: 11px; color: #aaa; margin-top: 2px; }
  .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: #ccc; border-radius: 24px; cursor: pointer; transition: background .2s; }
  .toggle-slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; }
  .toggle input:checked + .toggle-slider { background: #16a34a; }
  .toggle input:checked + .toggle-slider:before { transform: translateX(20px); }

  /* Live Preview */
  .preview-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; display: block; }
  .preview-mini { border: 1px solid #f0f0f0; border-radius: 10px; padding: 14px 16px; background: #fafafa; margin-top: 12px; }
  .preview-mini-row { display: flex; justify-content: space-between; font-size: 11px; color: #888; padding: 3px 0; }
  .preview-mini-label { color: #bbb; }
  .preview-divider { height: 1px; background: #e8e8e8; margin: 6px 0; }

  /* Print */
  @media print { body { padding: 30px 40px; } }
`;

/* ── STATUS ENGINE ─────────────────────────────────────────────
   Priority:  paid  >  draft  >  overdue (AUTO)  >  sent  >  unpaid
   "overdue" is NEVER stored — it is computed live from the due date.
   ──────────────────────────────────────────────────────────── */
const computeStatus = (inv) => {
  if (inv.status === "paid")  return "paid";
  if (inv.status === "draft") return "draft";
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(inv.dueDate + "T00:00:00");
  if (due < today) return "overdue";
  if (inv.status === "sent")  return "sent";
  return "unpaid";
};

const daysUntilDue = (dueDate) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDate + "T00:00:00");
  return Math.round((due - today) / 86400000);
};

/* ── HELPERS ── */
const fmt     = (n) => `R ${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;
const fmtDate = (s) => { if(!s) return ""; return new Date(s+"T00:00:00").toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}); };
const calcTotals = (items,taxRate,discount) => {
  const sub  = items.reduce((s,i)=>s+(parseFloat(i.qty)||0)*(parseFloat(i.unitPrice)||0),0);
  const disc = sub*(parseFloat(discount)||0)/100;
  const after= sub-disc;
  const tax  = after*(parseFloat(taxRate)||0)/100;
  return {sub,disc,tax,total:after+tax};
};
const nextNumber = (invoices) => {
  const nums = invoices.map(i=>parseInt(i.number.replace("BP-",""))).filter(Boolean);
  return `BP-${String((nums.length?Math.max(...nums):0)+1).padStart(4,"0")}`;
};

const generateInvoiceHTML = (invoice, cust, settings) => {
  const {sub,disc,tax,total}=calcTotals(invoice.items,invoice.taxRate,invoice.discount);
  const company = settings?.company || {};
  const banking = settings?.banking || {};
  const bankInfo = (banking.bankName || banking.accountName || banking.accountNumber || banking.branch)
    ? `<div style="margin-top:16px;padding:12px 14px;background:#fafafa;border-radius:8px;border-left:3px solid #E8191A;font-size:12px;color:#666;">
${banking.bankName ? `<div style="margin-bottom:3px"><strong>BANK:</strong> ${banking.bankName}</div>` : ""}
${banking.branch ? `<div style="margin-bottom:3px"><strong>BRANCH:</strong> ${banking.branch}</div>` : ""}
${banking.accountName ? `<div style="margin-bottom:3px"><strong>ACCOUNT:</strong> ${banking.accountName}</div>` : ""}
${banking.accountNumber ? `<div><strong>ACC NO:</strong> ${banking.accountNumber}</div>` : ""}
</div>` : "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${invoice.number} — ${company.name||"Bed Pro"}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;color:#111;background:#fff;padding:50px 60px;}
.logo{font-size:34px;font-weight:800;letter-spacing:-1px;}.b{color:#E8191A;}.p{color:#111;}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E8191A;padding-bottom:28px;margin-bottom:36px;}
.it{font-size:30px;font-weight:800;color:#E8191A;letter-spacing:2px;text-transform:uppercase;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px;}
.lbl{font-size:10px;font-weight:700;color:#bbb;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
.amt{font-size:32px;font-weight:800;color:#E8191A;}
table{width:100%;border-collapse:collapse;margin-bottom:20px;}thead tr{background:#111;}
th{padding:12px 16px;text-align:left;font-size:10px;font-weight:700;color:#fff;letter-spacing:.5px;text-transform:uppercase;}th.r{text-align:right;}
tbody tr{border-bottom:1px solid #f0f0f0;}td{padding:13px 16px;font-size:13px;}td.r{text-align:right;}td.b{font-weight:700;}
.totals{margin-left:auto;width:260px;}.tr2{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;}
.tt{display:flex;justify-content:space-between;padding:14px 0 0;font-size:20px;font-weight:800;}.ttv{color:#E8191A;}
.notes{margin-top:24px;padding:14px;background:#fafafa;border-radius:8px;border-left:3px solid #E8191A;font-size:13px;color:#666;}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#bbb;}
@media print{body{padding:30px 40px;}}</style></head><body>
<div class="header"><div><div class="logo"><span class="b">Bed</span><span class="p">Pro</span></div>
<div style="font-size:12px;color:#aaa;margin-top:6px;">${company.address||""}</div>
<div style="font-size:12px;color:#aaa;">${company.phone||""} · ${company.email||""} · VAT: ${company.vatNumber||""}</div></div>
<div style="text-align:right;"><div class="it">Invoice</div>
<div style="font-size:20px;font-weight:800;color:#111;margin-top:4px;">${invoice.number}</div>
<div style="font-size:12px;color:#aaa;margin-top:3px;">Issue: ${fmtDate(invoice.issueDate)}</div>
<div style="font-size:12px;color:#aaa;">Due: ${fmtDate(invoice.dueDate)}</div></div></div>
<div class="two"><div><div class="lbl">Bill To</div>
<div style="font-size:15px;font-weight:700;color:#111;margin-bottom:3px;">${cust?.name||"—"}</div>
${cust?.company?`<div style="font-size:13px;color:#888;">${cust.company}</div>`:""}
<div style="font-size:12px;color:#aaa;margin-top:4px;line-height:1.8;">${cust?.email||""}<br>${cust?.phone||""}<br>${cust?.address||""}</div></div>
<div style="text-align:right;"><div class="lbl">Amount Due</div><div class="amt">${fmt(total)}</div>
<div style="font-size:12px;color:#aaa;margin-top:6px;">Due by ${fmtDate(invoice.dueDate)}</div></div></div>
<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead>
<tbody>${invoice.items.map(i=>`<tr><td>${i.description}</td><td class="r">${i.qty}</td><td class="r">${fmt(i.unitPrice)}</td><td class="r b">${fmt(i.qty*i.unitPrice)}</td></tr>`).join("")}</tbody></table>
<div class="totals"><div class="tr2"><span>Subtotal</span><span>${fmt(sub)}</span></div>
${invoice.discount>0?`<div class="tr2"><span>Discount (${invoice.discount}%)</span><span>−${fmt(disc)}</span></div>`:""}
<div class="tr2"><span>VAT (${invoice.taxRate}%)</span><span>${fmt(tax)}</span></div>
<div class="tt"><span>TOTAL DUE</span><span class="ttv">${fmt(total)}</span></div></div>
${invoice.notes?`<div class="notes">${invoice.notes}</div>`:""}
${bankInfo}
<div class="footer"><strong style="color:#111;">${company.name||"Bed Pro"}</strong> · · Thank you for your business! · · ${company.address||""}</div>
</body></html>`;
};

/* ── STATUS CONFIG ── */
const STATUS_CFG = {
  paid:    {label:"Paid",    bg:"#dcfce7",c:"#15803d", border:"#86efac", icon:CheckCircle2, desc:"Payment received & confirmed"},
  unpaid:  {label:"Unpaid",  bg:"#fef9c3",c:"#a16207", border:"#fde047", icon:Circle,       desc:"Invoice sent, awaiting payment"},
  sent:    {label:"Sent",    bg:"#dbeafe",c:"#1d4ed8", border:"#93c5fd", icon:MailCheck,    desc:"Email sent to client"},
  draft:   {label:"Draft",   bg:"#f1f5f5",c:"#475569", border:"#cbd5e1", icon:FileEdit,     desc:"Not yet finalised or sent"},
  overdue: {label:"Overdue", bg:"#fee2e2",c:"#dc2626", border:"#fca5a5", icon:AlertCircle,  desc:"Past due date — follow up!"},
};

const STATUS_TRANSITIONS = {
  draft:   [{s:"unpaid",label:"Mark as Unpaid",sub:"Finalise & make active"},{s:"paid",label:"Mark as Paid",sub:"Record payment received"}],
  unpaid:  [{s:"paid",  label:"Mark as Paid",  sub:"Record payment received"},{s:"sent",label:"Mark as Sent",sub:"Confirm email was sent"},{s:"draft",label:"Revert to Draft",sub:"Put back in draft"}],
  sent:    [{s:"paid",  label:"Mark as Paid",  sub:"Record payment received"},{s:"unpaid",label:"Mark as Unpaid",sub:"Revert to unpaid"}],
  overdue: [{s:"paid",  label:"Mark as Paid",  sub:"Record payment received"},{s:"unpaid",label:"Reset to Unpaid",sub:"Reset overdue status"}],
  paid:    [{s:"unpaid",label:"Undo — Mark Unpaid",sub:"Reverse paid status"}],
};

/* ── SHARED UI ── */
const BedProLogo = ({size=28, src}) => src ? (
  <img src={src} alt="Company logo" style={{height:size,width:'auto',maxWidth:120}}/>
) : (
  <span className="logo" style={{fontSize:size}}>
    <span className="logo-bed">Bed</span><span className="logo-pro">Pro</span>
  </span>
);

const Badge = ({status}) => {
  const s = STATUS_CFG[status]||STATUS_CFG.draft;
  const Icon = s.icon;
  return (
    <span className={`badge badge-${status}`}>
      <Icon size={10}/>{s.label}
    </span>
  );
};

const Btn = ({children,onClick,variant="primary",disabled,className="",icon}) => (
  <button onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>
    {icon&&<span className="btn-icon">{icon}</span>}{children}
  </button>
);

const Card  = ({children,className=""}) => <div className={`card ${className}`}>{children}</div>;
const Field = ({label,error,children}) => (
  <div className="field">
    <label className="field-label">{label}</label>
    {children}
    {error && <div className="error-msg">{error}</div>}
  </div>
);
const TH = ({children,right}) => <th className={`th${right?" th-right":""}`}>{children}</th>;

/* ── STATUS DROPDOWN ── */
const StatusDropdown = ({invoice, onStatusChange}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const computed     = computeStatus(invoice);
  const transitions  = STATUS_TRANSITIONS[computed] || [];

  useEffect(() => {
    const h = (e) => { if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);

  return (
    <div ref={ref} className="dropdown-ref">
      <button onClick={()=>setOpen(!open)} className="dropdown-trigger">
        <Badge status={computed}/>
        {transitions.length>0 && <ChevronDown size={12} color="#bbb"/>}
      </button>

      {open && (
        <div className="dropdown-panel">
          <div className="dropdown-header">
            <div className="dropdown-header-label">Current Status</div>
            <div className="dropdown-header-row">
              <Badge status={computed}/>
              <div className="dropdown-header-desc">{STATUS_CFG[computed]?.desc}</div>
            </div>
            {computed==="overdue"&&(
              <div className="dropdown-overdue-alert">
                <AlertCircle size={11}/> Auto-detected · Due date was {Math.abs(daysUntilDue(invoice.dueDate))} days ago
              </div>
            )}
          </div>

          {transitions.length>0 && (
            <div className="dropdown-body">
              <div className="dropdown-section-label">Change to</div>
              {transitions.map(t => {
                const cfg = STATUS_CFG[t.s];
                const Icon = cfg.icon;
                return (
                  <button key={t.s} onClick={()=>{onStatusChange(invoice.id,t.s);setOpen(false);}} className="dropdown-option">
                    <span className="dropdown-icon-wrap" style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>
                      <Icon size={14} color={cfg.c}/>
                    </span>
                    <div className="dropdown-option-text">
                      <div className="dropdown-option-title">{t.label}</div>
                      <div className="dropdown-option-sub">{t.sub}</div>
                    </div>
                    {t.s==="paid"&&<span className="dropdown-paid-tag">✓ PAID</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── STATUS LEGEND ── */
const StatusLegend = () => (
  <Card className="legend-card">
    <div className="legend-title">How Status Works — click any status badge to change it</div>
    <div className="grid-legend">
      {Object.entries(STATUS_CFG).map(([key,s]) => {
        const Icon = s.icon;
        const isAuto = key==="overdue";
        return (
          <div key={key} className="legend-item" style={{"--legend-bg":s.bg,"--legend-border":s.border}}>
            {isAuto&&<span className="legend-badge-auto">AUTO</span>}
            <Icon size={20} color={s.c} style={{marginBottom:8}}/>
            <div className="legend-item-title" style={{color:s.c}}>{s.label}</div>
            <div className="legend-item-desc" style={{color:s.c}}>{s.desc}</div>
          </div>
        );
      })}
    </div>
    <div className="legend-tip">
      <AlertCircle size={14} color={RED} className="legend-tip-icon"/>
      <span className="legend-tip-text">
        <strong>Overdue is automatic</strong> — when a due date passes and the invoice is still unpaid or sent, the system flags it as overdue. You do not need to manually set this. Simply click the badge → <em>"Mark as Paid"</em> once payment arrives.
      </span>
    </div>
  </Card>
);

/* ── SIDEBAR ── */
const NAV_ITEMS = [
  {id:"dashboard",label:"Dashboard",  icon:LayoutDashboard},
  {id:"invoices", label:"Invoices",   icon:FileText},
  {id:"customers",label:"Customers",  icon:Users},
  {id:"settings", label:"Settings",   icon:Settings},
];

const Sidebar = ({view,onNav,invoices}) => {
  const overdueCount = invoices.filter(i=>computeStatus(i)==="overdue").length;
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo"><BedProLogo size={26}/><div className="text-sm" style={{color:"#444",marginTop:3,letterSpacing:1.2}}>Invoice Manager</div></div>
      <div className="sidebar-divider"/>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(n=>{
          const active=view===n.id||(n.id==="invoices"&&view==="create-invoice");
          const Icon=n.icon;
          return (
            <button key={n.id} onClick={()=>onNav(n.id)} className={`nav-btn${active?" active":""}`}>
              <Icon size={15}/><span className="flex-1">{n.label}</span>
              {n.id==="invoices"&&overdueCount>0&&<span className="nav-badge">{overdueCount}</span>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-company">Bed Pro © 2026</div>
        <div className="sidebar-footer-location">Pretoria, South Africa</div>
      </div>
    </aside>
  );
};

/* ── DASHBOARD ── */
const Dashboard = ({invoices,customers,settings,onNav,onPreview,onStatusChange}) => {
  const enriched = invoices.map(i=>({...i,_s:computeStatus(i)}));
  const stats = enriched.reduce((a,inv)=>{
    const {total}=calcTotals(inv.items,inv.taxRate,inv.discount);
    if(inv._s==="paid")    a.revenue+=total;
    if(inv._s==="unpaid"||inv._s==="sent"||inv._s==="overdue") a.outstanding+=total;
    if(inv._s==="overdue") a.overdue++;
    a.total++;
    return a;
  },{revenue:0,outstanding:0,overdue:0,total:0});
  const recent=[...invoices].sort((a,b)=>b.id-a.id).slice(0,5);
  return (
    <div className="app-main wide">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Welcome back — here's your business overview</p>
        </div>
        <Btn onClick={()=>onNav("create-invoice")} icon={<Plus size={14}/>}>New Invoice</Btn>
      </div>

      <div className="grid-4" style={{marginBottom:stats.overdue>0?16:28}}>
        {[{label:"Total Invoices",value:stats.total,accent:BLK,icon:<FileText size={18}/>,sub:"All time"},
          {label:"Revenue Collected",value:fmt(stats.revenue),accent:"#16a34a",icon:<TrendingUp size={18}/>,sub:"Paid invoices"},
          {label:"Outstanding",value:fmt(stats.outstanding),accent:"#d97706",icon:<Clock size={18}/>,sub:"Awaiting payment"},
          {label:"Overdue",value:stats.overdue,accent:RED,icon:<AlertCircle size={18}/>,sub:"Needs attention"},
        ].map(s=>(
          <Card key={s.label} className="card-sm">
            <div className="flex flex-between">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{color:s.accent}}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
              <div className="stat-accent" style={{color:s.accent}}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {stats.overdue>0&&settings?.notifications?.overdueAlerts!==false&&(
        <div className="dash-alert">
          <AlertCircle size={18} color={RED} className="dash-alert-icon"/>
          <div className="dash-alert-text">
            {stats.overdue} invoice{stats.overdue!==1?"s":""} overdue
            <span>— auto-detected from due dates. Click the status badge to mark as paid.</span>
          </div>
          <button onClick={()=>onNav("invoices")} className="btn-xs">View Overdue →</button>
        </div>
      )}

      <Card className="no-pad">
        <div className="table-header-row">
          <span className="table-header-title">Recent Invoices</span>
          <button onClick={()=>onNav("invoices")} className="table-view-all">View All →</button>
        </div>
        <table>
          <thead><tr className="table-header"><TH>Invoice #</TH><TH>Customer</TH><TH>Due Date</TH><TH>Amount</TH><TH>Status</TH><TH></TH></tr></thead>
          <tbody>
            {recent.map(inv=>{
              const cust=customers.find(c=>c.id===inv.customerId);
              const {total}=calcTotals(inv.items,inv.taxRate,inv.discount);
              const cs=computeStatus(inv);
              const days=daysUntilDue(inv.dueDate);
              return (
                <tr key={inv.id} className={`tr ${cs==="overdue"?"tr-overdue":""} tr-hover`}>
                  <td className="td td-num">{inv.number}</td>
                  <td className="td td-dark">{cust?.name||"—"}</td>
                  <td className="td">
                    <div className={cs==="overdue"?"td-date-overdue":cs==="paid"?"td-date-paid":"td-date-normal"} style={{fontWeight:cs==="overdue"?700:400}}>{fmtDate(inv.dueDate)}</div>
                    {cs!=="paid"&&cs!=="draft"&&<div style={{fontSize:11,color:cs==="overdue"?RED:days<=3?"#d97706":"#bbb",fontWeight:600,marginTop:2}}>
                      {cs==="overdue"?`${Math.abs(days)}d overdue`:days===0?"Due today!":days===1?"Due tomorrow":`${days}d left`}
                    </div>}
                  </td>
                  <td className="td td-amount" style={{color:cs==="paid"?"#16a34a":BLK}}>{fmt(total)}</td>
                  <td className="td"><StatusDropdown invoice={inv} onStatusChange={onStatusChange}/></td>
                  <td className="td">
                    <button onClick={()=>onPreview(inv)} className="btn btn-outline btn-sm"><Eye size={12}/> View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ── INVOICE LIST ── */
const InvoiceList = ({invoices,customers,onPreview,onNav,onStatusChange}) => {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const filtered=invoices.filter(inv=>{
    const cust=customers.find(c=>c.id===inv.customerId);
    const q=search.toLowerCase();
    const match=inv.number.toLowerCase().includes(q)||(cust?.name||"").toLowerCase().includes(q);
    const cs=computeStatus(inv);
    return match&&(filter==="all"||cs===filter);
  });
  const counts=invoices.reduce((a,inv)=>{const s=computeStatus(inv);a[s]=(a[s]||0)+1;a.all=(a.all||0)+1;return a;},{});
  return (
    <div className="app-main wide">
      <div className="invoice-list-header">
        <div>
          <h1 className="invoice-list-title">Invoices</h1>
          <p className="invoice-list-subtitle">{invoices.length} invoices total</p>
        </div>
        <Btn onClick={()=>onNav("create-invoice")} icon={<Plus size={14}/>}>New Invoice</Btn>
      </div>

      <StatusLegend/>

      <div className="flex gap-10 mb-18" style={{flexWrap:"wrap",alignItems:"center"}}>
        <div className="search-wrap">
          <Search size={13} className="search-icon"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices…" className="input input-search"/>
        </div>
        <div className="flex gap-6" style={{flexWrap:"wrap"}}>
          {["all","draft","unpaid","sent","overdue","paid"].map(f=>{
            const cnt=counts[f]||0;
            const cfg=f==="all"?null:STATUS_CFG[f];
            const active=filter===f;
            return (
              <button key={f} onClick={()=>setFilter(f)} className={`filter-btn${active?" filter-btn-active":""}`}
                style={{borderColor:active?(f==="all"?BLK:cfg.border):"#e5e5e5",background:active?(f==="all"?BLK:cfg.bg):"#fff",color:active?(f==="all"?"#fff":cfg.c):"#666"}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                {cnt>0&&<span className={`filter-count${active?"":" filter-count-dark"}`}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="no-pad">
        <table>
          <thead><tr className="table-header">
            <TH>Invoice #</TH><TH>Customer</TH><TH>Issue Date</TH><TH>Due Date</TH><TH right>Amount</TH>
            <TH>Status</TH><TH>Urgency</TH><TH></TH>
          </tr></thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={8} className="empty-state">No invoices found</td></tr>
            ):filtered.map(inv=>{
              const cust=customers.find(c=>c.id===inv.customerId);
              const {total}=calcTotals(inv.items,inv.taxRate,inv.discount);
              const cs=computeStatus(inv);
              const days=daysUntilDue(inv.dueDate);
              return (
                <tr key={inv.id} className={`tr card-hover`}>
                  <td className="td td-num">{inv.number}</td>
                  <td className="td">
                    <div className="td-company">{cust?.name||"—"}</div>
                    {cust?.company&&<div className="td-company-sub">{cust.company}</div>}
                  </td>
                  <td className="td td-muted">{fmtDate(inv.issueDate)}</td>
                  <td className="td" style={{color:cs==="overdue"?RED:cs==="paid"?"#ccc":"#555",fontWeight:cs==="overdue"?700:400}}>{fmtDate(inv.dueDate)}</td>
                  <td className="td td-right td-amount" style={{color:cs==="paid"?"#16a34a":BLK}}>{fmt(total)}</td>
                  <td className="td"><StatusDropdown invoice={inv} onStatusChange={onStatusChange}/></td>
                  <td className="td">
                    {cs==="paid"?<span className="td-paid-at">Paid {inv.paidAt?fmtDate(inv.paidAt):""}</span>
                    :cs==="draft"?<span className="td-dash">—</span>
                    :cs==="overdue"?<span className="text-sm-red">{Math.abs(days)}d overdue</span>
                    :days===0?<span className="text-sm-orange">Due today!</span>
                    :days<=3?<span className="text-sm-orange">{days}d left</span>
                    :<span className="td-muted">{days}d left</span>}
                  </td>
                  <td className="td">
                    <button onClick={()=>onPreview(inv)} className="btn btn-outline btn-sm"><Eye size={12}/> View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ── CREATE INVOICE ── */
const CreateInvoice = ({customers,invoices,onSave,onCancel}) => {
  const [form,setForm]=useState({customerId:"",issueDate:todayStr(),dueDate:dueDateStr(15),items:[{id:1,productId:"",description:"",qty:1,unitPrice:0}],taxRate:15,discount:0,notes:""});
  const [counter,setCounter]=useState(2);
  const [errors,setErrors]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const addItem=()=>{setForm(p=>({...p,items:[...p.items,{id:counter,productId:"",description:"",qty:1,unitPrice:0}]}));setCounter(c=>c+1);};
  const removeItem=(id)=>setForm(p=>({...p,items:p.items.filter(i=>i.id!==id)}));
  const updateItem=(id,k,v)=>setForm(p=>({...p,items:p.items.map(item=>{if(item.id!==id)return item;const u={...item,[k]:v};if(k==="productId"){const prod=PRODUCTS.find(pr=>pr.id===parseInt(v));if(prod){u.description=prod.name;u.unitPrice=prod.price;}}return u;})}));
  const {sub,disc,tax,total}=calcTotals(form.items,form.taxRate,form.discount);

  const validate = () => {
    const errs = {};
    if (!form.customerId) errs.customerId = "Please select a customer.";
    if (form.items.some(i=>!i.description)) errs.items = "All line items need a description.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave=(status)=>{ if(!validate()) return; onSave({...form,id:Date.now(),number:nextNumber(invoices),customerId:parseInt(form.customerId),status}); };
  return (
    <div className="app-main" style={{maxWidth:940}}>
      <div className="create-header">
        <button onClick={onCancel} className="back-btn"><ArrowLeft size={15}/> Back</button>
        <div className="create-divider"/>
        <h1 className="create-title">New Invoice</h1>
        <div className="ml-auto">
          <span className="create-number">Number: </span>
          <span className="create-number"><span>{nextNumber(invoices)}</span></span>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <div className="section-title"><Users size={14} color={RED}/> Customer Details</div>
          <Field label="Select Customer" error={errors.customerId}>
            <select value={form.customerId} onChange={e=>{set("customerId",e.target.value);setErrors(p=>({...p,customerId:undefined}));}} className={`input${errors.customerId?" input-error":""}`}>
              <option value="">— Choose a customer —</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` — ${c.company}`:""}</option>)}
            </select>
          </Field>
          {form.customerId&&(()=>{const c=customers.find(x=>x.id===parseInt(form.customerId));if(!c)return null;return(
            <div className="customer-preview">
              <div className="customer-preview-name">{c.name}</div>
              {c.company&&<div className="customer-preview-company">{c.company}</div>}
              <div className="customer-preview-contact">{c.email}<br/>{c.phone}</div>
            </div>
          );})()}
        </Card>
        <Card>
          <div className="section-title"><FileText size={14} color={RED}/> Invoice Details</div>
          <Field label="Issue Date"><input type="date" value={form.issueDate} onChange={e=>set("issueDate",e.target.value)} className="input"/></Field>
          <Field label="Due Date"><input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} className="input"/></Field>
        </Card>
      </div>

      <Card className="mb-18">
        <div className="section-title"><Package size={14} color={RED}/> Line Items</div>
        {errors.items && <div className="error-msg" style={{marginBottom:12}}>{errors.items}</div>}
        <table className="line-items-table">
          <thead><tr className="table-header">{["Product / Description","Qty","Unit Price (R)","Line Total",""].map((h,i)=><th key={i} className="th">{h}</th>)}</tr></thead>
          <tbody>{form.items.map(item=>(
            <tr key={item.id} className="tr">
              <td className="line-item-td">
                <select value={item.productId} onChange={e=>updateItem(item.id,"productId",e.target.value)} className="input" style={{marginBottom:6,fontSize:12}}>
                  <option value="">— Select product —</option>
                  {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                </select>
                <input value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} placeholder="Custom description…" className="input" style={{fontSize:12}}/>
              </td>
              <td className="line-item-td-qty"><input type="number" min="1" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} className="input" style={{width:60,textAlign:"center",padding:"10px 6px"}}/></td>
              <td className="line-item-td-price"><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updateItem(item.id,"unitPrice",e.target.value)} className="input" style={{width:120}}/></td>
              <td className="line-item-td-total">{fmt((parseFloat(item.qty)||0)*(parseFloat(item.unitPrice)||0))}</td>
              <td className="line-item-td-action">
                {form.items.length>1&&<button onClick={()=>removeItem(item.id)} className="delete-btn"><Trash2 size={14}/></button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
        <button onClick={addItem} className="add-line-btn"><Plus size={13}/> Add Line Item</button>
      </Card>

      <div className="grid-2-280">
        <Card>
          <Field label="Notes / Payment Terms"><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Thank you for your business…" className="input textarea"/></Field>
          <div className="grid-2" style={{gap:12,marginTop:4}}>
            <Field label="VAT %"><input type="number" min="0" max="100" value={form.taxRate} onChange={e=>set("taxRate",e.target.value)} className="input"/></Field>
            <Field label="Discount %"><input type="number" min="0" max="100" value={form.discount} onChange={e=>set("discount",e.target.value)} className="input"/></Field>
          </div>
        </Card>
        <Card>
          <div className="section-title mb-16">Invoice Summary</div>
          {[["Subtotal",fmt(sub)],...(form.discount>0?[[`Discount (${form.discount}%)`,`−${fmt(disc)}`]]:[]),[`VAT (${form.taxRate}%)`,fmt(tax)]].map(([l,v])=>(
            <div key={l} className="summary-row"><span>{l}</span><span>{v}</span></div>
          ))}
          <div className="summary-total"><span>TOTAL</span><span className="summary-total-val">{fmt(total)}</span></div>
        </Card>
      </div>

      <div className="flex gap-10 flex-end">
        <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
        <Btn onClick={()=>handleSave("draft")} variant="outline">Save as Draft</Btn>
        <Btn onClick={()=>handleSave("unpaid")} icon={<Check size={14}/>}>Create Invoice</Btn>
      </div>
    </div>
  );
};

/* ── PREVIEW MODAL ── */
const InvoicePreviewModal = ({invoice,customers,settings,onClose,onEmailSent,onStatusChange}) => {
  const [showEmail,setShowEmail]=useState(false);
  const [emailTo,setEmailTo]=useState("");
  const [sending,setSending]=useState(false);
  const printRef = useRef(null);
  const cust=customers.find(c=>c.id===invoice.customerId);
  const {sub,disc,tax,total}=calcTotals(invoice.items,invoice.taxRate,invoice.discount);
  const computed=computeStatus(invoice);
  const days=daysUntilDue(invoice.dueDate);
  useEffect(()=>{if(cust?.email)setEmailTo(cust.email);},[cust]);

  const handlePrint = () => {
    if (printRef.current) {
      const w = window.open("","_blank","width=900,height=750");
      w.document.write(generateInvoiceHTML(invoice, cust, settings));
      w.document.close();
    }
  };

  const handleSendEmail = async () => {
    const ejs = settings?.emailjs;
    if (!ejs?.serviceId || !ejs?.templateId || !ejs?.publicKey) {
      alert("EmailJS is not configured. Please add your EmailJS credentials in Settings → Company Info.");
      setShowEmail(false);
      return;
    }
    setSending(true);
    try {
      const html = generateInvoiceHTML(invoice, cust, settings);
      await emailjs.send(ejs.serviceId, ejs.templateId, {
        from_name:    settings?.company?.name || "Bed Pro",
        to_email:     emailTo,
        invoice_number: invoice.number,
        amount:       fmt(calcTotals(invoice.items,invoice.taxRate,invoice.discount).total),
        due_date:     fmtDate(invoice.dueDate),
        message:      `Dear ${cust?.name || "Client"},\n\nPlease find invoice ${invoice.number} attached.\n\nPayment due by ${fmtDate(invoice.dueDate)}.\n\nKind regards,\n${settings?.company?.name || "Bed Pro"}`,
        html,
      }, ejs.publicKey);
      onStatusChange(invoice.id,"sent");
      setShowEmail(false);
      onEmailSent();
      onClose();
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Failed to send email. Please check your EmailJS settings in Settings → Company Info.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-header-title">Invoice Preview</span>
            <span className="modal-header-sub">· {invoice.number}</span>
            <StatusDropdown invoice={invoice} onStatusChange={onStatusChange}/>
          </div>
          <div className="modal-header-right">
            {computed!=="paid"&&computed!=="draft"&&(
              <Btn onClick={()=>{onStatusChange(invoice.id,"paid");onClose();}} variant="success" icon={<CheckCircle2 size={13}/>} className="btn-sm">Mark as Paid</Btn>
            )}
            <Btn onClick={()=>setShowEmail(true)} variant="outline" icon={<Mail size={13}/>} className="btn-sm">Send Email</Btn>
            <Btn onClick={handlePrint} variant="dark" icon={<Printer size={13}/>} className="btn-sm">Print</Btn>
            <button onClick={onClose} className="modal-close"><X size={18}/></button>
          </div>
        </div>

        {computed==="overdue"&&(<div className="modal-alert modal-alert-overdue"><AlertCircle size={14} style={{flexShrink:0}}/><span>This invoice is {Math.abs(days)} day{Math.abs(days)!==1?"s":""} overdue (auto-detected). Click "Mark as Paid" when payment is received.</span></div>)}
        {computed!=="paid"&&computed!=="draft"&&days>=0&&days<=3&&(<div className="modal-alert modal-alert-warning"><Clock size={14} style={{flexShrink:0}}/><span>{days===0?"Due today!":days===1?"Due tomorrow!":`Due in ${days} days`} — follow up if not yet paid.</span></div>)}

        <div className="modal-body" ref={printRef}>
          <div className="modal-invoice-header">
            <div>
              <BedProLogo size={32} src={settings?.company?.logo}/>
              <div className="modal-company-info">{COMPANY.address}<br/>{COMPANY.phone} · {COMPANY.email}<br/>VAT: {COMPANY.vatNumber}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="modal-invoice-num-label">Invoice</div>
              <div className="modal-invoice-num">{invoice.number}</div>
              <div className="modal-invoice-date">Issue: {fmtDate(invoice.issueDate)}<br/>Due: {fmtDate(invoice.dueDate)}</div>
            </div>
          </div>

          <div className="two" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,marginBottom:32}}>
            <div>
              <div className="modal-bill-to-label">Bill To</div>
              <div className="modal-bill-to-name">{cust?.name||"—"}</div>
              {cust?.company&&<div className="modal-bill-to-company">{cust.company}</div>}
              <div className="modal-bill-to-contact">{cust?.email}<br/>{cust?.phone}<br/>{cust?.address}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="modal-amount-due-label">Amount Due</div>
              <div className="modal-amount-due">{fmt(total)}</div>
              <div className="modal-amount-due-date">Due by {fmtDate(invoice.dueDate)}</div>
            </div>
          </div>

          <table>
            <thead><tr style={{background:BLK}}>{["Description","Qty","Unit Price","Total"].map((h,i)=><th key={h} className="th" style={{padding:"11px 16px",textAlign:i===0?"left":"right"}}>{h}</th>)}</tr></thead>
            <tbody>{invoice.items.map(item=><tr key={item.id} className="tr"><td className="td">{item.description}</td><td className="td td-right">{item.qty}</td><td className="td td-right">{fmt(item.unitPrice)}</td><td className="td td-right td-total">{fmt(item.qty*item.unitPrice)}</td></tr>)}</tbody>
          </table>

          <div className="modal-totals">
            {[["Subtotal",fmt(sub)],...(invoice.discount>0?[[`Discount (${invoice.discount}%)`,`−${fmt(disc)}`]]:[]),[`VAT (${invoice.taxRate}%)`,fmt(tax)]].map(([l,v])=><div key={l} className="modal-totals-row"><span>{l}</span><span>{v}</span></div>)}
            <div className="modal-total-final"><span>TOTAL DUE</span><span className="modal-total-final-val">{fmt(total)}</span></div>
          </div>

          {invoice.notes&&<div className="modal-notes">{invoice.notes}</div>}
          {(settings?.banking?.bankName || settings?.banking?.accountName || settings?.banking?.accountNumber || settings?.banking?.branch) && (
            <div style={{marginTop:20,padding:"14px 18px",background:"#fafafa",borderRadius:8,borderLeft:`3px solid ${RED}`,fontSize:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#bbb",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Banking Details</div>
              {settings.banking.bankName && <div style={{display:"flex",gap:8,marginBottom:3}}><span style={{color:"#aaa",minWidth:80}}>Bank</span><span style={{color:"#333",fontWeight:600}}>{settings.banking.bankName}</span></div>}
              {settings.banking.branch && <div style={{display:"flex",gap:8,marginBottom:3}}><span style={{color:"#aaa",minWidth:80}}>Branch</span><span style={{color:"#333",fontWeight:600}}>{settings.banking.branch}</span></div>}
              {settings.banking.accountName && <div style={{display:"flex",gap:8,marginBottom:3}}><span style={{color:"#aaa",minWidth:80}}>Account</span><span style={{color:"#333",fontWeight:600}}>{settings.banking.accountName}</span></div>}
              {settings.banking.accountNumber && <div style={{display:"flex",gap:8}}><span style={{color:"#aaa",minWidth:80}}>Acc No.</span><span style={{color:"#333",fontWeight:600}}>{settings.banking.accountNumber}</span></div>}
            </div>
          )}
          <div className="modal-footer"><BedProLogo size={14}/> · · Thank you for your business! · · {settings?.company?.address || COMPANY.address}</div>
        </div>
      </div>

      {showEmail&&(
        <div className="email-modal-overlay">
          <div className="email-modal">
            <div className="email-modal-header">
              <div>
                <div className="email-modal-title">Send Invoice</div>
                <p className="email-modal-sub">PDF attached · Status will auto-update to <Badge status="sent"/></p>
              </div>
              <button onClick={()=>setShowEmail(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#bbb"}}><X size={18}/></button>
            </div>
            <Field label="To"><input value={emailTo} onChange={e=>setEmailTo(e.target.value)} className="input"/></Field>
            <Field label="Subject"><input defaultValue={`Invoice ${invoice.number} from Bed Pro`} className="input"/></Field>
            <Field label="Message"><textarea defaultValue={`Dear ${cust?.name||"Client"},\n\nPlease find your invoice ${invoice.number} attached for ${fmt(total)}.\n\nPayment due by ${fmtDate(invoice.dueDate)}.\n\nKind regards,\nBed Pro`} className="input" style={{height:110,resize:"none"}}/></Field>
            <div className="flex gap-10 flex-end" style={{marginTop:4}}>
              <Btn onClick={()=>setShowEmail(false)} variant="outline">Cancel</Btn>
              <Btn onClick={handleSendEmail} disabled={sending} icon={sending?null:<Send size={13}/>}>{sending?"Sending…":"Send Invoice"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── CUSTOMERS ── */
const Customers = ({customers,invoices}) => {
  const [search,setSearch]=useState("");
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.email.toLowerCase().includes(search.toLowerCase()));
  const getOutstanding=(id)=>invoices.filter(i=>i.customerId===id&&["unpaid","sent","overdue"].includes(computeStatus(i))).reduce((s,inv)=>s+calcTotals(inv.items,inv.taxRate,inv.discount).total,0);
  return (
    <div className="app-main" style={{maxWidth:1000}}>
      <div className="mb-24">
        <h1 className="dash-title">Customers</h1>
        <p className="dash-subtitle">{customers.length} customers</p>
      </div>
      <div className="search-wrap-lg"><Search size={13} className="search-icon"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" className="input input-search"/></div>
      <Card className="no-pad">
        <table>
          <thead><tr className="table-header"><TH>Name</TH><TH>Company</TH><TH>Email</TH><TH>Phone</TH><TH right>Outstanding</TH><TH>Invoices</TH></tr></thead>
          <tbody>{filtered.map(c=>{const bal=getOutstanding(c.id);const count=invoices.filter(i=>i.customerId===c.id).length;return(
            <tr key={c.id} className="tr tr-hover">
              <td className="td td-name">{c.name}</td>
              <td className="td td-muted">{c.company||"—"}</td>
              <td className="td td-dark">{c.email}</td>
              <td className="td td-dark">{c.phone}</td>
              <td className="td td-right td-amount" style={{color:bal>0?RED:"#16a34a"}}>{bal>0?fmt(bal):"Settled ✓"}</td>
              <td className="td td-muted">{count}</td>
            </tr>
          );})}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ── SETTINGS ── */
const LogoUpload = ({value, onChange}) => {
  const [drag, setDrag] = useState(false);
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="settings-logo-row">
      <div>
        {value ? (
          <img src={value} alt="Logo" className="settings-logo-preview"/>
        ) : (
          <div className="settings-logo-placeholder">
            <BedProLogo size={48}/>
          </div>
        )}
        <label className="logo-upload-btn">
          <ImageIcon size={13}/> Upload Logo
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        </label>
        {value && (
          <button onClick={()=>onChange("")} className="logo-upload-btn" style={{marginLeft:8,borderColor:"#fca5a5",color:"#dc2626"}}>
            <Trash2 size={13}/> Remove
          </button>
        )}
      </div>
      <div className="settings-logo-info">
        <div className="field-label">Logo Preview</div>
        <div style={{fontSize:11,color:"#aaa",marginTop:4,lineHeight:1.5}}>Upload a PNG or JPG (max 2MB). Recommended: 300×300px transparent background.</div>
      </div>
    </div>
  );
};

const Toggle = ({checked, onChange, label, desc}) => (
  <div className="toggle-row">
    <div className="toggle-info">
      <div className="toggle-title">{label}</div>
      {desc && <div className="toggle-desc">{desc}</div>}
    </div>
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)}/>
      <span className="toggle-slider"/>
    </label>
  </div>
);

const SettingsPanel = ({settings, onSave}) => {
  const [tab, setTab] = useState("company");
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm(p => ({...p, [k]: v}));
  const setNested = (k1, k2, v) => setForm(p => ({...p, [k1]: {...p[k1], [k2]: v}}));
  const handleSave = () => { onSave(form); setSaved(true); setTimeout(()=>setSaved(false),2500); };

  const TABS = [
    { id: "company",  label: "Company Info" },
    { id: "defaults", label: "Invoice Defaults" },
    { id: "banking",  label: "Banking Details" },
    { id: "notify",   label: "Notifications" },
  ];

  const CurrencyOpts = [
    { value: "ZAR", label: "ZAR — South African Rand" },
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
  ];

  return (
    <div className="app-main settings-page">
      <div className="flex flex-between mb-30">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage company details and invoice preferences</p>
        </div>
        <Btn onClick={handleSave} variant={saved?"success":"primary"} icon={saved?<Check size={14}/>:null}>
          {saved?"Settings Saved!":"Save Settings"}
        </Btn>
      </div>

      <div className="settings-tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`settings-tab${tab===t.id?" active":""}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <Card>
          <div className="settings-section-title">Company Information</div>
          <LogoUpload value={form.company?.logo||""} onChange={v=>setNested("company","logo",v)}/>
          <div className="settings-grid-2" style={{marginTop:20}}>
            <Field label="Company Name"><input value={form.company?.name||""} onChange={e=>setNested("company","name",e.target.value)} className="input" placeholder="Bed Pro"/></Field>
            <Field label="Registration Number"><input value={form.company?.regNumber||""} onChange={e=>setNested("company","regNumber",e.target.value)} className="input" placeholder="2021/123456/07"/></Field>
            <Field label="Email Address"><input type="email" value={form.company?.email||""} onChange={e=>setNested("company","email",e.target.value)} className="input" placeholder="info@bedpro.co.za"/></Field>
            <Field label="Phone Number"><input type="tel" value={form.company?.phone||""} onChange={e=>setNested("company","phone",e.target.value)} className="input" placeholder="012 345 6789"/></Field>
          </div>
          <Field label="Physical Address"><input value={form.company?.address||""} onChange={e=>setNested("company","address",e.target.value)} className="input" placeholder="47 Furniture Avenue, Pretoria, Gauteng, 0001"/></Field>
          <div className="settings-grid-2">
            <Field label="VAT Number"><input value={form.company?.vatNumber||""} onChange={e=>setNested("company","vatNumber",e.target.value)} className="input" placeholder="4130456789"/></Field>
          </div>

          <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #f0f0f0"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <Zap size={14} color={RED}/>
              <div className="settings-section-title" style={{marginBottom:0}}>Email Integration (EmailJS)</div>
            </div>
            <div style={{fontSize:12,color:"#aaa",marginBottom:14,lineHeight:1.5}}>
              Create a free account at <strong style={{color:"#333"}}>emailjs.com</strong>, add an email service (Gmail, SMTP, etc.), create a template with the variables below, and paste your IDs here.
            </div>
            <div className="settings-grid-3">
              <Field label="Service ID"><input value={form.emailjs?.serviceId||""} onChange={e=>setNested("emailjs","serviceId",e.target.value)} className="input" placeholder="service_xxxxx"/></Field>
              <Field label="Template ID"><input value={form.emailjs?.templateId||""} onChange={e=>setNested("emailjs","templateId",e.target.value)} className="input" placeholder="template_xxxxx"/></Field>
              <Field label="Public Key"><input value={form.emailjs?.publicKey||""} onChange={e=>setNested("emailjs","publicKey",e.target.value)} className="input" placeholder="xxxxx"/></Field>
            </div>
            <div style={{fontSize:11,color:"#bbb",marginTop:6}}>
              Your company email (<strong>{form.company?.email||"(not set)"}</strong>) will be used as the sender. Create your EmailJS template with these placeholders: <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}from_name{"}}"}</code>, <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}to_email{"}}"}</code>, <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}invoice_number{"}}"}</code>, <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}amount{"}}"}</code>, <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}due_date{"}}"}</code>, <code style={{background:"#f5f5f5",padding:"1px 5px",borderRadius:3}}>{"{{"}message{"}}"}</code>
            </div>
          </div>
        </Card>
      )}

      {tab === "defaults" && (
        <Card>
          <div className="settings-section-title">Invoice Defaults</div>
          <div className="settings-grid-2">
            <Field label="Invoice Prefix"><input value={form.defaults?.prefix||"BP-"} onChange={e=>setNested("defaults","prefix",e.target.value)} className="input" placeholder="BP-"/></Field>
            <Field label="Default VAT Rate (%)"><input type="number" min="0" max="100" value={form.defaults?.vatRate||15} onChange={e=>setNested("defaults","vatRate",parseFloat(e.target.value)||0)} className="input"/></Field>
            <Field label="Payment Terms (days)"><input type="number" min="0" value={form.defaults?.paymentDays||15} onChange={e=>setNested("defaults","paymentDays",parseInt(e.target.value)||0)} className="input"/></Field>
            <Field label="Currency">
              <select value={form.defaults?.currency||"ZAR"} onChange={e=>setNested("defaults","currency",e.target.value)} className="input">
                {CurrencyOpts.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Default Invoice Notes"><textarea value={form.defaults?.notes||""} onChange={e=>setNested("defaults","notes",e.target.value)} className="input textarea" placeholder="Thank you for your business! Payment due within 30 days."/></Field>
        </Card>
      )}

      {tab === "banking" && (
        <Card>
          <div className="settings-section-title">Banking Details</div>
          <div className="settings-grid-2">
            <Field label="Bank Name"><input value={form.banking?.bankName||""} onChange={e=>setNested("banking","bankName",e.target.value)} className="input" placeholder="First National Bank"/></Field>
            <Field label="Branch Name / Code"><input value={form.banking?.branch||""} onChange={e=>setNested("banking","branch",e.target.value)} className="input" placeholder="FNB Centurion — 250 655"/></Field>
            <Field label="Account Name"><input value={form.banking?.accountName||""} onChange={e=>setNested("banking","accountName",e.target.value)} className="input" placeholder="Bed Pro Pty Ltd"/></Field>
            <Field label="Account Number"><input value={form.banking?.accountNumber||""} onChange={e=>setNested("banking","accountNumber",e.target.value)} className="input" placeholder="62012345678"/></Field>
          </div>

          <div className="preview-mini">
            <div className="preview-label">Invoice Preview — Bank Details Section</div>
            {form.banking?.bankName || form.banking?.accountName || form.banking?.accountNumber || form.banking?.branch ? (
              <>
                {form.banking?.bankName && <div className="preview-mini-row"><span className="preview-mini-label">Bank</span><span>{form.banking.bankName}</span></div>}
                {form.banking?.branch && <div className="preview-mini-row"><span className="preview-mini-label">Branch</span><span>{form.banking.branch}</span></div>}
                {form.banking?.accountName && <div className="preview-mini-row"><span className="preview-mini-label">Account</span><span>{form.banking.accountName}</span></div>}
                {form.banking?.accountNumber && <div className="preview-mini-row"><span className="preview-mini-label">Account No.</span><span>{form.banking.accountNumber}</span></div>}
              </>
            ) : (
              <div style={{fontSize:12,color:"#ccc",textAlign:"center",padding:"8px 0"}}>Fill in banking details to see preview</div>
            )}
          </div>
        </Card>
      )}

      {tab === "notify" && (
        <Card>
          <div className="settings-section-title">Notification Preferences</div>
          <Toggle
            label="Overdue Alerts"
            desc="Show a dashboard alert when invoices pass their due date"
            checked={form.notifications?.overdueAlerts !== false}
            onChange={v => setNested("notifications","overdueAlerts", v)}
          />
          <Toggle
            label="Email Reminders"
            desc="Send a copy of the invoice to the customer's email when marked as Sent"
            checked={form.notifications?.emailReminders !== false}
            onChange={v => setNested("notifications","emailReminders", v)}
          />
          <Toggle
            label="Upcoming Due Warning"
            desc="Highlight invoices in the dashboard when they're within the warning window"
            checked={form.notifications?.dueWarningEnabled}
            onChange={v => setNested("notifications","dueWarningEnabled", v)}
          />
          {form.notifications?.dueWarningEnabled && (
            <Field label="Warn X days before due date" style={{marginTop:8}}>
              <input type="number" min="1" max="30" value={form.notifications?.dueWarningDays||3} onChange={e=>setNested("notifications","dueWarningDays",parseInt(e.target.value)||3)} className="input" style={{width:100}}/>
            </Field>
          )}
        </Card>
      )}
    </div>
  );
};

/* ── TOAST ── */
const Toast = ({message,type="success"}) => (
  <div className={`toast${type!=="success"?" toast-error":""}`}>
    <Check size={15} className="toast-check"/>{message}
  </div>
);

/* ── APP ROOT ── */
const DEFAULT_SETTINGS = {
  company: { name:"Bed Pro", address:"47 Furniture Avenue, Pretoria, Gauteng, 0001", phone:"012 345 6789", email:"info@bedpro.co.za", vatNumber:"4130456789", regNumber:"", logo:"" },
  defaults: { prefix:"BP-", vatRate:15, paymentDays:15, currency:"ZAR", notes:"Thank you for your business!" },
  banking: { bankName:"", accountName:"", accountNumber:"", branch:"" },
  notifications: { overdueAlerts:true, emailReminders:true, dueWarningEnabled:false, dueWarningDays:3 },
  emailjs: { serviceId:"", templateId:"", publicKey:"" },
};

export default function App() {
  const [view,    setView]    = useState("dashboard");
  const [invoices,setInvoices]= useState(()=>{
    try { const saved=localStorage.getItem("bp_invoices"); return saved?JSON.parse(saved):SEED_INVOICES; }
    catch { return SEED_INVOICES; }
  });
  const [customers] = useState(SEED_CUSTOMERS);
  const [preview, setPreview] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [settings, setSettings] = useState(()=>{
    try { const saved=localStorage.getItem("bp_settings"); return saved?JSON.parse(saved):DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });

  useEffect(() => {
    localStorage.setItem("bp_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("bp_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  const handleStatusChange = (invoiceId, newStatus) => {
    setInvoices(prev=>prev.map(inv=>{
      if(inv.id!==invoiceId) return inv;
      const u={...inv,status:newStatus};
      if(newStatus==="paid") u.paidAt=todayStr();
      if(newStatus!=="paid") delete u.paidAt;
      return u;
    }));
    setPreview(prev=>prev&&prev.id===invoiceId?{...prev,status:newStatus,...(newStatus==="paid"?{paidAt:todayStr()}:{})}:prev);
    const msgs={paid:"✓ Invoice marked as Paid",sent:"✓ Marked as Sent",unpaid:"Status set to Unpaid",draft:"Saved as Draft"};
    showToast(msgs[newStatus]||"Status updated");
  };

  return (
    <div className="app-layout">
      <Sidebar view={view} onNav={setView} invoices={invoices}/>
      <main className="app-main">
        {view==="dashboard"      && <Dashboard invoices={invoices} customers={customers} onNav={setView} onPreview={setPreview} onStatusChange={handleStatusChange} settings={settings}/>}
        {view==="invoices"       && <InvoiceList invoices={invoices} customers={customers} onPreview={setPreview} onNav={setView} onStatusChange={handleStatusChange}/>}
        {view==="create-invoice" && <CreateInvoice customers={customers} invoices={invoices} onSave={inv=>{setInvoices(p=>[...p,inv]);showToast(`Invoice ${inv.number} created!`);setView("invoices");}} onCancel={()=>setView("invoices")}/>}
        {view==="customers"      && <Customers customers={customers} invoices={invoices}/>}
        {view==="settings"       && <SettingsPanel settings={settings} onSave={setSettings}/>}
      </main>
      {preview&&<InvoicePreviewModal invoice={preview} customers={customers} settings={settings} onClose={()=>setPreview(null)} onStatusChange={handleStatusChange} onEmailSent={()=>showToast("Invoice sent — status updated to Sent ✓")}/>}
      {toast&&<Toast message={toast.msg} type={toast.type}/>}
    </div>
  );
}
