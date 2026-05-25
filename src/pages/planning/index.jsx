import { useState, useRef, useEffect, useMemo } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getAthenasToken } from "../../services/athenasApi.js";
import WeeklyPlansTemplates from "../WeeklyPlansTemplates.jsx";

// ─────────────────────────────────────────────────────────────────────────────
//  CSS EXACTO — Extraído de main.8968a941.css + :root variables reales
//  Todas las clases son idénticas a las del DOM de maestros.genialskillsweb.com
// ─────────────────────────────────────────────────────────────────────────────
export const GENIAL_CSS = `
:root {
  --palette-gray-charcoal:#33353d; --palette-gray-carbon:#424242;
  --palette-gray-smoke:#868686; --palette-gray-almostWhite:#fcfcfc;
  --palette-gray-silver:#e4e4e4; --palette-gray-gray:#ccc;
  --palette-gray-white:#fff; --palette-gray-black:#000;
  --palette-gray-grayLigther:#eeefef; --palette-gray-1:#8f959b;
  --palette-brand-genial-blue:#2a426d; --palette-brand-blue-1:#809cb7;
  --palette-utility-greenLight:#4ba7a1; --palette-utility-almostGreen:#e8f5f4;
  --palette-utility-greenLighter:#dcede9; --palette-utility-greenDark:#31665a;
  --palette-utility-red:#e32f28; --palette-utility-orange:#c3902a;
  --fontSize-xlg:22px; --fontSize-lg:20px; --fontSize-regular:16px;
  --fontSize-sm:14px; --fontSize-xsm:13px; --fontSize-xxsm:12px;
  --fontSize-tiny:11px; --fontSize-xtiny:10px;
}

/* Animaciones */
.animated{animation-duration:1s;animation-fill-mode:both}
.animated.delay-05s{animation-delay:.5s}
.fadeIn{animation-name:fadeIn}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* Layout base */
.wrapper-principal-container{padding:20px;font-family:'Poppins',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.double-border--principal{border-top:5px solid var(--palette-brand-genial-blue);border-bottom:5px solid var(--palette-brand-genial-blue);padding:10px 0;margin-bottom:15px;display:flex;align-items:center}
.col-no-padding-left{padding-left:0}
.d-flex{display:flex} .align-items-center{align-items:center}
.mt-5{margin-top:3rem} .mt-3{margin-top:1rem} .mb-3{margin-bottom:1rem}
.row{display:flex;flex-wrap:wrap;margin:0 -8px}
.col-6{flex:0 0 50%;max-width:50%;padding:0 8px;box-sizing:border-box}
.col-2{flex:0 0 16.666%;max-width:16.666%;padding:0 8px}
.col-10{flex:0 0 83.333%;max-width:83.333%;padding:0 8px}
.col-md-1{flex:0 0 8.333%;max-width:8.333%;padding:0 8px}
.col-md-11{flex:0 0 91.666%;max-width:91.666%;padding:0 8px}
.pl-0{padding-left:0} .pr-0{padding-right:0}
.m-2{margin:.5rem}

/* PLANNING SELECT */
.wrapper-planning{display:flex;flex-wrap:wrap;justify-content:space-between;margin:auto;padding:.25em;width:100%;gap:16px}
.planning-two-col{border:1px solid #ddd;border-radius:4px;flex:1 1 calc(50% - 8px);min-width:260px}
.planning-two-col.bg-SmokeGray{background-color:#f0f2f3}
.mod-planning{color:#31353d;font-size:17px;padding:1em 2em}
.mod-planning-title{display:flex;margin-bottom:10px;align-items:center;gap:6px}
.mod-planning-title__fixed-size{flex:0 0 100px}
.mod-planning-title__auto-size{flex:1 1 auto}
.mod-planning-title__title{font-size:25px;font-weight:700;line-height:1.2em;margin:0}
.text-assignments-title{color:#4ca7a2}
.text-plans-title{color:#2a426d}
.mod-planning p{font-size:14px;line-height:1.6;color:#555;margin:12px 0 20px}
.center-button{text-align:center} .centered-text{text-align:center}
.btn{display:inline-block;padding:6px 12px;font-size:12px;border:1px solid transparent;border-radius:4px;cursor:pointer;text-align:center}
.btn-bg-LightGreen .btn{background-color:#4ca7a2!important;border-color:#4ca7a2!important;color:#fff!important;font-weight:500;padding:8px 28px}
.btn-bg-LightGreen .btn:hover{background-color:#3d9490!important}
.btn-bg-DarkBlue .btn{background-color:#27466c!important;border-color:#27466c!important;color:#fff!important;font-weight:500;padding:8px 28px}
.btn-bg-DarkBlue .btn:hover{background-color:#1e3550!important}

/* Botones pl — design system propio de la app */
.pl.btn-base{border:1px solid;border-radius:6px!important;cursor:pointer;font-family:inherit;font-size:var(--fontSize-xsm)!important;font-weight:500!important;padding:8px 20px}
.pl.btn-regular{background:var(--palette-gray-white);border-color:var(--palette-gray-silver);color:var(--palette-brand-genial-blue)}
.pl.btn-regular:hover{background:var(--palette-gray-silver)}
.pl.btn-primary{background:var(--palette-brand-genial-blue);border-color:var(--palette-brand-genial-blue);color:#fff}
.pl.btn-primary:hover{background:#1e3550}
.pl.btn-simple{background:transparent;border:0;color:var(--palette-gray-charcoal);padding-left:0;padding-right:0;cursor:pointer;font-family:inherit}
.pl.btn-simple:hover{color:var(--palette-gray-smoke)}
.btn-back{background:transparent;border:none;color:#2a426d;font-size:13px;font-weight:700;cursor:pointer;padding:1px 6px;display:flex;align-items:center;gap:4px}
.btn-back:hover{text-decoration:underline}
.btn-normal{background-color:#2a486e!important;border:1px solid #2a486e!important;color:#fff!important;cursor:pointer!important;text-align:center!important;border-radius:3px;padding:6px 12px;font-size:13px}
.btn-normal:hover{background-color:#1e3550!important}
.btn-info{background-color:transparent!important;border:1px solid #27466c!important;color:#27466c!important;border-radius:4px;padding:5px 12px;font-size:12px;cursor:pointer}
.btn-info:hover{border-color:#2a486e!important;color:#1e3550!important}

/* ASSIGNMENT MANAGER */
.title-principal{font-size:1.5em;font-weight:700;line-height:1.2em;margin-bottom:12px;color:#212529}
.quiz-creator--newstyle{color:#212529}
.quiz-creator--newstyle .card{background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.125);border-radius:4px;margin-bottom:12px}
.quiz-creator--newstyle .card-body{padding:16px}
.form-control{color:#495057;background-color:#f3f3f3;border:1px solid #ced4da;border-radius:4px;padding:6px 12px;font-size:16px;width:100%;font-family:inherit;box-sizing:border-box}
.form-control:focus{outline:none;border-color:#27466c;background:#fff}
.form-select{color:#495057;background-color:#f3f3f3;border:1px solid #ced4da;border-radius:4px;padding:6px 12px;font-size:16px;width:100%;font-family:inherit}
.form-label-value-group label{color:var(--palette-gray-charcoal);font-size:var(--fontSize-xsm);font-weight:600;display:block;margin-bottom:4px}
.form-group-fields{margin-bottom:16px}
.premise-container{border-bottom:1px solid #e4e4e4;margin-bottom:12px;padding-bottom:12px}
.borderGray-bottom{border-bottom:1px solid #e4e4e4}
.badge-published{background:#e8f5e9;color:#2e7d32;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600}
.badge-draft{background:#f5f5f5;color:#888;font-size:10px;padding:2px 8px;border-radius:20px}

/* PLAN DETAIL */
.heading-h1{font-size:var(--fontSize-xlg);font-weight:800;color:#f2af2b}
.heading-h2{font-size:var(--fontSize-lg);font-weight:800;color:#4ca7a2}
.containerPlanning{display:flex;gap:30px;width:100%}
.containerPlanning__sidebar{flex:0 0 250px}
.containerPlanning__content{flex:1 1 auto;min-width:0}
.sidebarMenu{display:block;list-style:none;width:100%;border:1px solid var(--palette-gray-silver);border-radius:4px;overflow:hidden}
.sidebarMenu--itemPpal{display:flex;font-size:var(--fontSize-regular);font-weight:500;justify-content:space-between;padding:15px;background:var(--palette-utility-greenLight);color:#fff;cursor:pointer}
.sidebarMenu--itemTitle{font-size:var(--fontSize-tiny);font-weight:800;padding:20px 15px 8px;text-transform:uppercase;color:var(--palette-utility-orange);letter-spacing:.05em}
.sidebarMenu--item{font-size:var(--fontSize-xxsm);font-weight:500;padding:8px 15px;border-bottom:1px solid var(--palette-gray-grayLigther);cursor:pointer}
.sidebarMenu--item a{color:var(--palette-gray-carbon);display:flex}
.sidebarMenu--item:hover{background:var(--palette-gray-grayLigther)}
.sidebarMenu--item:hover a{color:var(--palette-gray-smoke)}
.sidebarMenu--item.active{font-weight:600;background:var(--palette-utility-almostGreen);pointer-events:none}
.sidebarMenu--item.active a{color:var(--palette-utility-greenLight)}
.Region-w{border-bottom:1px solid var(--palette-gray-silver);padding:10px 0;width:100%}
.Region-w-borderBottom{border-bottom:1px solid var(--palette-gray-silver);padding:10px 0;width:100%}
.Region-w-action{border-bottom:1px solid var(--palette-gray-silver);border-top:1px solid var(--palette-gray-silver);padding:10px 0;width:100%}
.wrapper-infoPlan{background:var(--palette-gray-almostWhite);border-bottom:1px solid var(--palette-gray-silver);border-top:1px solid var(--palette-gray-silver);display:flex;flex-wrap:wrap;gap:15px;padding:10px 15px;font-size:13px;color:var(--palette-gray-carbon);margin-bottom:20px}
.ppalTable{width:100%;border-collapse:collapse;font-size:13px}
.ppalTable thead tr th{background:var(--palette-utility-almostGreen);color:var(--palette-utility-greenDark);font-size:var(--fontSize-xxsm);font-weight:600;padding:10px 12px;text-align:left;border-bottom:1px solid var(--palette-utility-greenLighter)}
.ppalTable tbody tr td{border-bottom:1px solid var(--palette-gray-silver);padding:10px 12px;font-size:var(--fontSize-xxsm)}
.ppalTable tbody tr:hover td{background:var(--palette-gray-grayLigther)}

/* AI PANEL */
.ai-panel{background:var(--palette-utility-almostGreen);border:1px solid var(--palette-utility-greenLighter);border-radius:8px;padding:16px;margin-top:20px}
.ai-panel-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.ai-badge{background:var(--palette-brand-genial-blue);color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px;letter-spacing:.05em}
.ai-panel-title{font-size:14px;font-weight:700;color:var(--palette-brand-genial-blue);margin:0}
.ai-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.ai-chip{background:#fff;border:1px solid var(--palette-utility-greenLighter);color:var(--palette-utility-greenDark);font-size:11px;padding:4px 10px;border-radius:20px;cursor:pointer}
.ai-chip:hover{background:var(--palette-brand-genial-blue);color:#fff;border-color:var(--palette-brand-genial-blue)}
.ai-chat{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;margin-bottom:12px}
.ai-msg{padding:9px 13px;border-radius:8px;font-size:12px;line-height:1.6;max-width:88%}
.ai-msg.ast{background:var(--palette-brand-genial-blue);color:#fff;align-self:flex-start;border-bottom-left-radius:3px}
.ai-msg.usr{background:#fff;color:var(--palette-brand-genial-blue);align-self:flex-end;border-bottom-right-radius:3px;border:1px solid var(--palette-utility-greenLighter)}
.ai-msg.typ{background:#fff;color:var(--palette-utility-greenLight);font-style:italic}
.ai-input-row{display:flex;gap:7px}
.ai-input{flex:1;border:1px solid var(--palette-utility-greenLighter);border-radius:4px;padding:7px 10px;font-size:12px;font-family:inherit;outline:none;background:#fff}
.ai-input:focus{border-color:var(--palette-brand-genial-blue)}
.ai-send-btn{background:var(--palette-brand-genial-blue);color:#fff;border:none;border-radius:4px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer}
.ai-send-btn:disabled{opacity:.45;cursor:not-allowed}
.ai-fill-btn{background:var(--palette-utility-greenLight);color:#fff;border:none;border-radius:4px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;margin-top:9px;display:inline-flex;align-items:center;gap:6px}
.sidebarMenu--group{display:block}
.preview-subtitle{font-size:14px;color:var(--palette-gray-charcoal);margin:-6px 0 20px}
.preview-note{display:flex;gap:8px;align-items:flex-start;color:#f2af2b;font-size:11.5px;line-height:1.45;margin:8px 0 10px}
.preview-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:10px 0 12px}
.preview-filter{display:flex;align-items:center;gap:10px;flex:1 1 430px;min-width:280px}
.preview-filter select{min-width:280px;max-width:360px;background:#f3f3f3;border:1px solid #ced4da;border-radius:4px;padding:8px 10px;font-size:13px;color:#495057;font-family:inherit}
.preview-icon-btn{border:0;background:transparent;color:var(--palette-brand-genial-blue);font-size:16px;cursor:pointer;padding:6px 8px;border-radius:4px}
.preview-icon-btn:hover{background:var(--palette-utility-almostGreen)}
.table-pdf-preview{border:1px solid var(--palette-gray-silver);background:#fff;max-height:620px;overflow:auto}
.tablePDF__scroll{overflow:auto;max-height:620px}
.tablePDF__content{border-collapse:separate;border-spacing:0;min-width:1320px;width:100%;font-size:12px;color:var(--palette-brand-genial-blue)}
.tablePDF__content th,.tablePDF__content td{border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;vertical-align:top;background:#fff}
.tablePDF__content thead th{position:sticky;top:0;z-index:2;background:var(--palette-utility-almostGreen);color:#003067;padding:8px 10px;text-align:left}
.tablePDF__content thead th:first-child{left:0;z-index:3}
.tablePDF__content tbody th{position:sticky;left:0;z-index:1;width:170px;min-width:170px;background:var(--palette-utility-almostGreen);color:#003067;font-weight:800;padding:10px}
.tablePDF__content td{min-width:180px;height:86px;padding:0}
.tablePDF__date-format{display:flex;justify-content:flex-end;font-size:10px;font-weight:800;color:#003067;margin-bottom:4px}
.tablePDF__infoDate{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.tablePDF__infoDate--day{font-size:13px;font-weight:800;text-transform:uppercase}
.tablePDF__infoDate--date{font-size:12px;font-weight:500;color:var(--palette-brand-genial-blue)}
.tablePDF__container{padding:8px 10px}
.tablePDF__list{list-style:none;margin:0;padding:0}
.tablePDF__list--item_desc{padding:7px 0}
.tablePDF__list--item_desc.borderTop{border-top:1px solid #e4e4e4}
.list--item_firstTitle{margin:0 0 4px;color:#f2af2b;font-size:10.5px;font-weight:800}
.list--item_desc--desc,.list--item_desc--desc_content{margin:0;color:#33353d;font-size:12px;line-height:1.35}
.list--item_desc--desc_quiz{margin:0;color:#33353d;font-size:12px;font-weight:700}
.list--item_desc--desc_quiz-date{margin:2px 0 0;color:#6b7280;font-size:11px}
.planning-print-sheet{background:#fff;color:#33353d}
.planning-print-header{display:none;padding:0 0 12px;border-bottom:1px solid #d7dee8;margin-bottom:12px}
.planning-print-title{font-size:18px;font-weight:800;color:#2a426d;margin:0 0 6px}
.planning-print-meta{font-size:11px;color:#33353d;line-height:1.5}
.preview-status{font-size:12px;color:var(--palette-utility-greenDark);min-height:18px}

@media screen and (max-width:700px){
  .planning-two-col{flex:1 1 100%}
  .containerPlanning{flex-wrap:wrap}
  .containerPlanning__sidebar{flex:0 0 100%}
  .preview-filter{flex:1 1 100%}
  .preview-filter select{min-width:0;max-width:none;width:100%}
}

@media print{
  body *{visibility:hidden!important}
  .planning-print-sheet,.planning-print-sheet *{visibility:visible!important}
  .planning-print-sheet{position:absolute;left:0;top:0;width:100%;padding:18px}
  .planning-print-header{display:block}
  .preview-actions,.preview-note{display:none!important}
  .table-pdf-preview,.tablePDF__scroll{max-height:none!important;overflow:visible!important;border:0}
  .tablePDF__content{min-width:1320px}
}

/* FULL PLAN GENERATOR modal */
.fpg-backdrop{position:fixed;inset:0;background:rgba(24,48,76,.55);backdrop-filter:blur(3px);display:grid;place-items:center;z-index:300;padding:24px;font-family:'Poppins',system-ui,sans-serif}
.fpg-modal{width:min(840px,100%);max-height:calc(100vh - 48px);background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.28);display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.fpg-head{padding:20px 24px;border-bottom:1px solid #e4e4e4;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.fpg-eyebrow{display:inline-block;background:linear-gradient(135deg,#6745EA,#4ba7a1);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.14em;padding:3px 10px;border-radius:999px;text-transform:uppercase;margin-bottom:8px}
.fpg-head h2{font-size:20px;font-family:'Sora',sans-serif;color:#27466c;margin:0 0 4px}
.fpg-head p{margin:0;font-size:13px;color:#6B7A93;max-width:60ch}
.fpg-close{background:#f4f6f9;border:1px solid #e4e4e4;width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer;color:#555}
.fpg-body{overflow-y:auto;padding:18px 24px 22px}
.fpg-form{display:flex;flex-direction:column;gap:14px}
.fpg-field{display:block}
.fpg-field>span{display:block;font-size:12px;font-weight:600;color:#33353d;margin-bottom:6px}
.fpg-field textarea,.fpg-field input,.fpg-field select{width:100%;background:#fff;border:1px solid #e4e4e4;border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;outline:0;resize:vertical;color:#1A2740}
.fpg-field textarea:focus,.fpg-field select:focus{border-color:#27466c;box-shadow:0 0 0 3px rgba(39,70,108,.12)}
.fpg-check{display:grid;grid-template-columns:18px 1fr;gap:10px;align-items:start;background:#f8fbfc;border:1px solid #d7eceb;border-radius:10px;padding:12px 14px;color:#1A2740;cursor:pointer}
.fpg-check input{margin-top:2px;accent-color:#4ba7a1}
.fpg-check strong{display:block;font-size:13px;color:#27466c;margin-bottom:2px}
.fpg-check span{display:block;font-size:12px;line-height:1.45;color:#6B7A93}
.fpg-generate{background:linear-gradient(135deg,#6745EA,#4ba7a1);color:#fff;border:0;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 2px 8px rgba(103,69,234,.25)}
.fpg-generate:disabled{opacity:.55;cursor:not-allowed}
.fpg-error{background:#fdecea;color:#7a1a14;border:1px solid #f4c4c0;padding:10px 12px;border-radius:8px;font-size:12.5px}
.fpg-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#6B7A93;background:#f4f6f9;padding:8px 12px;border-radius:8px;margin-bottom:16px}
.fpg-section{margin-bottom:20px}
.fpg-section h3{font-size:14px;color:#27466c;margin-bottom:10px;font-family:'Sora',sans-serif}
.fpg-lesson{display:grid;grid-template-columns:20px 1fr;gap:10px;padding:10px;border:1px solid #e4e4e4;border-radius:9px;margin-bottom:6px;cursor:pointer;align-items:start}
.fpg-lesson:hover{background:#f4f6f9}
.fpg-lesson input{accent-color:#27466c;margin-top:2px}
.fpg-lesson-title{font-weight:600;font-size:13.5px;color:#1A2740}
.fpg-lesson-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:11.5px;color:#6B7A93;margin-top:4px;align-items:center}
.fpg-std{background:#EEE9FF;color:#6745EA;font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:4px}
.fpg-lesson-obj{font-size:12px;color:#364965;margin-top:6px;line-height:1.45}
.fpg-sec-item{border:1px solid #e4e4e4;border-radius:8px;margin-bottom:6px;background:#fff}
.fpg-sec-item summary{padding:9px 12px;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:13px;color:#1A2740;list-style:none}
.fpg-sec-item summary::-webkit-details-marker{display:none}
.fpg-sec-item summary input{accent-color:#27466c}
.fpg-sec-content{padding:0 14px 12px;font-size:13px;color:#364965;line-height:1.55;white-space:pre-wrap;border-top:1px dashed #eef1f6;margin-top:4px;padding-top:10px}
.fpg-actions{display:flex;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #e4e4e4}
.fpg-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;margin-left:6px}
.fpg-badge.live{background:#dcfce7;color:#166534}
.fpg-badge.cache{background:#f3f4f6;color:#6b7280}
.alp-badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle;letter-spacing:.04em}
.alp-badge.live{background:#dcfce7;color:#166534}
.alp-badge.cache{background:#f3f4f6;color:#6b7280}
.alp-bp{background:#eef2ff;color:#3730a3;font-size:10px;padding:1px 6px;border-radius:4px}
.alp-gc{background:#fef3c7;color:#92400e;font-size:10px;padding:1px 6px;border-radius:4px}

/* CreatableSection — list/form pattern (used by fl-plan1, fl-plan2, fl-innov) */
.cs-form{font-family:'Poppins',system-ui,sans-serif}
.cs-block{background:#fff;border-bottom:1px solid #e4e4e4;padding:18px 0;margin-bottom:0}
.cs-block:first-of-type{padding-top:8px}
.cs-block:last-child{border-bottom:0}
.cs-block-title{font-size:16px;font-weight:700;color:#33353d;margin:0 0 12px;letter-spacing:.005em}
.cs-checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px 16px}
.cs-opt{display:inline-flex;align-items:center;gap:10px;padding:8px 4px;cursor:pointer;font-size:13.5px;color:#33353d;transition:color .12s}
.cs-opt:hover{color:#27466c}
.cs-opt.on{color:#246F6F;font-weight:600}
.cs-opt input{accent-color:#3DA8A8;cursor:pointer;width:16px;height:16px;flex-shrink:0;margin:0}
.cs-days{display:inline-flex;gap:4px;background:#f8f9fb;border:1px solid #e4e4e4;border-radius:8px;padding:8px}
.cs-day{background:transparent;border:0;width:36px;height:36px;border-radius:6px;font:inherit;font-size:13px;color:#868686;cursor:pointer;font-weight:500;transition:all .12s;text-transform:lowercase}
.cs-day:hover{background:#e4e4e4;color:#33353d}
.cs-day.on{background:#3DA8A8;color:#fff;font-weight:700}

/* Nuevo Calendario Mensual */
.cal-container {
  width: 280px;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 12px;
  font-family: inherit;
  margin-top: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.cal-header {
  font-weight: 700;
  text-align: center;
  font-size: 14px;
  color: #27466c;
  margin-bottom: 10px;
  text-transform: capitalize;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-day-header {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #8f959b;
  text-transform: lowercase;
  padding-bottom: 6px;
}
.cal-week-row {
  display: contents;
}
.cal-day-cell {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 12px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #ccc;
  cursor: not-allowed;
  font-weight: 400;
}
.cal-day-cell.active {
  color: #333;
  cursor: pointer;
  font-weight: 600;
  background: transparent;
}
.cal-day-cell.active:hover {
  background: #eeefef;
}
.cal-day-cell.selected {
  background: #3da8a8 !important;
  color: #fff !important;
  font-weight: 700;
}
.cal-day-cell.other-month.active {
  color: #666;
}
.cal-day-cell.other-month:not(.active) {
  color: #f0f0f0;
}

/* Estilos para ChipsInput */
.chips-input-container {
  margin-top: 6px;
}
.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.chip-item {
  background: #e8f5f4;
  color: #31665a;
  border: 1px solid #b8dedb;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chip-remove {
  background: transparent;
  border: none;
  color: #868686;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 0;
  line-height: 1;
}
.chip-remove:hover {
  color: #e32f28;
}
`;

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK DATA — Estructura real de la API
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK = {
  quizTypes: [
    { Id: "1", Name: "Selección",      AutoCorrect: "1" },
    { Id: "2", Name: "Pareo",          AutoCorrect: "1" },
    { Id: "3", Name: "Abierto",        AutoCorrect: "0" },
    { Id: "4", Name: "Cierto o Falso", AutoCorrect: "0" },
  ],
  assignments: [
    { Id: "101", Title: "Evaluación de Ciencias Naturales — Unidad 3", Published: false, CreatedAt: "05/18/2026" },
    { Id: "102", Title: "Prueba de Matemáticas — Álgebra I",           Published: true,  CreatedAt: "05/10/2026" },
  ],
  plans: [
    { PlanId: "1248", PlanName: "Test grupo", SubjectName: "Ciencias", LevelCode: "5",
      IsPlanOpen: true, OpenDate: "05/22/2026", CloseDate: "05/28/2026", GroupName: "Sexto-Matemática",
      WeekNumber: "209", PeriodLabel: "Período 4: septiembre 05, 2023 - mayo 31, 2030",
      AcademicYear: "agosto 29, 2023 - mayo 31, 2030", ClosesOn: "mayo 31, 2030" },
  ],
  subjects: ["Español", "Matemáticas", "Ciencias", "Inglés", "Estudios Sociales"],
  grades:   ["K","1","2","3","4","5","6","7","8","9","10","11","12"],
  groups:   ["Sexto-Matemática", "Quinto-Ciencias", "Cuarto-Español"],
  cotejo: [
    { key: "cotejo",    label: "Planificación (Cotejo)",                              type: "ppal"  },
    { key: "gl-title",  label: "Contenido genial",                                    type: "title" },
    { key: "gl-lessons",label: "Lecciones",                                           type: "item", group: "Contenido genial" },
    { key: "gl-forums", label: "Foros",                                                type: "item", group: "Contenido genial" },
    { key: "gl-tasks",  label: "Asignaciones",                                         type: "item", group: "Contenido genial" },
    { key: "fl-title",  label: "Contenido libre",                                      type: "title" },
    { key: "fl-lessons",label: "Lecciones",                                            type: "item", group: "Contenido libre" },
    { key: "fl-integ",  label: "Integración con otras materias",                       type: "item", group: "Contenido libre" },
    { key: "fl-innov",  label: "Iniciativa o proyecto innovador",                      type: "item", group: "Contenido libre" },
    { key: "fl-eval",   label: "Evaluaciones (Avalúos)",                               type: "item", group: "Contenido libre" },
    { key: "fl-acom",   label: "Acomodos razonables",                                  type: "item", group: "Contenido libre" },
    { key: "fl-strat",  label: "Estrategias de instrucción diferenciada",              type: "item", group: "Contenido libre" },
    { key: "fl-plan1",  label: "Plan de mejoramiento respuesta activa del estudiante", type: "item", group: "Contenido libre" },
    { key: "fl-plan2",  label: "Plan de mejoramiento experiencia común (2–3 min)",     type: "item", group: "Contenido libre" },
    { key: "fl-mats",   label: "Materiales",                                           type: "item", group: "Contenido libre" },
    { key: "fl-obs",    label: "Observaciones",                                        type: "item", group: "Contenido libre" },
    { key: "fl-reflex", label: "Reflexión de praxis",                                  type: "item", group: "Contenido libre" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  IA — usa el proxy /api/generate (OpenRouter Claude Sonnet 4.5)
// ─────────────────────────────────────────────────────────────────────────────
function parsePlanDate(value) {
  const clean = String(value || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!clean) return new Date(2026, 4, 22);
  return new Date(Number(clean[3]), Number(clean[1]) - 1, Number(clean[2]));
}

function formatPlanDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

function buildPlanDays(openDate) {
  const base = parsePlanDate(openDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return { label: `DIA ${i + 1}`, date: formatPlanDate(d) };
  });
}

function textOrFallback(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function getSpanishDayAbbrev(date) {
  const abbrevs = ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."];
  return abbrevs[date.getDay()];
}

function formatTableDate(dateStr) {
  if (!dateStr) return "—";
  const d = parsePlanDate(dateStr);
  return `${getSpanishDayAbbrev(d)}: ${dateStr}`;
}

function getEntryStartEndDates(dates, planOpenDate, planCloseDate) {
  if (!dates) return { start: "", end: "" };
  if (dates.wholeWeek) {
    return { start: planOpenDate, end: planCloseDate };
  }
  const days = dates.days || [];
  if (!days.length) return { start: "", end: "" };
  const sorted = [...days].map(parsePlanDate).sort((a, b) => a - b);
  return {
    start: formatPlanDate(sorted[0]),
    end: formatPlanDate(sorted[sorted.length - 1]),
  };
}

function normalizePlanDate(value) {
  if (!value) return "";
  const text = String(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return `${String(us[1]).padStart(2, "0")}/${String(us[2]).padStart(2, "0")}/${us[3]}`;
  return text;
}

function normalizeCurriculumText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SUBJECT_ALIASES = {
  matematica: "matematicas",
  matematicas: "matematicas",
  math: "matematicas",
  mathematics: "matematicas",
  ciencias: "ciencias",
  science: "ciencias",
  sociales: "estudios sociales",
  "estudios sociales": "estudios sociales",
  "ciencias sociales": "estudios sociales",
  "social studies": "estudios sociales",
  ingles: "ingles",
  english: "ingles",
  ela: "ingles",
  espanol: "espanol",
  spanish: "espanol",
  "artes del lenguaje": "espanol",
};

function normalizeSubjectName(value) {
  const normalized = normalizeCurriculumText(value);
  return SUBJECT_ALIASES[normalized] || normalized;
}

function normalizeGradeCode(value) {
  return String(value || "").replace(/\D/g, "");
}

function localPlanningStore() {
  try {
    const saved = JSON.parse(localStorage.getItem("gsm_teacher_plannings") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveLocalPlanningStore(plans) {
  localStorage.setItem("gsm_teacher_plannings", JSON.stringify(plans));
}

function normalizeAssignment(row = {}) {
  return {
    Id: row.Id || row.id || `local-assignment-${Date.now()}`,
    Title: row.Title || row.title || "Nueva asignacion",
    Published: !!(row.Published ?? row.published),
    CreatedAt: normalizePlanDate(row.CreatedAt || row.createdAt || new Date().toISOString().slice(0, 10)),
    Questions: Array.isArray(row.Questions) ? row.Questions : (Array.isArray(row.questions) ? row.questions : []),
  };
}

function localAssignmentStore() {
  try {
    const saved = JSON.parse(localStorage.getItem("gsm_teacher_assignments") || "[]");
    return Array.isArray(saved) ? saved.map(normalizeAssignment) : [];
  } catch {
    return [];
  }
}

function saveLocalAssignmentStore(assignments) {
  localStorage.setItem("gsm_teacher_assignments", JSON.stringify(assignments.map(normalizeAssignment)));
}

async function fetchSavedAssignments() {
  const localAssignments = localAssignmentStore();
  try {
    const res = await fetch("/api/assignments");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { assignments: data.assignments?.length ? data.assignments.map(normalizeAssignment) : localAssignments, source: data.source || "supabase" };
  } catch {
    return { assignments: localAssignments, source: "local" };
  }
}

async function createSavedAssignment(assignment) {
  const body = normalizeAssignment(assignment);
  try {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeAssignment((await res.json()).assignment);
  } catch {
    const localAssignment = { ...body, Id: body.Id || `local-assignment-${Date.now()}`, SavedLocally: true };
    const assignments = [localAssignment, ...localAssignmentStore().filter(a => String(a.Id) !== String(localAssignment.Id))];
    saveLocalAssignmentStore(assignments);
    return localAssignment;
  }
}

async function fetchSavedPlannings() {
  const localPlans = localPlanningStore();
  try {
    const res = await fetch("/api/plannings");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { plans: data.plans?.length ? data.plans : localPlans, source: data.source || "supabase" };
  } catch {
    return { plans: localPlans, source: "local" };
  }
}

async function createSavedPlanning(plan) {
  const body = { ...plan, OpenDate: normalizePlanDate(plan.OpenDate), CloseDate: normalizePlanDate(plan.CloseDate) };
  try {
    const res = await fetch("/api/plannings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).plan;
  } catch {
    const localPlan = { ...body, PlanId: body.PlanId || `local-${Date.now()}`, SavedLocally: true };
    const plans = [localPlan, ...localPlanningStore().filter(p => String(p.PlanId) !== String(localPlan.PlanId))];
    saveLocalPlanningStore(plans);
    return localPlan;
  }
}

async function updateSavedPlanning(plan) {
  const body = { ...plan, OpenDate: normalizePlanDate(plan.OpenDate), CloseDate: normalizePlanDate(plan.CloseDate) };
  try {
    const res = await fetch(`/api/plannings/${encodeURIComponent(body.PlanId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).plan;
  } catch {
    const plans = localPlanningStore();
    const next = plans.some(p => String(p.PlanId) === String(body.PlanId))
      ? plans.map(p => String(p.PlanId) === String(body.PlanId) ? { ...p, ...body, SavedLocally: true } : p)
      : [{ ...body, SavedLocally: true }, ...plans];
    saveLocalPlanningStore(next);
    return { ...body, SavedLocally: true };
  }
}

async function askClaude(system, userMessage) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      system,
      user: userMessage,
      max_tokens: 1200,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = ""; let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const j = JSON.parse(payload);
        if (j.error) throw new Error(j.error);
        if (j.delta) out += j.delta;
      } catch (_) { /* keep-alives */ }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI PANEL
// ─────────────────────────────────────────────────────────────────────────────
function AIPanel({ mode, sectionLabel, onFill }) {
  const isAssignment = mode === "assignment";
  const [messages,   setMessages]   = useState([{
    role: "ast",
    text: isAssignment
      ? "¡Hola! Soy tu asistente para crear asignaciones. Puedo generar preguntas automáticamente. ¿Empezamos?"
      : "¡Hola! Soy tu asistente de planificación. Puedo ayudarte a llenar cualquier sección del cotejo. ¿Por dónde empezamos?",
  }]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [canFill,    setCanFill]    = useState(false);
  const [lastParsed, setLastParsed] = useState(null);
  const chatRef = useRef();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const SYS_ASSIGNMENT = `Eres un asistente educativo de Puerto Rico. Genera preguntas en JSON sin markdown:
{"title":"...","questions":[{"TypeId":"1","Text":"...","Options":["a","b","c","d"],"CorrectIndex":0}]}
TypeId: 1=Selección, 2=Pareo, 3=Abierto, 4=Cierto o Falso. Responde en español.`;

  const SYS_PLANNING = `Eres asistente de planificación instruccional para maestros de Puerto Rico.
Genera contenido JSON sin markdown: {"content":"texto completo para la sección"}
Sección actual: ${sectionLabel || ""}. Responde en español.`;

  const CHIPS = isAssignment
    ? ["Genera 4 preguntas de selección sobre fotosíntesis para 6to grado",
       "3 preguntas de cierto o falso sobre la Revolución Industrial",
       "2 preguntas abiertas de matemáticas 5to grado"]
    : ["Escribe objetivos de lenguaje para ELL emergente",
       "Genera acomodos razonables para esta lección",
       "Estrategia de diferenciación por proceso",
       "Completa la reflexión de praxis"];

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const updated = [...messages, { role: "usr", text: msg }];
    setMessages([...updated, { role: "typ", text: "Pensando…" }]);
    setLoading(true);
    try {
      const reply = await askClaude(isAssignment ? SYS_ASSIGNMENT : SYS_PLANNING, msg);
      let parsed = null;
      try { const m = reply.match(/\{[\s\S]+\}/); if (m) parsed = JSON.parse(m[0]); } catch (_) {}
      setMessages([...updated, { role: "ast", text: reply }]);
      if (parsed) { setLastParsed(parsed); setCanFill(true); }
    } catch {
      setMessages([...updated, { role: "ast", text: "Error al conectar con la IA. Intenta de nuevo." }]);
    }
    setLoading(false);
  }

  function handleFill() {
    if (onFill && lastParsed) onFill(lastParsed);
    setCanFill(false);
    setMessages(p => [...p, { role: "ast", text: "✓ Contenido aplicado al formulario. Revísalo y ajusta antes de guardar." }]);
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="ai-badge">✨ IA</span>
        <p className="ai-panel-title">{isAssignment ? "Asistente de asignaciones" : "Asistente de planificación"}</p>
      </div>
      <div className="ai-chips">
        {CHIPS.map((c, i) => <button key={i} className="ai-chip" onClick={() => send(c)}>{c}</button>)}
      </div>
      <div className="ai-chat" ref={chatRef}>
        {messages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
      </div>
      <div className="ai-input-row">
        <input className="ai-input" placeholder="Escribe tu solicitud…" value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} disabled={loading} />
        <button className="ai-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? "…" : "Enviar"}
        </button>
      </div>
      {canFill && <button className="ai-fill-btn" onClick={handleFill}>⬇ Aplicar al formulario</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLANNING SELECT
// ─────────────────────────────────────────────────────────────────────────────
function PlanningSelect({ onEnterAssignments, onEnterPlanning }) {
  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <div className="wrapper-planning mt-5">
        <div className="planning-two-col bg-SmokeGray">
          <div className="mod-planning">
            <div className="mod-planning-title">
              <div className="mod-planning-title__fixed-size">
                <svg width="70" height="70" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="65" fill="#4ca7a2"/>
                  <rect x="42" y="38" width="66" height="74" rx="3" fill="white" opacity=".9"/>
                  <rect x="50" y="52" width="50" height="4" rx="2" fill="#4ca7a2"/>
                  <rect x="50" y="63" width="40" height="3" rx="1.5" fill="#ddd"/>
                  <rect x="50" y="73" width="44" height="3" rx="1.5" fill="#ddd"/>
                  <rect x="50" y="83" width="36" height="3" rx="1.5" fill="#ddd"/>
                  <circle cx="104" cy="104" r="18" fill="#E88B19"/>
                  <text x="97" y="110" fill="white" fontSize="18" fontWeight="bold">✏</text>
                </svg>
              </div>
              <div className="mod-planning-title__auto-size">
                <h1 className="mod-planning-title__title text-assignments-title">Asignaciones</h1>
              </div>
            </div>
            <p>Cree y actualice ejercicios, asignaciones y evaluativos para sus estudiantes. Una vez creado, podrá adjuntarlo a su plan.</p>
            <div className="center-button btn-bg-LightGreen">
              <button className="centered-text btn" onClick={onEnterAssignments}>ENTRAR</button>
            </div>
          </div>
        </div>

        <div className="planning-two-col bg-SmokeGray">
          <div className="mod-planning">
            <div className="mod-planning-title">
              <div className="mod-planning-title__fixed-size">
                <svg width="70" height="70" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="65" fill="#27466C"/>
                  <rect x="38" y="42" width="52" height="60" rx="3" fill="#9CA9D6"/>
                  <rect x="44" y="50" width="40" height="4" rx="2" fill="white" opacity=".8"/>
                  <rect x="44" y="60" width="32" height="3" rx="1.5" fill="white" opacity=".5"/>
                  <rect x="44" y="69" width="36" height="3" rx="1.5" fill="white" opacity=".5"/>
                  <path d="M60 102 L95 68 L108 80 L73 114 Z" fill="#6AD8D2"/>
                  <path d="M95 68 L108 80 L116 60 Z" fill="white" opacity=".7"/>
                </svg>
              </div>
              <div className="mod-planning-title__auto-size">
                <h1 className="mod-planning-title__title text-plans-title">Planificación</h1>
              </div>
            </div>
            <p>Seleccione las lecciones de la plataforma web y asignaciones para sus estudiantes. Puede crear su plan.</p>
            <div className="center-button btn-bg-DarkBlue">
              <button className="centered-text btn" onClick={onEnterPlanning}>ENTRAR</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASSIGNMENT LIST
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentList({ onBack, onCreate, assignments = [], loading = false, source = "supabase" }) {
  const rows = assignments.length ? assignments : MOCK.assignments;
  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <div className="double-border--principal">
        <button className="btn-back col-no-padding-left" onClick={onBack}>← Atrás</button>
      </div>
      <div className="d-flex align-items-center" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1 className="heading-h1">Asignaciones</h1>
        <button className="pl btn-base btn-regular" onClick={onCreate}>+ Crear asignación</button>
      </div>
      {loading && <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>Cargando asignaciones guardadas...</p>}
      {!loading && source === "local" && <p style={{ fontSize: 12, color: "#c3902a", marginBottom: 12 }}>Modo local: las asignaciones se guardan en este navegador hasta que Supabase este disponible.</p>}
      <table className="ppalTable">
        <thead><tr><th>Título</th><th>Publicado</th><th>Fecha de creación</th><th></th></tr></thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.Id}>
              <td>{a.Title}</td>
              <td><span className={a.Published ? "badge-published" : "badge-draft"}>{a.Published ? "Sí" : "No"}</span></td>
              <td>{a.CreatedAt}</td>
              <td><button className="pl btn-base btn-regular" onClick={onCreate}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASSIGNMENT MANAGER
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentManager({ onBack, onSaved }) {
  const [title,      setTitle]      = useState("");
  const [activeType, setActiveType] = useState("1");
  const [questions,  setQuestions]  = useState([]);
  const [saving,     setSaving]     = useState(false);
  const typeLabel = { "1": "Selección", "2": "Pareo", "3": "Abierto", "4": "Cierto o Falso" };

  function addQuestion() {
    setQuestions(p => [...p, { id: Date.now(), TypeId: activeType, Text: "", Options: ["","","",""], CorrectIndex: 0, Pairs: [{ l: "", r: "" }] }]);
  }
  function updateQ(id, key, val) { setQuestions(p => p.map(q => q.id === id ? { ...q, [key]: val } : q)); }
  function updateOpt(qId, idx, val) { setQuestions(p => p.map(q => q.id === qId ? { ...q, Options: q.Options.map((o, i) => i === idx ? val : o) } : q)); }
  function removeQ(id) { setQuestions(p => p.filter(q => q.id !== id)); }

  function handleAIFill(data) {
    if (data.title) setTitle(data.title);
    if (data.questions) setQuestions(data.questions.map((q, i) => ({
      id: Date.now() + i, TypeId: q.TypeId || "1", Text: q.Text || "",
      Options: q.Options || ["","","",""], CorrectIndex: q.CorrectIndex ?? 0,
      Pairs: q.Pairs || [{ l: "", r: "" }],
    })));
  }

  async function saveAssignment() {
    if (!title.trim()) return;
    setSaving(true);
    const saved = await createSavedAssignment({
      Title: title.trim(),
      Published: true,
      CreatedAt: new Date().toISOString().slice(0, 10),
      Questions: questions,
    });
    setSaving(false);
    onSaved?.(saved);
    onBack();
  }

  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <div className="double-border--principal">
        <button className="btn-back col-no-padding-left" onClick={onBack}>← Atrás</button>
      </div>
      <h1 className="title-principal">Creador de asignaciones y pruebas</h1>

      <div className="quiz-creator--newstyle">
        <div className="form-group-fields">
          <div className="form-label-value-group"><label>Título</label></div>
          <input className="form-control" placeholder="Entre el Título" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="Region-w d-flex align-items-center" style={{ gap: 8, paddingBottom: 12 }}>
          {MOCK.quizTypes.map(t => (
            <button key={t.Id} className={`btn ${activeType === t.Id ? "btn-normal" : "btn-info"}`} onClick={() => setActiveType(t.Id)}>
              {t.Name}
            </button>
          ))}
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="card-body">
              <div className="row align-items-center borderGray-bottom mb-3" style={{ paddingBottom: 10 }}>
                <div className="col-10">
                  <strong style={{ fontSize: 13, color: "#2a426d" }}>Pregunta {idx + 1}</strong>
                  <span style={{ fontSize: 11, background: "#e8f0f8", color: "#2a426d", padding: "2px 8px", borderRadius: 20, marginLeft: 6 }}>{typeLabel[q.TypeId]}</span>
                </div>
                <div className="col-2" style={{ textAlign: "right" }}>
                  <button className="pl btn-simple" style={{ color: "#999", fontSize: 16 }} onClick={() => removeQ(q.id)}>×</button>
                </div>
              </div>

              <textarea className="form-control mb-3" rows={2} placeholder="Escribe la pregunta aquí…" value={q.Text} onChange={e => updateQ(q.id, "Text", e.target.value)} />

              {q.TypeId === "1" && (
                <div>
                  {q.Options.map((opt, i) => (
                    <div key={i} className="row align-items-center premise-container" style={{ margin: 0 }}>
                      <div className="col-md-1" style={{ display: "flex", alignItems: "center" }}>
                        <input type="radio" name={`r-${q.id}`} checked={q.CorrectIndex === i} onChange={() => updateQ(q.id, "CorrectIndex", i)} style={{ accentColor: "#27466c", cursor: "pointer", width: 16, height: 16 }} />
                      </div>
                      <div className="col-md-11">
                        <input className="form-control" placeholder={`Opción ${i + 1}`} value={opt} onChange={e => updateOpt(q.id, i, e.target.value)} style={q.CorrectIndex === i ? { borderColor: "#4ca7a2", background: "#f0faf9" } : {}} />
                      </div>
                    </div>
                  ))}
                  <button className="pl btn-simple mt-3" onClick={() => updateQ(q.id, "Options", [...q.Options, ""])}>+ Añadir opción</button>
                </div>
              )}

              {q.TypeId === "4" && (
                <div className="d-flex align-items-center" style={{ gap: 20, padding: "8px 0" }}>
                  {["Cierto", "Falso"].map((opt, i) => (
                    <div key={i} className="d-flex align-items-center" style={{ gap: 8 }}>
                      <input type="radio" name={`tf-${q.id}`} checked={q.CorrectIndex === i} onChange={() => updateQ(q.id, "CorrectIndex", i)} style={{ accentColor: "#27466c", cursor: "pointer", width: 16, height: 16 }} />
                      <span style={{ fontSize: 14 }}>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.TypeId === "3" && (
                <textarea className="form-control mt-3" rows={2} placeholder="(Respuesta abierta del estudiante — sin opciones)" disabled style={{ background: "#fafafa", color: "#bbb" }} />
              )}

              {q.TypeId === "2" && (
                <div>
                  {q.Pairs.map((pair, pi) => (
                    <div key={pi} className="row align-items-center premise-container" style={{ margin: 0 }}>
                      <div className="col-6 pl-0">
                        <input className="form-control" placeholder="Premisa" value={pair.l} onChange={e => { const p = [...q.Pairs]; p[pi] = { ...p[pi], l: e.target.value }; updateQ(q.id, "Pairs", p); }} />
                      </div>
                      <div className="col-6">
                        <input className="form-control" placeholder="Respuesta" value={pair.r} onChange={e => { const p = [...q.Pairs]; p[pi] = { ...p[pi], r: e.target.value }; updateQ(q.id, "Pairs", p); }} />
                      </div>
                    </div>
                  ))}
                  <button className="pl btn-simple mt-3" onClick={() => updateQ(q.id, "Pairs", [...q.Pairs, { l: "", r: "" }])}>+ Añadir par</button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="Region-w-action d-flex align-items-center" style={{ gap: 10 }}>
          <button className="btn btn-normal" onClick={addQuestion}>+ Añadir pregunta ({typeLabel[activeType]})</button>
          <button className="pl btn-base btn-regular" onClick={saveAssignment} disabled={saving || !title.trim()}>{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>

      <AIPanel mode="assignment" onFill={handleAIFill} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLANNING LIST
// ─────────────────────────────────────────────────────────────────────────────
function PlanningList({ onBack, onCreatePlan, onOpenPlan, onOpenTemplates, plans, loading, source }) {
  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <div className="double-border--principal">
        <button className="btn-back col-no-padding-left" onClick={onBack}>← Atrás</button>
      </div>
      <div className="d-flex align-items-center" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1 className="heading-h1">Planificación</h1>
        <div className="d-flex align-items-center" style={{ gap: 10 }}><button className="pl btn-base btn-simple" onClick={onOpenTemplates}>Plantillas / mapas curriculares</button><button className="pl btn-base btn-regular" onClick={onCreatePlan}>+ Crear planificacion</button></div>
      </div>
      <table className="ppalTable">
        <thead><tr><th>Nombre del plan</th><th>Materia</th><th>Grado</th><th>Fecha inicio</th><th>Fecha fin</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {plans.map(p => (
            <tr key={p.PlanId}>
              <td>{p.PlanName}</td><td>{p.SubjectName}</td><td>{p.LevelCode}</td>
              <td>{p.OpenDate}</td><td>{p.CloseDate}</td>
              <td><span className={p.IsPlanOpen ? "badge-published" : "badge-draft"}>{p.IsPlanOpen ? "Abierto" : "Cerrado"}</span></td>
              <td><button className="pl btn-base btn-regular" onClick={() => onOpenPlan(p)}>Abrir</button></td>
            </tr>
          ))}
          {!plans.length && !loading && (
            <tr><td colSpan={7} style={{ textAlign: "center", color: "#999", padding: 18 }}>No hay planificaciones guardadas.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE PLAN
// ─────────────────────────────────────────────────────────────────────────────
function CreatePlan({ onBack, onCreated }) {
  const [form, setForm] = useState({ name: "", subject: "", grade: "", group: "", dateFrom: "", dateTo: "" });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  async function submit() {
    setSaving(true);
    const saved = await createSavedPlanning({
      ...MOCK.plans[0],
      PlanId: `plan-${Date.now()}`,
      PlanName: form.name || "Nuevo Plan",
      SubjectName: form.subject || "Ciencias",
      LevelCode: form.grade || "5",
      GroupName: form.group || "Grupo A",
      OpenDate: normalizePlanDate(form.dateFrom) || "05/22/2026",
      CloseDate: normalizePlanDate(form.dateTo) || "05/28/2026",
      IsPlanOpen: true,
      Lessons: [],
      SectionData: {},
    });
    setSaving(false);
    onCreated(saved);
  }
  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <div className="double-border--principal">
        <button className="btn-back col-no-padding-left" onClick={onBack}>← Atrás</button>
      </div>
      <h2 className="heading-h2" style={{ marginBottom: 16 }}>Crear planificación</h2>
      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#555", marginBottom: 16, display: "flex", gap: 8 }}>
        <span style={{ color: "#f59e0b" }}>⚠</span>
        <span>Los planes se cierran al llegar la fecha límite del período académico. Las tareas no completadas recibirán calificación de cero.</span>
      </div>
      <div style={{ maxWidth: 600 }}>
        <div className="form-group-fields">
          <div className="form-label-value-group"><label>* Período académico</label></div>
          <select className="form-select"><option>Período 4: sep 05, 2023 - may 31, 2030</option></select>
        </div>
        <div className="form-group-fields">
          <div className="form-label-value-group"><label>* Tema del plan</label></div>
          <input className="form-control" placeholder="Entre el nombre de la planificación. Ejemplo: AGO-DEC-2030 Grupo Avanzado" value={form.name} onChange={f("name")} />
        </div>
        <div className="row">
          <div className="col-6 pl-0">
            <div className="form-group-fields">
              <div className="form-label-value-group"><label>* Materia</label></div>
              <select className="form-select" value={form.subject} onChange={f("subject")}>
                <option value="">Seleccionar</option>
                {MOCK.subjects.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="col-6">
            <div className="form-group-fields">
              <div className="form-label-value-group"><label>* Grado</label></div>
              <select className="form-select" value={form.grade} onChange={f("grade")}>
                <option value="">Seleccionar</option>
                {MOCK.grades.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="form-group-fields">
          <div className="form-label-value-group"><label>Grupo de estudiantes</label></div>
          <select className="form-select" value={form.group} onChange={f("group")}>
            <option value="">Seleccionar grupo</option>
            {MOCK.groups.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="col-6 pl-0">
            <div className="form-group-fields">
              <div className="form-label-value-group"><label>Fecha inicio</label></div>
              <input type="date" className="form-control" value={form.dateFrom} onChange={f("dateFrom")} />
            </div>
          </div>
          <div className="col-6">
            <div className="form-group-fields">
              <div className="form-label-value-group"><label>Fecha cierre</label></div>
              <input type="date" className="form-control" value={form.dateTo} onChange={f("dateTo")} />
            </div>
          </div>
        </div>
        <div className="Region-w-action d-flex align-items-center" style={{ gap: 10 }}>
          <button className="pl btn-base btn-regular" onClick={onBack}>Cancelar</button>
          <button className="btn btn-normal" onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Crear planificación"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAN DETAIL — pantalla principal del plan abierto
// ─────────────────────────────────────────────────────────────────────────────
function makePreviewCells(dayIndex, items) {
  const cells = Array.from({ length: 7 }, () => []);
  cells[Math.max(0, Math.min(6, dayIndex))] = items.filter(item => item.desc);
  return cells;
}

function lessonPreviewDate(lesson, plan) {
  const lessonDays = lesson?.dates?.wholeWeek ? lesson?.dates?.days : lesson?.dates?.days;
  if (Array.isArray(lessonDays) && lessonDays.length) return lessonDays[0];
  return lesson?.startDate || plan.OpenDate;
}

function lessonDayIndex(lesson, days, plan) {
  const selectedDate = formatPlanDate(parsePlanDate(lessonPreviewDate(lesson, plan)));
  const idx = days.findIndex(day => day.date === selectedDate);
  return idx >= 0 ? idx : 0;
}

function evaluationDayIndex(lesson, days, plan) {
  const contentDay = lessonDayIndex(lesson, days, plan);
  if (lesson?.evaluationDate) {
    const requested = formatPlanDate(parsePlanDate(lesson.evaluationDate));
    const requestedIdx = days.findIndex(day => day.date === requested);
    if (requestedIdx > contentDay) return requestedIdx;
  }
  const offset = contentDay <= 3 ? 2 : 1;
  return Math.min(contentDay + offset, days.length - 1);
}

function PlanningPreviewCell({ items }) {
  if (!items.length) return <span aria-hidden="true" />;
  return (
    <div className="tablePDF__container">
      <ul className="tablePDF__list">
        {items.map((item, idx) => (
          <li className="tablePDF__list--item" key={`${item.title}-${idx}`}>
            <div className={`tablePDF__list--item_desc ${idx ? "borderTop" : ""}`}>
              <p className="list--item_desc--title list--item_firstTitle">{item.title}</p>
              {item.time ? (
                <>
                  <p className="list--item_desc--desc_quiz">{item.desc}</p>
                  <p className="list--item_desc--desc_quiz-date">{item.time}</p>
                </>
              ) : (
                <div className="list--item_desc--desc_content">{item.desc}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanningPreviewArea({ plan, lessons, sectionData, previewLessonId, setPreviewLessonId }) {
  const printRef = useRef(null);
  const [pdfStatus, setPdfStatus] = useState("");
  const days = buildPlanDays(plan.OpenDate);
  const fallbackLesson = {
    id: "demo",
    title: "Zonas climaticas",
    startDate: plan.OpenDate,
    objective: "",
    standardCode: "",
  };
  const allLessons = lessons.length ? lessons : [fallbackLesson];
  const isAllLessons = previewLessonId === "__all__";
  const selectedLesson = isAllLessons ? allLessons[0] : (lessons.find(l => String(l.id) === previewLessonId) || allLessons[0]);
  const previewLessons = isAllLessons ? allLessons : [selectedLesson];

  function lessonTitleFor(lesson) {
    return lesson?.title || "Zonas climaticas";
  }

  function standardsFor(lesson) {
    return lesson?.standards && lesson.standards.length > 0
      ? lesson.standards.join(", ")
      : (lesson?.standardCode || "Ciencias Terrestres y del Espacio");
  }

  function cellsForLessons(dayResolver, itemBuilder) {
    const cells = Array.from({ length: 7 }, () => []);
    previewLessons.forEach((lesson, index) => {
      const targetDay = Math.max(0, Math.min(6, dayResolver(lesson, index)));
      cells[targetDay].push(...itemBuilder(lesson, index).filter(item => item.desc));
    });
    return cells;
  }
  function cellsForCreatableSection(sectionKey, title, mapper, fallbackText) {
    const cells = Array.from({ length: 7 }, () => []);
    const entries = sectionData[sectionKey];
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach(e => {
        const entryDays = e.dates?.wholeWeek 
          ? days.map(d => d.date) 
          : (e.dates?.days || []);
        entryDays.forEach(d => {
          const dayIdx = days.findIndex(day => day.date === d);
          if (dayIdx >= 0) {
            cells[dayIdx].push({
              title: title,
              desc: mapper(e)
            });
          }
        });
      });
    } else if (fallbackText) {
      const targetDay = 0;
      cells[targetDay].push({ title, desc: fallbackText });
    }
    return cells;
  }

  function cellsForTasksSection() {
    const cells = Array.from({ length: 7 }, () => []);
    const entries = sectionData["gl-tasks"];
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach(e => {
        const items = e.items || [];
        items.forEach(item => {
          if (item.date && item.assignmentTitle) {
            const dayIdx = days.findIndex(day => day.date === item.date);
            if (dayIdx >= 0) {
              cells[dayIdx].push({
                title: "Asignaciones",
                desc: `${item.assignmentTitle}${e.countsForGrade ? " (Cuenta para nota)" : ""}`
              });
            }
          }
        });
      });
    }
    return cells;
  }
    
  const rows = [
    { label: "Lecciones", cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => [{ title: "Contenido genial", desc: lessonTitleFor(l) }]) },
    {
      label: "Temas transversales",
      cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.transversals ? [{ title: lessonTitleFor(l), desc: l.transversals }] : [
        { title: lessonTitleFor(l), desc: "Equidad y respeto entre todos los seres humanos" },
        { title: lessonTitleFor(l), desc: "Educacion para la conciacion ambiental y ecologica" },
        { title: lessonTitleFor(l), desc: "Tecnologia de la informacion y la comunicacion" },
      ]),
    },
    { label: "Estandares", cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => [{ title: lessonTitleFor(l), desc: standardsFor(l) }]) },
    {
      label: "Expectativas",
      cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => [{ title: lessonTitleFor(l), desc: textOrFallback(l.expectations, textOrFallback(sectionData["fl-plan1"] && Array.isArray(sectionData["fl-plan1"]) ? sectionData["fl-plan1"].map(e => e.modos?.join(", ")).filter(Boolean).join("; ") : "", "Utiliza evidencia cientifica de varias fuentes de informacion para explicar y representar, mediante modelos, la funcion del Sol y los oceanos en el ciclo del agua y en las zonas climaticas de la Tierra.")) }]),
    },
    {
      label: "Objetivos",
      cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.objectives ? [{ title: lessonTitleFor(l), desc: l.objectives }] : [
        { title: lessonTitleFor(l), desc: "Aprendera sobre las zonas climaticas y las esferas de la Tierra." },
        { title: lessonTitleFor(l), desc: "Desarrollara comprension sobre las caracteristicas y componentes de cada zona climatica." },
        { title: lessonTitleFor(l), desc: "Valorara la importancia de conservar y proteger el planeta mediante acciones responsables." },
      ]),
    },
    {
      label: "Estrategia academica",
      cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.strategy ? [{ title: lessonTitleFor(l), desc: l.strategy }] : [
        { title: lessonTitleFor(l), desc: "Desarrollo conceptual" },
        { title: lessonTitleFor(l), desc: "Comprension lectora" },
      ]),
    },
    { label: "Integracion con otras materias", cells: cellsForCreatableSection("fl-integ", "Integracion con otras materias", e => (e.materias || []).join(", "), "Artes Visuales e Ingles") },
    { label: "Iniciativa o proyecto innovador", cells: cellsForCreatableSection("fl-innov", "Iniciativa o proyecto innovador", e => (e.tipos || []).join(", "), "STEM") },
    { label: "Evaluaciones (Avalúos)", cells: cellsForCreatableSection("fl-eval", "Evaluaciones (Avalúos)", e => [...(e.diagnostica || []), ...(e.formativa || []), ...(e.sumativa || [])].join(", ")) },
    { label: "Acomodos razonables", cells: cellsForCreatableSection("fl-acom", "Acomodos razonables", e => `${e.categoriaAcomodo}: ${(e.acomodos || []).join(", ")}`) },
    { label: "Estrategias de instruccion diferenciada", cells: cellsForCreatableSection("fl-strat", "Estrategias de instruccion diferenciada", e => `${e.categoria}: ${e.tipo === 'Otro' ? (e.otroTipo || 'Otro') : e.tipo}`, "Instruccion diferenciada por proceso") },
    { label: "Materiales", cells: cellsForCreatableSection("fl-mats", "Materiales", e => (e.materiales || []).join(", "), "Libro digital, pizarra interactiva y recursos visuales de la leccion.") },
    { label: "Observaciones", cells: cellsForCreatableSection("fl-obs", "Observaciones", e => e.text) },
    { label: "Foros", cells: cellsForCreatableSection("gl-forums", "Foros", e => e.titulo) },
    { label: "Asignaciones", cells: cellsForTasksSection() },
    { label: "Actividad de Inicio", cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.startActivity ? [{ title: lessonTitleFor(l), desc: l.startActivity }] : []) },
    { label: "Actividad de desarrollo", cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.devActivity ? [{ title: lessonTitleFor(l), desc: l.devActivity }] : []) },
    { label: "Actividad de cierre", cells: cellsForLessons(l => lessonDayIndex(l, days, plan), l => l.endActivity ? [{ title: lessonTitleFor(l), desc: l.endActivity }] : []) },
  ];

  async function downloadPlanningPdf() {
    if (!printRef.current) return;
    setPdfStatus("Generando PDF...");
    const header = printRef.current.querySelector(".planning-print-header");
    const scroll = printRef.current.querySelector(".tablePDF__scroll");
    const wrapper = printRef.current.querySelector(".table-pdf-preview");
    if (header) header.style.display = "block";
    const oldScroll = scroll ? { maxHeight: scroll.style.maxHeight, overflow: scroll.style.overflow } : null;
    const oldWrapper = wrapper ? { maxHeight: wrapper.style.maxHeight, overflow: wrapper.style.overflow } : null;
    if (scroll) { scroll.style.maxHeight = "none"; scroll.style.overflow = "visible"; }
    if (wrapper) { wrapper.style.maxHeight = "none"; wrapper.style.overflow = "visible"; }
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: printRef.current.scrollWidth,
      scrollX: 0,
      scrollY: 0,
    });
    if (header) header.style.display = "";
    if (scroll && oldScroll) { scroll.style.maxHeight = oldScroll.maxHeight; scroll.style.overflow = oldScroll.overflow; }
    if (wrapper && oldWrapper) { wrapper.style.maxHeight = oldWrapper.maxHeight; wrapper.style.overflow = oldWrapper.overflow; }
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    const img = canvas.toDataURL("image/png");
    let y = margin;
    let remaining = imgH;
    while (remaining > 0) {
      pdf.addImage(img, "PNG", margin, y, imgW, imgH);
      remaining -= pageH - margin * 2;
      if (remaining > 0) {
        pdf.addPage();
        y -= pageH - margin * 2;
      }
    }
    pdf.save(`${plan.PlanName || "Planning Preview"}.pdf`);
    setPdfStatus("PDF descargado");
    setTimeout(() => setPdfStatus(""), 1800);
  }

  return (
    <>
      <div className="preview-subtitle">Previsualizar planificacion</div>
      <div className="preview-note">
        <span>!</span>
        <span>Nota: Si sale de esta pagina, el PDF dejara de generarse y el progreso se perdera. El PDF se generara nuevamente cuando regrese a la pagina.</span>
      </div>
      <div className="preview-actions">
        <button type="button" className="pl btn-base btn-primary" onClick={downloadPlanningPdf}>Imprimir PDF</button>
        <div className="preview-filter">
          <select value={previewLessonId} onChange={e => setPreviewLessonId(e.target.value)} aria-label="Seleccionar leccion">
            <option value="__all__">Todas las lecciones de la semana</option>
            {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
          </select>
          <button type="button" className="preview-icon-btn" title="Buscar leccion">⌕</button>
          <button type="button" className="preview-icon-btn" title="Limpiar seleccion" onClick={() => setPreviewLessonId(lessons[0]?.id ? String(lessons[0].id) : "")}>⌫</button>
        </div>
      </div>
      {pdfStatus && <div className="preview-status">{pdfStatus}</div>}
      <div className="planning-print-sheet" ref={printRef}>
      <div className="planning-print-header">
        <h1 className="planning-print-title">{plan.PlanName || "Planificacion"}</h1>
        <div className="planning-print-meta">
          <strong>Plan semanal, Semana #{plan.WeekNumber || "209"} - Rango:</strong> {plan.OpenDate} - {plan.CloseDate} | <strong>Grupo:</strong> {plan.GroupName} | <strong>Materia y grado:</strong> {plan.SubjectName} {plan.LevelCode}
        </div>
      </div>
      <div className="wrapper-tablePDF table-pdf-preview">
        <div className="tablePDF__scroll">
          <table className="tablePDF__content">
            <thead>
              <tr>
                <th scope="col" />
                {days.map(day => (
                  <th scope="col" key={day.date}>
                    <span className="tablePDF__date-format">MM/DD/YYYY</span>
                    <div className="tablePDF__infoDate">
                      <div className="tablePDF__infoDate--day">{day.label}</div>
                      <div className="tablePDF__infoDate--date">{day.date}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map((items, idx) => (
                    <td key={`${row.label}-${idx}`}><PlanningPreviewCell items={items} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATABLE SECTIONS — sections that mirror the real DEPR cotejo:
//    list view (table) → "Crear nueva" → form (date picker + dynamic fields)
//  Each entry is stored in sectionData[key] as an array of { id, dates, ...fields }.
// ─────────────────────────────────────────────────────────────────────────────
const DAYS_ES = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

const EVAL_OPTIONS = [
  'Diario Reflexivo', 'Organigrama', 'Reacción Inmediata',
  'Punto más confuso', 'Ensayo', 'Preprueba',
  'Postprueba', 'Examen parcial', 'Examen final',
  'Prueba corta', 'Mapa de conceptos', 'Tirillas Cómicas',
  'Informe Oral', 'Presentaciones Orales', 'Juegos',
  'Laboratorio Cartográfico', 'Trabajo de investigación', 'Trabajo especial',
  'Dramatización', 'Redacción de composición o ensayos', 'Informe Escrito',
  'Edmodo', 'Torbellino', 'Portafolio',
  'Entrevistas', 'Panel', 'Encuesta',
  'Lista de cotejo', 'Otro'
];

const ACOMODOS_MAP = {
  "Educación Especial": [
    "Tiempo adicional (tiempo y medio)",
    "Lugar libre de distracciones",
    "Uso de calculadora",
    "Lectura oral de las pruebas / instrucciones",
    "Uso de equipo de asistencia tecnológica",
    "Tutoría individual",
    "Sentar cerca del maestro",
    "Dividir el trabajo en partes o sesiones",
    "Descansos frecuentes",
    "Uso de manipulativos",
    "Fórmula de respuesta en el folleto",
    "Otro"
  ],
  "LSP": [
    "Uso de diccionario bilingüe",
    "Tiempo adicional para la ejecución",
    "Aclaraciones de términos o vocabulario en español/inglés",
    "Simplificación de instrucciones escritas",
    "Lectura oral en el idioma materno si es necesario",
    "Uso de apoyos visuales y traducción",
    "Otro"
  ],
  "Sección 504": [
    "Tiempo adicional para completar tareas",
    "Lugar preferencial (cerca del maestro/pizarra)",
    "Lugar libre de distracciones",
    "Modificación de formato de exámenes (ej. letra más grande)",
    "Uso de calculadora o computadora para escribir",
    "Descansos programados o frecuentes",
    "Otro"
  ],
  "Dotados": [
    "Enriquecimiento curricular con actividades de mayor profundidad",
    "Tareas o proyectos de investigación independientes",
    "Materiales de lectura avanzados u opcionales",
    "Tutoría de pares (apoyo y liderazgo en grupos)",
    "Velocidad acelerada de aprendizaje en conceptos clave",
    "Flexibilidad en la demostración del dominio del contenido",
    "Otro"
  ]
};

const STRAT_TYPES = {
  "Contenido": [
    "Lecturas graduadas de complejidad variable",
    "Organizadores gráficos y visuales",
    "Material auditivo y audiovisual",
    "Glosarios y vocabulario de apoyo",
    "Otro"
  ],
  "Proceso": [
    "Grupos de trabajo flexibles",
    "Centros de interés o de aprendizaje",
    "Andamiaje o instrucción guiada",
    "Tiempo extendido para ejecución",
    "Otro"
  ],
  "Producto": [
    "Proyectos individuales o grupales",
    "Demostraciones prácticas",
    "Evaluaciones adaptadas u orales",
    "Portafolios o diarios de aprendizaje",
    "Otro"
  ],
  "Ambiente de aprendizaje": [
    "Áreas de trabajo silencioso",
    "Espacios de colaboración interactiva",
    "Organización física adaptada del aula",
    "Otro"
  ]
};

const CREATABLE_SECTIONS = {
  'fl-plan1': {
    title: 'Crear nueva',
    subtitle: 'Seleccione los modos de instrucción que desea agregar para promover la respuesta activa del estudiante.',
    listColumns: [
      { key: 'modos',   label: 'Modos de instrucción', render: (e) => (e.modos || []).join(', ') },
      { key: 'incluye', label: 'La lección incluye',   render: (e) => (e.incluye || []).join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'checkboxes', name: 'modos', label: 'Seleccione uno o varios modos de instrucción para promover la respuesta activa del estudiante.', options: [
        'Dirigida por el maestro', 'Grupo dirigido por el maestro', 'Grupo(s) dirigido(s) por el estudiante',
        'Práctica guiada', 'Práctica individual',
      ]},
      { type: 'checkboxes', name: 'incluye', label: 'La lección incluye:', options: [
        'Respuesta activa del estudiante', 'Actividad de comprobación del aprendizaje',
      ]},
    ],
  },
  'fl-plan2': {
    title: 'Crear nueva',
    subtitle: 'Escriba la experiencia común (2 a 3 minutos) que desea agregar para la escuela en Plan de Mejoramiento.',
    listColumns: [
      { key: 'text',  label: 'Experiencia común', render: (e) => (e.text || '').slice(0, 120) + ((e.text || '').length > 120 ? '…' : '') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'textarea', name: 'text',
        label: 'Describa la experiencia común (2 a 3 minutos) que se implementará en la escuela en Plan de Mejoramiento.',
        placeholder: 'Detalle la experiencia común (2 a 3 minutos).',
        aiAssist: true,
        rows: 5,
      },
    ],
  },
  'fl-innov': {
    title: 'Crear nueva',
    subtitle: 'Seleccione la o las iniciativas o proyectos innovadores que desea integrar a su planificación.',
    listColumns: [
      { key: 'tipos', label: 'Iniciativa o proyecto innovador', render: (e) => (e.tipos || []).join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'checkboxes', name: 'tipos', label: 'Seleccione las iniciativas o proyectos innovadores que desea agregar.', options: [
        'Tecnología', 'PBL', 'STEM', 'STEAM', 'Innovación', 'Emprendimiento', 'Otro',
      ]},
    ],
  },
  'fl-integ': {
    title: 'Crear nueva',
    subtitle: 'Seleccione la o las materias que desea integrar a su planificación.',
    listColumns: [
      { key: 'materias', label: 'Materias', render: (e) => (e.materias || []).join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'checkboxes', name: 'materias', label: 'Seleccione la o las materias que desea integrar a su planificación.', options: [
        'Artes Visuales (Inglés)', 'Estudios Sociales', 'Español', 'Matemáticas', 'Ciencias', 'Inglés', 'Salud', 'Educación Física', 'Música', 'Teatro', 'Otro'
      ]},
    ],
  },
  'fl-reflex': {
    title: 'Crear nueva',
    subtitle: 'Seleccione las reflexiones de praxis que desea agregar a su planificación.',
    listColumns: [
      { key: 'text', label: 'Reflexión', render: (e) => e.incluirReflexion === 'No' ? 'No se incluye reflexión' : (e.text || '').slice(0, 120) + ((e.text || '').length > 120 ? '…' : '') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      {
        type: 'radios',
        name: 'incluirReflexion',
        label: 'Desea incluir reflexión',
        options: ['Sí', 'No'],
        defaultValue: 'Sí'
      },
      {
        type: 'textarea',
        name: 'text',
        label: 'Detalle la reflexión',
        placeholder: 'Escriba la reflexión de praxis aquí...',
        aiAssist: true,
        rows: 5,
        condition: (entry) => entry.incluirReflexion !== 'No'
      }
    ]
  },
  'fl-obs': {
    title: 'Crear nueva',
    subtitle: 'Escriba la observación que desea agregar a su planificación.',
    listColumns: [
      { key: 'text', label: 'Observación', render: (e) => (e.text || '').slice(0, 120) + ((e.text || '').length > 120 ? '…' : '') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'textarea', name: 'text', label: 'Escriba la observación que desea agregar a su planificación', placeholder: 'Detalle la observación', aiAssist: true, rows: 5 }
    ]
  },
  'fl-mats': {
    title: 'Crear nueva',
    subtitle: 'Seleccione los acomodos razonables o adaptaciones curriculares que desea agregar a su planificación.',
    listColumns: [
      { key: 'materiales', label: 'Materiales', render: (e) => (e.materiales || []).join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'checkboxes', name: 'materiales', label: 'Seleccione uno o varios para su planificación', options: [
        'Materiales escolares (crayolas, papel, tijeras, etc.)', 'Calculadora', 'Papel cuadriculado', 'Cuaderno de mapas',
        'Diccionario', 'Materiales de arte', 'Fotocopias (ejercicios, pruebas, etc.)', 'Libreta de la clase',
        'Equipo de laboratorio', 'Carteles, cartulinas', 'Recursos tecnológicos (materiales/equipo)', 'Texto del curso',
        'Libreta de vocabulario', 'Equipo de deporte', 'Portafolios', 'Otra'
      ]}
    ]
  },
  'fl-strat': {
    title: 'Crear nueva',
    subtitle: 'Agregue la estrategia de instrucción diferenciada que desea para la planificación.',
    listColumns: [
      { key: 'categoria', label: 'Categoría', render: (e) => e.categoria || '—' },
      { key: 'tipo', label: 'Tipo de estrategia', render: (e) => e.tipo === 'Otro' ? (e.otroTipo || 'Otro') : (e.tipo || '—') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      {
        type: 'radios',
        name: 'categoria',
        label: 'Categoría',
        options: ['Contenido', 'Proceso', 'Producto', 'Ambiente de aprendizaje'],
        defaultValue: 'Contenido'
      },
      {
        type: 'select',
        name: 'tipo',
        label: 'Tipo de estrategia',
        options: (entry) => {
          const cat = entry.categoria || 'Contenido';
          return STRAT_TYPES[cat] || [];
        }
      },
      {
        type: 'textarea',
        name: 'otroTipo',
        label: 'Escriba el tipo de estrategia personalizado',
        placeholder: 'Detalle la estrategia aquí...',
        condition: (entry) => entry.tipo === 'Otro'
      }
    ]
  },
  'fl-eval': {
    title: 'Crear nueva',
    subtitle: 'Seleccione la o las evaluaciones y avalúos que desea integrar a su planificación',
    listColumns: [
      { key: 'evaluaciones', label: 'Evaluaciones (Avalúos)', render: (e) => [...(e.diagnostica || []), ...(e.formativa || []), ...(e.sumativa || [])].join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      {
        type: 'checkboxes',
        name: 'diagnostica',
        label: 'Seleccione una o varias para la evaluación y avalúos (Diagnóstica)',
        options: EVAL_OPTIONS
      },
      {
        type: 'checkboxes',
        name: 'formativa',
        label: 'Seleccione una o varias para la evaluación y avalúos (Formativa)',
        options: EVAL_OPTIONS
      },
      {
        type: 'checkboxes',
        name: 'sumativa',
        label: 'Seleccione una o varias para la evaluación y avalúos (Sumativa)',
        options: EVAL_OPTIONS
      }
    ]
  },
  'fl-acom': {
    title: 'Crear nueva',
    subtitle: 'Seleccione los acomodos que desea agregar a su planificación',
    listColumns: [
      { key: 'categoriaAcomodo', label: 'Tipo de acomodo', render: (e) => e.categoriaAcomodo || '—' },
      { key: 'acomodos', label: 'Acomodos razonables', render: (e) => (e.acomodos || []).join(', ') },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      {
        type: 'select',
        name: 'categoriaAcomodo',
        label: 'Seleccione la categoría de acomodo',
        options: ['Educación Especial', 'LSP', 'Sección 504', 'Dotados']
      },
      {
        type: 'checkboxes',
        name: 'acomodos',
        label: 'Acomodos razonables',
        options: (entry) => {
          return ACOMODOS_MAP[entry.categoriaAcomodo] || [];
        },
        condition: (entry) => !!entry.categoriaAcomodo
      }
    ]
  },
  'gl-forums': {
    title: 'Crear nueva',
    subtitle: 'Añada el foro que desea agregar a su planificación',
    listColumns: [
      { key: 'titulo', label: 'Título del foro', render: (e) => e.titulo || '—' },
      { key: 'startDate', label: 'Fecha de inicio', render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).start) },
      { key: 'endDate',   label: 'Fecha de fin',    render: (e, plan) => formatTableDate(getEntryStartEndDates(e.dates, plan?.OpenDate, plan?.CloseDate).end) },
    ],
    fields: [
      { type: 'dates' },
      { type: 'text', name: 'titulo', label: 'Título del foro', placeholder: 'Título del foro' },
      { type: 'textarea', name: 'descripcion', label: 'Añada la descripción del foro', placeholder: 'Escriba la descripción del foro aquí...', rows: 5 }
    ]
  },
  'gl-tasks': {
    title: 'Crear nueva',
    subtitle: 'Añada las asignaciones que desea agregar a su planificación',
    listColumns: [
      { key: 'asignaciones', label: 'Asignación asociada', render: (e) => (e.items || []).map(item => item.assignmentTitle).join(', ') },
      { key: 'fecha', label: 'Fecha', render: (e) => (e.items || []).map(item => item.date).join(', ') },
      { key: 'nota', label: 'Cuenta para nota', render: (e) => e.countsForGrade ? 'Sí' : 'No' }
    ],
    fields: [
      { type: 'assignments_picker', name: 'items' }
    ]
  }
};

function renderDates(entry) {
  if (entry?.dates?.wholeWeek) return 'Toda la semana';
  const days = entry?.dates?.days || [];
  if (!days.length) return '—';
  return days.map(d => d[0].toUpperCase() + d.slice(1)).join(', ');
}

function CreatableSection({ cfg, entries, onUpsert, onDelete, aiContext, plan, assignments = [] }) {
  const [editing, setEditing] = useState(null); // null = list view; otherwise the entry being created/edited

  function startCreate() {
    setEditing({ id: `e_${Date.now()}`, dates: { wholeWeek: false, days: [] } });
  }
  function startEdit(entry) { setEditing({ ...entry }); }
  function cancel() { setEditing(null); }
  function commit() {
    onUpsert(editing);
    setEditing(null);
  }

  if (editing) {
    return (
      <EntryForm
        cfg={cfg}
        entry={editing}
        onChange={setEditing}
        onCancel={cancel}
        onSave={commit}
        aiContext={aiContext}
        plan={plan}
        assignments={assignments}
      />
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>{cfg.subtitle}</p>
      <button className="pl btn-base btn-primary" style={{ marginBottom: 18 }} onClick={startCreate}>
        ⊕ Crear nueva
      </button>
      {entries.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '20px 0' }}>
          No hay entradas todavía. Click en <strong>+ Crear nueva</strong> para agregar una.
        </p>
      ) : (
        <table className="ppalTable">
          <thead>
            <tr>
              {cfg.listColumns.map(c => <th key={c.key}>{c.label}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                {cfg.listColumns.map(c => <td key={c.key}>{c.render(e, plan) || '—'}</td>)}
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-normal" style={{ padding: '5px 12px' }} onClick={() => startEdit(e)}>✎ Ver/Editar</button>
                  <button className="pl btn-simple" style={{ color: '#e32f28', fontSize: 16 }} onClick={() => onDelete(e.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function EntryForm({ cfg, entry, onChange, onCancel, onSave, aiContext, plan, assignments = [] }) {
  useEffect(() => {
    if (cfg.fields.some(f => f.type === 'assignments_picker')) {
      const pickerField = cfg.fields.find(f => f.type === 'assignments_picker');
      if (!entry[pickerField.name]) {
        onChange({
          ...entry,
          [pickerField.name]: [{ id: `item_${Date.now()}`, date: '', assignmentId: '', assignmentTitle: '' }],
          countsForGrade: true
        });
      }
    }
  }, []);

  function setField(name, val) { onChange({ ...entry, [name]: val }); }
  function toggleOpt(name, opt) {
    const arr = entry[name] || [];
    const next = arr.includes(opt) ? arr.filter(o => o !== opt) : [...arr, opt];
    setField(name, next);
  }

  const hasDates = !cfg.fields.some(f => f.type === 'dates') || entry.dates?.wholeWeek || (entry.dates?.days && entry.dates.days.length > 0);
  let canSave = hasDates;
  if (cfg.fields.some(f => f.type === 'checkboxes')) {
    const cbFields = cfg.fields.filter(f => f.type === 'checkboxes' && (!f.condition || f.condition(entry)));
    const cbOk = cbFields.every(f => (entry[f.name] || []).length > 0);
    canSave = canSave && cbOk;
  }
  if (cfg.fields.some(f => f.type === 'select')) {
    const selFields = cfg.fields.filter(f => f.type === 'select' && (!f.condition || f.condition(entry)));
    const selOk = selFields.every(f => (entry[f.name] || '').trim().length > 0);
    canSave = canSave && selOk;
  }
  if (cfg.fields.some(f => f.type === 'text')) {
    const textFields = cfg.fields.filter(f => f.type === 'text' && (!f.condition || f.condition(entry)));
    const textOk = textFields.every(f => (entry[f.name] || '').trim().length > 0);
    canSave = canSave && textOk;
  }
  if (cfg.fields.some(f => f.type === 'textarea')) {
    const taFields = cfg.fields.filter(f => f.type === 'textarea' && (!f.condition || f.condition(entry)));
    const taOk = taFields.every(f => (entry[f.name] || '').trim().length > 0);
    canSave = canSave && taOk;
  }
  if (cfg.fields.some(f => f.type === 'assignments_picker')) {
    const pickerField = cfg.fields.find(f => f.type === 'assignments_picker');
    const items = entry[pickerField.name] || [];
    const pickerOk = items.length > 0 && items.every(item => item.date && item.assignmentId);
    canSave = canSave && pickerOk;
  }

  return (
    <div className="cs-form">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="pl btn-base btn-regular" onClick={onCancel}>Cancelar</button>
        <button className="pl btn-base btn-primary" disabled={!canSave} onClick={onSave}>
          💾 Guardar
        </button>
      </div>

      {cfg.fields.map((f, i) => {
        if (f.condition && !f.condition(entry)) return null;

        if (f.type === 'dates') {
          return (
            <DatePickerField
              key={i}
              plan={plan}
              value={entry.dates}
              onChange={(v) => setField('dates', v)}
            />
          );
        }
        if (f.type === 'radios') {
          const val = entry[f.name] !== undefined ? entry[f.name] : (f.defaultValue || '');
          return (
            <div key={i} className="cs-block">
              <h3 className="cs-block-title">{f.label}</h3>
              <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
                {f.options.map(opt => (
                  <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '13.5px' }}>
                    <input
                      type="radio"
                      name={f.name}
                      checked={val === opt}
                      onChange={() => setField(f.name, opt)}
                      style={{ accentColor: '#3DA8A8' }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }
        if (f.type === 'select') {
          const options = typeof f.options === 'function' ? f.options(entry) : (f.options || []);
          return (
            <div key={i} className="cs-block">
              <h3 className="cs-block-title">{f.label}</h3>
              <select
                className="form-select"
                value={entry[f.name] || ''}
                onChange={(e) => setField(f.name, e.target.value)}
                style={{ background: '#fff', border: '1px solid #ced4da', padding: '8px 12px', fontSize: '14px' }}
              >
                <option value="">Seleccionar</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          );
        }
        if (f.type === 'text') {
          return (
            <div key={i} className="cs-block">
              <h3 className="cs-block-title">{f.label}</h3>
              <input
                type="text"
                className="form-control"
                placeholder={f.placeholder}
                value={entry[f.name] || ''}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            </div>
          );
        }
        if (f.type === 'checkboxes') {
          const options = typeof f.options === 'function' ? f.options(entry) : (f.options || []);
          return (
            <div key={i} className="cs-block">
              <h3 className="cs-block-title">{f.label}</h3>
              <div className="cs-checks">
                {options.map(opt => {
                  const on = (entry[f.name] || []).includes(opt);
                  return (
                    <label key={opt} className={`cs-opt ${on ? 'on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleOpt(f.name, opt)} />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }
        if (f.type === 'textarea') {
          return (
            <div key={i} className="cs-block">
              <h3 className="cs-block-title">{f.label}</h3>
              {f.aiAssist && <AIAssistButton onText={(t) => setField(f.name, t)} fieldLabel={f.label} aiContext={aiContext} />}
              <textarea
                className="form-control"
                rows={f.rows || 4}
                placeholder={f.placeholder}
                value={entry[f.name] || ''}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            </div>
          );
        }
        if (f.type === 'assignments_picker') {
          const items = entry[f.name] || [];
          const handleItemChange = (idx, key, val) => {
            const next = items.map((item, i) => {
              if (i === idx) {
                const updated = { ...item, [key]: val };
                if (key === 'assignmentId') {
                  const ass = (assignments.length ? assignments : MOCK.assignments).find(a => String(a.Id) === String(val));
                  updated.assignmentTitle = ass ? ass.Title : '';
                }
                return updated;
              }
              return item;
            });
            setField(f.name, next);
          };
          const handleAddItem = () => {
            const next = [...items, { id: `item_${Date.now()}_${items.length}`, date: '', assignmentId: '', assignmentTitle: '' }];
            setField(f.name, next);
          };
          const handleRemoveItem = (idx) => {
            if (items.length <= 1) return;
            const next = items.filter((_, i) => i !== idx);
            setField(f.name, next);
          };

          return (
            <div key={i}>
              <div className="cs-block">
                <h3 className="cs-block-title">Seleccione la fecha para esta actividad</h3>
                {items.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px' }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7A93', display: 'block', marginBottom: 4 }}>Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={item.date ? (() => {
                          const [m, d, y] = item.date.split('/');
                          return `${y}-${m}-${d}`;
                        })() : ''}
                        onChange={(e) => {
                          const val = e.target.value; // YYYY-MM-DD
                          const normalized = normalizePlanDate(val); // MM/DD/YYYY
                          handleItemChange(idx, 'date', normalized);
                        }}
                        style={{ background: '#fff', border: '1px solid #ced4da', padding: '8px 12px', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ flex: '2 1 280px' }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7A93', display: 'block', marginBottom: 4 }}>Asignación</label>
                      <select
                        className="form-select"
                        value={item.assignmentId || ''}
                        onChange={(e) => handleItemChange(idx, 'assignmentId', e.target.value)}
                        style={{ background: '#fff', border: '1px solid #ced4da', padding: '8px 12px', fontSize: '14px' }}
                      >
                        <option value="">Seleccionar</option>
                        {(assignments.length ? assignments : MOCK.assignments).map(ass => (
                          <option key={ass.Id} value={ass.Id}>{ass.Title}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', paddingBottom: 4 }}>
                      <button
                        type="button"
                        className="preview-icon-btn"
                        title="Ver asignación"
                        onClick={() => alert(`Visualizando: ${item.assignmentTitle || 'Seleccione una asignación'}`)}
                        style={{ padding: '8px', fontSize: '14px' }}
                      >
                        👁
                      </button>
                      <button
                        type="button"
                        className="preview-icon-btn"
                        title="Eliminar fila"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        style={{ padding: '8px', fontSize: '14px', color: items.length <= 1 ? '#ccc' : '#e32f28' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: '#33353d' }}>
                    <input
                      type="checkbox"
                      checked={!!entry.countsForGrade}
                      onChange={(e) => setField('countsForGrade', e.target.checked)}
                      style={{ accentColor: '#3DA8A8', width: 16, height: 16 }}
                    />
                    <span>Marque si la asignación contará para nota</span>
                  </label>
                </div>
                
                <button
                  type="button"
                  className="pl btn-base btn-regular"
                  onClick={handleAddItem}
                  style={{ marginTop: 14, fontSize: '12px', padding: '6px 14px' }}
                >
                  Añadir otra asignación a este plan
                </button>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function DatePickerField({ plan, value, onChange }) {
  const wholeWeek = !!value?.wholeWeek;
  return (
    <div className="cs-block">
      <h3 className="cs-block-title">Seleccione la fecha para esta actividad</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: '#33353d', fontSize: 13 }}>¿Desea que la fecha aplique para toda la semana?</span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            name="ww"
            checked={wholeWeek}
            onChange={() => onChange({ wholeWeek: true, days: buildPlanDays(plan.OpenDate).map(d => d.date) })}
            style={{ accentColor: '#3DA8A8' }}
          /> Sí
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            name="ww"
            checked={!wholeWeek}
            onChange={() => onChange({ wholeWeek: false, days: [] })}
            style={{ accentColor: '#3DA8A8' }}
          /> No
        </label>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
        Seleccione los días de la semana que desea para esta actividad:
      </div>
      <MonthlyCalendar
        plan={plan}
        value={value}
        onChange={onChange}
        disabled={false}
      />
    </div>
  );
}

function AIAssistButton({ onText, fieldLabel, aiContext }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function suggest() {
    setBusy(true); setError('');
    try {
      const sys = `Eres un asistente pedagógico del DEPR de Puerto Rico. Responde con un párrafo breve, claro, profesional, listo para que el maestro lo pegue en el campo "${fieldLabel}". NO uses markdown, NO uses listas — solo texto plano.`;
      const user = `Plan: ${aiContext?.plan?.PlanName || ''}. Materia: ${aiContext?.plan?.SubjectName || ''}. Grado: ${aiContext?.plan?.LevelCode || ''}. Sección: ${aiContext?.sectionLabel || ''}.\n\nGenera una sugerencia concreta y breve (2-4 oraciones) apropiada para esta sección del cotejo.`;
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'anthropic/claude-haiku-4.5', system: sys, user }),
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let out = ''; let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const l of lines) {
          if (!l.startsWith('data:')) continue;
          const p = l.slice(5).trim();
          if (p === '[DONE]') continue;
          try { const j = JSON.parse(p); if (j.delta) out += j.delta; } catch {}
        }
      }
      onText(out.trim());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <button type="button" className="pl btn-base btn-regular" style={{ fontSize: 12, padding: '4px 12px' }} disabled={busy} onClick={suggest}>
        {busy ? '⏳ Generando…' : '✨ Sugerir con IA'}
      </button>
      {error && <span style={{ marginLeft: 10, color: '#7a1a14', fontSize: 11 }}>{error}</span>}
    </div>
  );
}

function MonthlyCalendar({ plan, value, onChange, disabled }) {
  const openDate = parsePlanDate(plan.OpenDate);
  const closeDate = parsePlanDate(plan.CloseDate);
  const year = openDate.getFullYear();
  const month = openDate.getMonth();
  const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const DAYS_ES_COLS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
  const getDayOfWeekIndex = (d) => {
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
  };
  const firstOfMonth = new Date(year, month, 1);
  const startDayIndex = getDayOfWeekIndex(firstOfMonth);
  const startGridDate = new Date(firstOfMonth);
  startGridDate.setDate(firstOfMonth.getDate() - startDayIndex);
  const weeks = [];
  const currentDate = new Date(startGridDate);
  const numWeeks = (startDayIndex + new Date(year, month + 1, 0).getDate()) > 35 ? 6 : 5;
  for (let w = 0; w < numWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }
  const selectedDays = value?.days || [];
  const wholeWeek = !!value?.wholeWeek;
  const isDateBetween = (d, start, end) => {
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const ss = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const es = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return ds >= ss && ds <= es;
  };
  const toggleDate = (date) => {
    if (disabled || wholeWeek) return;
    const dateStr = formatPlanDate(date);
    const nextDays = selectedDays.includes(dateStr)
      ? selectedDays.filter(d => d !== dateStr)
      : [...selectedDays, dateStr];
    onChange({ wholeWeek: false, days: nextDays });
  };
  return (
    <div className="cal-container">
      <div className="cal-header">
        {MONTHS_ES[month]} {year}
      </div>
      <div className="cal-grid">
        {DAYS_ES_COLS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="cal-week-row">
            {week.map((date, dIdx) => {
              const dateStr = formatPlanDate(date);
              const active = isDateBetween(date, openDate, closeDate);
              const isSelected = wholeWeek ? active : selectedDays.includes(dateStr);
              let className = "cal-day-cell";
              if (active) className += " active";
              if (isSelected) className += " selected";
              if (date.getMonth() !== month) className += " other-month";
              return (
                <button
                  key={dIdx}
                  type="button"
                  className={className}
                  onClick={() => active && toggleDate(date)}
                  disabled={disabled || !active || wholeWeek}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChipsInput({ value = [], onChange }) {
  const [inputValue, setInputValue] = useState("");
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !value.includes(val)) {
        onChange([...value, val]);
      }
      setInputValue("");
    }
  };
  const removeChip = (chipToRemove) => {
    onChange(value.filter(c => c !== chipToRemove));
  };
  return (
    <div className="chips-input-container">
      <div className="chips-list">
        {value.map(chip => (
          <span key={chip} className="chip-item">
            {chip}
            <button type="button" className="chip-remove" onClick={() => removeChip(chip)}>×</button>
          </span>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Ingrese los datos..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span style={{ position: "absolute", right: 12, top: 12, color: "#aaa", pointerEvents: "none" }}>▼</span>
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
        Escriba y presione <strong>ENTER</strong> para agregar
      </div>
      <div style={{ fontSize: 11, color: "#c3902a", marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}>
        <span>⚠</span>
        <span>Nota: luego de pulsar ENTER no podrán ser modificables, deberá eliminarlos y volverlos agregar</span>
      </div>
    </div>
  );
}

function LessonForm({ plan, lesson, onChange, onCancel, onSave }) {
  const setField = (name, val) => onChange({ ...lesson, [name]: val });
  const toggleSection = (sectionName) => {
    const nextSelected = {
      ...lesson.selectedSections,
      [sectionName]: !lesson.selectedSections[sectionName]
    };
    onChange({ ...lesson, selectedSections: nextSelected });
  };
  const hasDates = lesson.dates?.wholeWeek || (lesson.dates?.days && lesson.dates.days.length > 0);
  const canSave = lesson.title.trim().length > 0 && hasDates;
  const SECTIONS_CONFIG = [
    { key: "standards", label: "Estándares", type: "chips" },
    { key: "expectations", label: "Expectativas", type: "textarea", placeholder: "Escriba las expectativas..." },
    { key: "strategy", label: "Estrategia académica", type: "textarea", placeholder: "Escriba las estrategias académicas..." },
    { key: "objectives", label: "Objetivos", type: "textarea", placeholder: "Escriba los objetivos..." },
    { key: "units", label: "Unidades", type: "textarea", placeholder: "Escriba las unidades..." },
    { key: "transversals", label: "Temas transversales", type: "textarea", placeholder: "Escriba los temas transversales..." },
    { key: "startActivity", label: "Actividad de Inicio", type: "textarea", placeholder: "Escriba la actividad de inicio..." },
    { key: "devActivity", label: "Actividad de desarrollo", type: "textarea", placeholder: "Escriba la actividad de desarrollo..." },
    { key: "endActivity", label: "Actividad de cierre", type: "textarea", placeholder: "Escriba la actividad de cierre..." },
  ];
  return (
    <div className="cs-form">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="pl btn-base btn-regular" onClick={onCancel}>Cancelar</button>
        <button className="pl btn-base btn-primary" disabled={!canSave} onClick={() => onSave(lesson)}>
          💾 Guardar
        </button>
      </div>
      <DatePickerField
        plan={plan}
        value={lesson.dates}
        onChange={(v) => setField('dates', v)}
      />
      <div className="cs-block">
        <h2 className="heading-h2" style={{ color: '#27466c', fontSize: '18px', marginBottom: '14px' }}>
          Desarrolle la lección para esta actividad
        </h2>
        <div className="form-group-fields">
          <div className="form-label-value-group">
            <label>Título de la lección</label>
          </div>
          <input
            className="form-control"
            placeholder="Título de la lección"
            value={lesson.title}
            onChange={e => setField('title', e.target.value)}
          />
        </div>
      </div>
      {SECTIONS_CONFIG.map(sec => {
        const isSelected = !!lesson.selectedSections?.[sec.key];
        return (
          <div key={sec.key} className="cs-block" style={{ borderTop: '1px solid #e4e4e4', paddingTop: '16px' }}>
            <h3 className="cs-block-title" style={{ fontSize: '15px', color: '#27466c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{sec.label}</span>
            </h3>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: '#6B7A93', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSection(sec.key)}
                style={{ accentColor: '#3DA8A8' }}
              />
              <span>Seleccione este contenido para la lección</span>
            </label>
            {isSelected && (
              <div style={{ marginTop: '10px' }}>
                {sec.type === "chips" ? (
                  <ChipsInput
                    value={lesson.standards}
                    onChange={(val) => setField('standards', val)}
                  />
                ) : (
                  <>
                    <AIAssistButton
                      onText={(t) => setField(sec.key, t)}
                      fieldLabel={sec.label}
                      aiContext={{ plan, sectionLabel: sec.label }}
                    />
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder={sec.placeholder}
                      value={lesson[sec.key] || ''}
                      onChange={e => setField(sec.key, e.target.value)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanDetail({ plan, onBack, onPlanSaved, assignments = [] }) {
  const [section,     setSection]     = useState("cotejo");
  const [sectionData, setSectionData] = useState(plan.SectionData || {});
  const [lessons,     setLessons]     = useState([
    ...(Array.isArray(plan.Lessons) ? plan.Lessons : []),
    ...(!Array.isArray(plan.Lessons) || plan.Lessons.length === 0 ? [
    { id: 1, title: "Zonas climáticas", startDate: "mar.: 05/26/2026", endDate: "mar.: 05/26/2026", countsForGrade: false, availability: "vie.: 05/22/2026" },
    ] : []),
  ]);
  const [previewLessonId, setPreviewLessonId] = useState("1");
  const [saveStatus, setSaveStatus] = useState("");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const current = MOCK.cotejo.find(s => s.key === section);

  async function savePlanChanges(next = {}) {
    setSaveStatus("Guardando...");
    const saved = await updateSavedPlanning({
      ...plan,
      ...next,
      Lessons: next.Lessons || lessons,
      SectionData: next.SectionData || sectionData,
    });
    onPlanSaved?.(saved);
    setSaveStatus(saved.SavedLocally ? "Guardado localmente" : "Guardado");
    setTimeout(() => setSaveStatus(""), 1800);
    return saved;
  }

  // Add or replace an entry in a creatable section. Each entry has its own id.
  function upsertSectionEntry(sectionKey, entry) {
    const existing = Array.isArray(sectionData[sectionKey]) ? sectionData[sectionKey] : [];
    const idx = existing.findIndex(e => e.id === entry.id);
    const next = idx === -1 ? [...existing, entry] : existing.map(e => e.id === entry.id ? entry : e);
    const nextData = { ...sectionData, [sectionKey]: next };
    setSectionData(nextData);
    savePlanChanges({ SectionData: nextData });
  }

  function deleteSectionEntry(sectionKey, entryId) {
    const existing = Array.isArray(sectionData[sectionKey]) ? sectionData[sectionKey] : [];
    const next = existing.filter(e => e.id !== entryId);
    const nextData = { ...sectionData, [sectionKey]: next };
    setSectionData(nextData);
    savePlanChanges({ SectionData: nextData });
  }

  function handleAIFill(data) {
    if (data.content) setSectionData(p => ({ ...p, [section]: data.content }));
  }

  function applyFullPlan({ lessons: newLessons, sections }) {
    if (Array.isArray(newLessons) && newLessons.length) {
      setLessons(prev => [
        ...prev,
        ...newLessons.map((l, i) => ({
          id: Date.now() + i,
          title: l.title || `Lección ${i + 1}`,
          objective: l.objective || "",
          standardCode: l.standardCode || "",
          startDate: l.startDate || plan.OpenDate,
          endDate: l.endDate || plan.CloseDate,
          evaluationDate: l.evaluationDate || "",
          countsForGrade: !!l.countsForGrade,
          availability: l.startDate || plan.OpenDate,
          duration: l.duration || "",
          startActivity: l.startActivity || "",
          devActivity: l.devActivity || "",
          endActivity: l.endActivity || "",
        })),
      ]);
    }
    if (sections && typeof sections === "object") {
      const nextSections = { ...sectionData, ...sections };
      setSectionData(nextSections);
      savePlanChanges({ Lessons: Array.isArray(newLessons) && newLessons.length ? [...lessons, ...newLessons.map((l, i) => ({
        id: Date.now() + i,
        title: l.title || `Lección ${i + 1}`,
        objective: l.objective || "",
        standardCode: l.standardCode || "",
        startDate: l.startDate || plan.OpenDate,
        endDate: l.endDate || plan.CloseDate,
        evaluationDate: l.evaluationDate || "",
        countsForGrade: !!l.countsForGrade,
        availability: l.startDate || plan.OpenDate,
        duration: l.duration || "",
        startActivity: l.startActivity || "",
        devActivity: l.devActivity || "",
        endActivity: l.endActivity || "",
      }))] : lessons, SectionData: nextSections });
    }
  }

  function startCreateLesson() {
    setEditingLesson({
      id: `l_${Date.now()}`,
      title: "",
      dates: { wholeWeek: false, days: [] },
      selectedSections: {
        standards: false,
        expectations: false,
        strategy: false,
        objectives: false,
        units: false,
        transversals: false,
        startActivity: false,
        devActivity: false,
        endActivity: false,
      },
      standards: [],
      expectations: "",
      strategy: "",
      objectives: "",
      units: "",
      transversals: "",
      startActivity: "",
      devActivity: "",
      endActivity: "",
      countsForGrade: false,
    });
  }

  function startEditLesson(l) {
    setEditingLesson({
      ...l,
      selectedSections: l.selectedSections || {
        standards: !!l.standardCode || (l.standards && l.standards.length > 0),
        expectations: !!l.expectations,
        strategy: !!l.strategy,
        objectives: !!l.objective || !!l.objectives,
        units: !!l.units,
        transversals: !!l.transversals,
        startActivity: !!l.startActivity,
        devActivity: !!l.devActivity,
        endActivity: !!l.endActivity,
      },
      standards: l.standards || (l.standardCode ? [l.standardCode] : []),
      expectations: l.expectations || "",
      strategy: l.strategy || "",
      objectives: l.objectives || l.objective || "",
      units: l.units || "",
      transversals: l.transversals || "",
      startActivity: l.startActivity || "",
      devActivity: l.devActivity || "",
      endActivity: l.endActivity || "",
    });
  }

  function commitLesson(l) {
    const { start, end } = getEntryStartEndDates(l.dates, plan.OpenDate, plan.CloseDate);
    const formattedStart = formatTableDate(start);
    const formattedEnd = formatTableDate(end);
    const standardCode = (l.standards || []).join(", ");
    const nextLesson = {
      ...l,
      startDate: formattedStart,
      endDate: formattedEnd,
      standardCode,
      availability: formattedStart,
    };
    const nextLessons = lessons.some(x => String(x.id) === String(l.id))
      ? lessons.map(x => String(x.id) === String(l.id) ? nextLesson : x)
      : [...lessons, nextLesson];
    setLessons(nextLessons);
    savePlanChanges({ Lessons: nextLessons });
    setEditingLesson(null);
  }

  function ContentArea() {
    if (section === "cotejo") {
      return <PlanningPreviewArea plan={plan} lessons={lessons} sectionData={sectionData} previewLessonId={previewLessonId} setPreviewLessonId={setPreviewLessonId} />;
    }

    if (CREATABLE_SECTIONS[section]) {
      return (
        <CreatableSection
          cfg={CREATABLE_SECTIONS[section]}
          entries={Array.isArray(sectionData[section]) ? sectionData[section] : []}
          onUpsert={(entry) => upsertSectionEntry(section, entry)}
          onDelete={(id) => deleteSectionEntry(section, id)}
          aiContext={{ plan, sectionLabel: current?.label }}
          plan={plan}
          assignments={assignments}
        />
      );
    }

    if (section === "gl-lessons" || section === "fl-lessons") {
      if (editingLesson) {
        return (
          <LessonForm
            plan={plan}
            lesson={editingLesson}
            onChange={setEditingLesson}
            onCancel={() => setEditingLesson(null)}
            onSave={commitLesson}
          />
        );
      }
      return (
        <>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>Añada las lecciones que desea agregar a su planificación</p>
          <button className="pl btn-base btn-primary" style={{ marginBottom: 18 }} onClick={startCreateLesson}>⊕ Crear nueva</button>
          <table className="ppalTable">
            <thead>
              <tr>
                <th>Lecciones</th>
                <th>Fecha de inicio</th>
                <th>Fecha de fin</th>
                <th>Cuenta para nota</th>
                <th>Disponibilidad lección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!l.countsForGrade}
                      onChange={(e) => {
                        const next = lessons.map(x => x.id === l.id ? { ...x, countsForGrade: e.target.checked } : x);
                        setLessons(next);
                        savePlanChanges({ Lessons: next });
                      }}
                    />
                  </td>
                  <td>{l.availability}</td>
                  <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn btn-normal" style={{ padding: "5px 12px" }}>🗄 Presentar</button>
                    <button className="btn btn-normal" style={{ padding: "5px 12px" }} onClick={() => startEditLesson(l)}>✎ Ver/Editar</button>
                    <button className="pl btn-simple" style={{ color: "#e32f28", fontSize: 16 }} onClick={() => {
                      const next = lessons.filter(x => x.id !== l.id);
                      setLessons(next);
                      savePlanChanges({ Lessons: next });
                    }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lessons.length === 0 && <p style={{ textAlign: "center", color: "#bbb", fontSize: 13, padding: "20px 0" }}>No tiene ninguna lección agregada.</p>}
          <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
            <button className="pl btn-base btn-regular" style={{ padding: "5px 10px" }}>‹</button>
            <button className="pl btn-base btn-primary" style={{ padding: "5px 12px" }}>1</button>
            <button className="pl btn-base btn-regular" style={{ padding: "5px 10px" }}>›</button>
          </div>
        </>
      );
    }


    return (
      <>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>Complete el contenido para esta sección.</p>
        <textarea className="form-control" rows={8} placeholder={`Escriba aquí el contenido para "${current?.label}"…`} value={sectionData[section] || ""} onChange={e => setSectionData(p => ({ ...p, [section]: e.target.value }))} />
        <div className="Region-w-action" style={{ marginTop: 14 }}>
          <button className="pl btn-base btn-primary" onClick={() => savePlanChanges()}>Guardar</button>
          {saveStatus && <span style={{ marginLeft: 10, fontSize: 12, color: "#31665a" }}>{saveStatus}</span>}
        </div>
      </>
    );
  }

  return (
    <div className="wrapper-principal-container animated delay-05s fadeIn">
      <button className="btn-back" onClick={onBack} style={{ marginBottom: 14 }}>← Atrás</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
        <h1 className="heading-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {plan.PlanName} <span style={{ fontSize: 14, color: "#999", cursor: "pointer" }}>✎</span>
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setShowFullPlan(true)}
            style={{
              background: "linear-gradient(135deg, #6745EA, #4ba7a1)",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(103,69,234,.25)",
              fontFamily: "inherit",
            }}
          >
            ✨ Generar planificación con IA
          </button>
          <button className="pl btn-simple" style={{ fontSize: 13, fontWeight: 600, color: "#2a426d" }}>✎ Editar</button>
        </div>
      </div>

      <div style={{ background: "#e8f5f4", border: "1px solid #b8dedb", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#31665a", marginBottom: 16, display: "flex", gap: 8 }}>
        <span style={{ color: "#4ca7a2" }}>ⓘ</span>
        <span><strong>Nota:</strong> Los planes se cierran al llegar la fecha límite del período académico. Las tareas no completadas antes del cierre recibirán una calificación de cero. Después del cierre del plan, ni los maestros ni los estudiantes podrán acceder a él. Para consultar las puntuaciones, diríjase al área de entregables.</span>
      </div>

      <div style={{ fontSize: 14, color: "#33353d", marginBottom: 8, lineHeight: 1.7 }}>
        <strong>Plan semanal, Semana #{plan.WeekNumber || "209"} - Rango:</strong> {plan.OpenDate} - {plan.CloseDate} &nbsp;|&nbsp;
        <strong>Grupo de Estudiantes:</strong> {plan.GroupName} &nbsp;|&nbsp;
        <strong>Materia y grado:</strong> {plan.SubjectName} {plan.LevelCode}
      </div>
      <div style={{ fontSize: 14, color: "#33353d", marginBottom: 16, lineHeight: 1.7 }}>
        <strong>Período académico:</strong> {plan.PeriodLabel || "4: septiembre 05, 2023 - mayo 31, 2030"} &nbsp;|&nbsp;
        <strong>Año académico:</strong> {plan.AcademicYear || "agosto 29, 2023 - mayo 31, 2030"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#33353d", paddingBottom: 12, borderBottom: "1px solid var(--palette-gray-silver)", marginBottom: 18 }}>
        <span style={{ color: "#868686" }}>⏱</span>
        <span>Este plan cerrará en: <strong>{plan.ClosesOn || "mayo 31, 2030"}</strong></span>
      </div>

      <div className="containerPlanning">
        <div className="containerPlanning__sidebar">
          <nav className="sidebarMenu">
            {MOCK.cotejo.map(s => {
              if (s.type === "ppal")  return (
                <div key={s.key} className="sidebarMenu--group">
                  <div className="sidebarMenu--itemPpal" onClick={() => setSection("cotejo")}><span>⌄</span></div>
                  <div className={`sidebarMenu--item${section === "cotejo" ? " active" : ""}`} onClick={() => setSection("cotejo")}><a>{s.label}</a></div>
                </div>
              );
              if (s.type === "ppal")  return <div key={s.key} className="sidebarMenu--itemPpal" onClick={() => setSection("cotejo")}><span>⌄</span></div>;
              if (s.type === "title") return <div key={s.key} className="sidebarMenu--itemTitle">{s.label}</div>;
              return (
                <div key={s.key} className={`sidebarMenu--item${section === s.key ? " active" : ""}`} onClick={() => setSection(s.key)}>
                  <a>{s.label}{sectionData[s.key] && <span style={{ marginLeft: 6, color: "var(--palette-utility-greenLight)", fontSize: 10 }}>●</span>}</a>
                </div>
              );
            })}
          </nav>
        </div>
        <div className="containerPlanning__content">
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            <span style={{ color: "#f2af2b", fontWeight: 700 }}>{current?.group || "Planificación"}</span>
            <span style={{ color: "#999", margin: "0 6px" }}>/</span>
            <span style={{ color: "#555", fontWeight: 500 }}>{current?.label}</span>
          </div>
          <h2 className="heading-h2" style={{ marginBottom: 14 }}>{section === "cotejo" ? "Planificacion" : current?.label}</h2>
          <ContentArea />
          {section !== "cotejo" && <AIPanel mode="planning" sectionLabel={current?.label} onFill={handleAIFill} />}
        </div>
      </div>

      {showFullPlan && (
        <FullPlanGenerator
          plan={plan}
          onApply={applyFullPlan}
          onClose={() => setShowFullPlan(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL PLAN GENERATOR — Modal que genera todo el plan usando IA + contexto
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_LABELS = Object.fromEntries(MOCK.cotejo.map(s => [s.key, s.label]));

function FullPlanGenerator({ plan, onApply, onClose }) {
  const [form, setForm]       = useState({ unit: "", lessonsHint: "", weeks: 1, model: "anthropic/claude-haiku-4.5", schoolImprovementPlan: false });
  const [units, setUnits]     = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [status, setStatus]   = useState("idle");   // idle | generating | preview | error
  const [error, setError]     = useState("");
  const [result, setResult]   = useState(null);
  const [meta, setMeta]       = useState(null);
  const [selectedSections, setSelectedSections] = useState({}); // key → bool
  const [selectedLessons, setSelectedLessons]   = useState([]); // boolean per lesson index

  useEffect(() => {
    setLoadingUnits(true);
    fetch("/data/units.json")
      .then(res => res.ok ? res.json() : { units: [] })
      .then(json => {
        const subject = normalizeSubjectName(plan.SubjectName);
        const grade = normalizeGradeCode(plan.LevelCode);
        const filtered = (json.units || []).filter(u => {
          const unitSubject = normalizeSubjectName(u.subject);
          const unitGrade = normalizeGradeCode(u.grade);
          return unitSubject === subject && unitGrade === grade;
        });
        setUnits(filtered);
      })
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false));
  }, [plan.SubjectName, plan.LevelCode]);

  function handleUnitSelect(unitId) {
    setSelectedUnitId(unitId);
    const selected = units.find(u => u.id === unitId);
    if (!selected) return;
    const context = [
      `Unidad ${selected.code}: ${selected.title}`,
      selected.transferObjectives?.[0],
      selected.essentialQuestions?.length ? `Preguntas esenciales: ${selected.essentialQuestions.map(q => q.question).join("; ")}` : "",
      selected.acquisitionObjectives?.length ? `Destrezas: ${selected.acquisitionObjectives.join("; ")}` : "",
      selected.standards?.length ? `Estándares: ${selected.standards.map(s => `${s.code} - ${s.description}`).join("; ")}` : "",
    ].filter(Boolean).join("\n");
    setForm(p => ({ ...p, unit: context }));
  }

  async function generate() {
    if (!form.unit.trim()) return;
    setStatus("generating"); setError("");
    try {
      const r = await fetch("/api/generate-full-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: plan.SubjectName,
          grade:   plan.LevelCode,
          unit:    form.unit,
          lessonsHint: form.lessonsHint || undefined,
          weeks:   Number(form.weeks) || 1,
          dateFrom: plan.OpenDate,
          dateTo:   plan.CloseDate,
          model:   form.model,
          schoolImprovementPlan: !!form.schoolImprovementPlan,
          // Pass the teacher's JWT so the backend can hit Athenas live
          athenasToken: getAthenasToken() || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.plan) throw new Error(j.error || `HTTP ${r.status}`);
      setResult(j.plan);
      setMeta(j.meta);
      // Default: all sections + all lessons selected
      const sel = {};
      for (const k of Object.keys(j.plan.sections || {})) sel[k] = true;
      setSelectedSections(sel);
      setSelectedLessons((j.plan.lessons || []).map(() => true));
      setStatus("preview");
    } catch (e) {
      setStatus("error");
      setError(e.message || String(e));
    }
  }

  function applyAndClose() {
    const sections = {};
    for (const [k, v] of Object.entries(result?.sections || {})) {
      if (selectedSections[k]) sections[k] = v;
    }
    const lessons = (result?.lessons || []).filter((_, i) => selectedLessons[i]);
    onApply({ lessons, sections });
    onClose();
  }

  return (
    <div className="fpg-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fpg-modal">
        <header className="fpg-head">
          <div>
            <div className="fpg-eyebrow">✨ IA · Planificación completa</div>
            <h2>Generar planificación con IA</h2>
            <p>
              Usaremos los estándares DEPR de <strong>{plan.SubjectName} {plan.LevelCode}</strong>,
              las lecciones del catálogo, y planes reales del distrito como referencia para crear un cotejo completo.
            </p>
          </div>
          <button className="fpg-close" onClick={onClose}>×</button>
        </header>

        {status !== "preview" && (
          <div className="fpg-body">
            <div className="fpg-form">
              <label className="fpg-field">
                <span>Seleccionar unidad curricular</span>
                <select value={selectedUnitId} onChange={e => handleUnitSelect(e.target.value)} disabled={loadingUnits || !units.length}>
                  <option value="">{loadingUnits ? "Cargando unidades..." : units.length ? "Seleccionar unidad del mapa curricular" : "No hay unidades cargadas para esta materia/grado"}</option>
                  {units.map(u => <option key={u.id} value={u.id}>Unidad {u.code}: {u.title}</option>)}
                </select>
              </label>
              <label className="fpg-field">
                <span>Unidad o tema a trabajar *</span>
                <textarea
                  rows={4}
                  placeholder="Ej: Unidad 4 — Ecosistemas de Puerto Rico. Tipos de relieve, biodiversidad endémica, conservación del Yunque y bosque seco."
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                />
              </label>
              <label className="fpg-field">
                <span>Lecciones a incluir o priorizar (opcional)</span>
                <textarea
                  rows={3}
                  placeholder="Ej: Zonas climáticas, Cadena alimentaria, El bosque tropical."
                  value={form.lessonsHint}
                  onChange={e => setForm(p => ({ ...p, lessonsHint: e.target.value }))}
                />
              </label>
              <label className="fpg-check">
                <input
                  type="checkbox"
                  checked={!!form.schoolImprovementPlan}
                  onChange={e => setForm(p => ({ ...p, schoolImprovementPlan: e.target.checked }))}
                />
                <span>
                  <strong>La escuela está en plan de mejoramiento</strong>
                  Activar para que la IA complete las áreas de respuesta activa del estudiante y experiencia común.
                </span>
              </label>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label className="fpg-field" style={{ flex: "0 0 180px" }}>
                  <span>Semanas a cubrir</span>
                  <select value={form.weeks} onChange={e => setForm(p => ({ ...p, weeks: e.target.value }))}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "semana" : "semanas"}</option>)}
                  </select>
                </label>
                <label className="fpg-field" style={{ flex: "1 1 280px" }}>
                  <span>Modelo de IA</span>
                  <select value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}>
                    <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 — rápido (~40s)</option>
                    <option value="anthropic/claude-sonnet-4.5">Claude Sonnet 4.5 — mejor calidad (~90s)</option>
                    <option value="openai/gpt-4o">GPT-4o — alternativa</option>
                    <option value="openai/gpt-4o-mini">GPT-4o mini — más rápido</option>
                  </select>
                </label>
              </div>

              {status === "error" && <div className="fpg-error">Error: {error}</div>}

              <button
                className="fpg-generate"
                onClick={generate}
                disabled={!form.unit.trim() || status === "generating"}
              >
                {status === "generating" ? "Generando plan… (puede tardar 20–30s)" : "✨ Generar plan completo"}
              </button>
            </div>
          </div>
        )}

        {status === "preview" && result && (
          <div className="fpg-body">
            <div className="fpg-meta">
              <span>📚 {meta?.standardsUsed || 0} estándares</span>
              <span>·</span>
              <span>
                🎯 {meta?.athenasLessons || 0} lecciones
                {meta?.athenasSource === "live"
                  ? <span className="fpg-badge live"> 🟢 Athenas API live</span>
                  : <span className="fpg-badge cache"> ⚫ cache</span>}
              </span>
              <span>·</span>
              <span>📋 {meta?.hasFewshot ? "Con plan de referencia" : "Sin plan de referencia"}</span>
            </div>

            {result.lessons?.length > 0 && (
              <section className="fpg-section">
                <h3>Lecciones sugeridas ({result.lessons.length})</h3>
                {result.lessons.map((l, i) => (
                  <label key={i} className="fpg-lesson">
                    <input
                      type="checkbox"
                      checked={selectedLessons[i] || false}
                      onChange={e => setSelectedLessons(s => s.map((v, j) => j === i ? e.target.checked : v))}
                    />
                    <div>
                      <div className="fpg-lesson-title">{l.title}</div>
                      <div className="fpg-lesson-meta">
                        {l.standardCode && <span className="fpg-std">{l.standardCode}</span>}
                        {l.startDate && <span>{l.startDate} — {l.endDate}</span>}
                        {l.duration && <span>{l.duration}</span>}
                      </div>
                      {l.objective && <div className="fpg-lesson-obj">{l.objective}</div>}
                    </div>
                  </label>
                ))}
              </section>
            )}

            <section className="fpg-section">
              <h3>Secciones del cotejo ({Object.keys(result.sections || {}).length})</h3>
              {Object.entries(result.sections || {}).map(([key, content]) => (
                <details key={key} className="fpg-sec-item">
                  <summary>
                    <input
                      type="checkbox"
                      checked={!!selectedSections[key]}
                      onChange={e => setSelectedSections(s => ({ ...s, [key]: e.target.checked }))}
                      onClick={e => e.stopPropagation()}
                    />
                    <strong>{SECTION_LABELS[key] || key}</strong>
                  </summary>
                  <div className="fpg-sec-content">{content}</div>
                </details>
              ))}
            </section>

            <div className="fpg-actions">
              <button className="pl btn-base btn-regular" onClick={() => setStatus("idle")}>← Volver al form</button>
              <button className="fpg-generate" style={{ flex: 1 }} onClick={applyAndClose}>
                ⬇ Aplicar al plan ({Object.values(selectedSections).filter(Boolean).length} secciones, {selectedLessons.filter(Boolean).length} lecciones)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function PlanningModule() {
  const [view, setView] = useState("select");
  const [plan, setPlan] = useState(MOCK.plans[0]);
  const [plans, setPlans] = useState(MOCK.plans);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansSource, setPlansSource] = useState("supabase");
  const [assignments, setAssignments] = useState(MOCK.assignments);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsSource, setAssignmentsSource] = useState("supabase");

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    fetchSavedPlannings().then(({ plans: saved, source }) => {
      if (cancelled) return;
      setPlans(saved.length ? saved : MOCK.plans);
      setPlansSource(source);
      setPlansLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAssignmentsLoading(true);
    fetchSavedAssignments().then(({ assignments: saved, source }) => {
      if (cancelled) return;
      setAssignments(saved.length ? saved : MOCK.assignments);
      setAssignmentsSource(source);
      setAssignmentsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function upsertPlan(saved) {
    setPlan(saved);
    setPlans(prev => {
      const exists = prev.some(p => String(p.PlanId) === String(saved.PlanId));
      return exists ? prev.map(p => String(p.PlanId) === String(saved.PlanId) ? saved : p) : [saved, ...prev];
    });
  }

  function upsertAssignment(saved) {
    setAssignments(prev => {
      const exists = prev.some(a => String(a.Id) === String(saved.Id));
      return exists ? prev.map(a => String(a.Id) === String(saved.Id) ? saved : a) : [saved, ...prev];
    });
  }

  return (
    <>
      <style>{GENIAL_CSS}</style>
      {view === "select"             && <PlanningSelect onEnterAssignments={() => setView("assignment-list")} onEnterPlanning={() => setView("planning-list")} />}
      {view === "assignment-list"    && <AssignmentList assignments={assignments} loading={assignmentsLoading} source={assignmentsSource} onBack={() => setView("select")} onCreate={() => setView("assignment-manager")} />}
      {view === "assignment-manager" && <AssignmentManager onBack={() => setView("assignment-list")} onSaved={upsertAssignment} />}
      {view === "planning-list"      && <PlanningList plans={plans} loading={plansLoading} source={plansSource} onBack={() => setView("select")} onOpenTemplates={() => setView("weekly-templates")} onCreatePlan={() => setView("create-plan")} onOpenPlan={p => { setPlan(p); setView("plan-detail"); }} />}
      {view === "weekly-templates"   && <div className="wrapper-principal-container animated delay-05s fadeIn"><div className="double-border--principal"><button className="btn-back col-no-padding-left" onClick={() => setView("planning-list")}>← Atrás</button></div><WeeklyPlansTemplates /></div>}
      {view === "create-plan"        && <CreatePlan onBack={() => setView("planning-list")} onCreated={p => { upsertPlan(p); setView("plan-detail"); }} />}
      {view === "plan-detail" && plan && <PlanDetail plan={plan} assignments={assignments} onPlanSaved={upsertPlan} onBack={() => setView("planning-list")} />}
    </>
  );
}
