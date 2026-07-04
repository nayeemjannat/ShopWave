# ShopWave — PROJECT STATE (Single Source of Truth)

> ⚠️ যেকোনো AI agent (Copilot, GPT, Claude, Cursor, যেকোনো কিছু) কাজ শুরু করার
> আগে এই পুরো file টা প্রথমে পড়বে। এটা না পড়ে কোনো কোড লেখা শুরু করা যাবে না।
>
> কাজ শেষে এই file টা **নিজেই আপডেট** করতে হবে (নিচে নিয়ম দেওয়া আছে) — পরের
> agent/session যাতে exact বুঝতে পারে কী হয়েছে।

Last updated by: GPT
Last updated at: 2026-06-16

---

## 1. এই ফাইলটার উদ্দেশ্য

এই প্রজেক্টে একাধিক AI agent ভিন্ন সময়ে কাজ করছে (Copilot, GPT, Claude
ইত্যাদি)। প্রতিটা agent এর কোনো memory নেই আগের session এর — তাই duplicate
ফাইল তৈরি হওয়া, একই কাজ দু'বার ভিন্নভাবে করা, বা conflicting logic বসানোর
ঝুঁকি থাকে। এই ফাইলটাই সেই গ্যাপ পূরণ করে — এটা প্রজেক্টের "মেমোরি"।

**নিয়ম: কোনো agent যদি এই file না পড়ে সরাসরি কোড লিখতে শুরু করে, ধরে নিতে হবে
সে duplicate/conflicting কাজ করবে। তাই এটা পড়া বাধ্যতামূলক, optional নয়।**

---

## 2. Reference Documents (এই Project Folder এ আছে)

| Document | কী আছে এতে |
|---|---|
| `ShopWave_PRD_v2.docx` | Business logic, features, DB schema, API design |
| `ShopWave_Build_Workflow.docx` | কোন file কী কাজ করে + Section 6 এ exact #1–#25 task order |
| `ShopWave_Frontend_UISpec.docx` | প্রতিটা page/component এর exact UI spec, color, spacing, animation, performance rules |

কাজ শুরুর আগে relevant section পড়ে নিতে হবে। নিজের মতো ডিজাইন/architecture
decision নেওয়া নিষেধ যদি এই docs এ স্পষ্ট স্পেক দেওয়া থাকে।

---

## 3. CURRENT STATUS — Task Tracker

> এই table টাই সবচেয়ে গুরুত্বপূর্ণ অংশ। Status কলাম আপডেট করো প্রতিটা
> task শেষে। নিচে "Status Legend" দেখো।

**Status Legend:**
- `DONE — VERIFIED` → কাজ শেষ, টেস্ট করা হয়েছে, manually approved
- `DONE — UNVERIFIED` → Agent কাজ শেষ করেছে দাবি করছে কিন্তু human এখনো চেক করেনি
- `IN PROGRESS` → এখন কেউ এই task এ আছে
- `IN PROGRESS` → এখনো ছোঁয়া হয়নি
- `BLOCKED` → কোনো কারণে আটকে আছে (Notes কলামে কারণ লিখো)

| # | Task | File(s) | Status | Notes / Assumptions Taken |
|---|------|---------|--------|---------------------------|
| 0 | Delete duplicate `*Routes.js` files | `server/routes/` | DONE — VERIFIED | 7টা duplicate file delete হয়েছে |
| 1 | `.env` configure | `server/.env` | DONE — VERIFIED | Configured with placeholder values. |
| 2 | Run seed script | `npm run seed` | DONE — VERIFIED | Seed script executed; admin already existed. |
| 3 | Backend endpoint test (Postman, Section 4) | All routes | DONE — VERIFIED | Health endpoint OK; admin login succeeded. |
| 4 | CSS theme engine | `client/src/styles/index.css` | DONE — VERIFIED | |
| 5 | Navbar | `components/common/Navbar.jsx` | DONE — VERIFIED | |
| 6 | ProductCard + SkeletonCard + Toast | `components/common/` | DONE — VERIFIED | |
| 7 | Auth pages | `pages/Auth/` | DONE — VERIFIED | |
| 8 | HomePage | `pages/Customer/HomePage.jsx` | DONE — VERIFIED | |
| 9 | ShopPage | `pages/Customer/ShopPage.jsx` | DONE — VERIFIED | |
| 10 | ProductDetailPage | `pages/Customer/ProductDetailPage.jsx` | DONE — VERIFIED | |
| 11 | CartPage | `pages/Customer/CartPage.jsx` | DONE — VERIFIED | |
| 12 | CheckoutPage | `pages/Customer/CheckoutPage.jsx` | DONE — VERIFIED | |
| 13 | Order pages (History/Detail/Success/Failure) | `pages/Customer/` | DONE — VERIFIED | |
| 14 | Wishlist + Profile + Comparison pages | `pages/Customer/` | DONE — VERIFIED | Comparison implemented with localStorage |
| 15 | ElectronicsLayout | `layouts/storeLayouts/` | DONE — VERIFIED | |
| 16 | Other 5 store layouts | `layouts/storeLayouts/` | DONE — VERIFIED | |
| 17 | AdminLayout sidebar | `components/admin/AdminLayout.jsx` | DONE — VERIFIED | Responsive sidebar + top bar + Outlet |
| 18 | DashboardPage | `pages/Admin/DashboardPage.jsx` | DONE — VERIFIED | Metric cards, Recharts line/pie, top products, orders |
| 19 | ProductsPage + ProductFormPage | `pages/Admin/` | DONE — VERIFIED | Product grid with CRUD, search, form with all fields |
| 20 | OrdersPage | `pages/Admin/OrdersPage.jsx` | DONE — VERIFIED | Admin order list with status filter + update + cancel |
| 21 | StoreConfigPage | `pages/Admin/StoreConfigPage.jsx` | DONE — VERIFIED | Theme editor with live preview, modules, social, save |
| 22 | CouponsPage + ReviewsPage + UsersPage | `pages/Admin/` | DONE — VERIFIED | Coupons CRUD, review approve/reject, user ban/role |
| 23 | PaymentConfigPage | `pages/Admin/PaymentConfigPage.jsx` | DONE — VERIFIED | SSLCommerz + COD config UI with save |

> Task নম্বর Build_Workflow.docx এর Section 6 এর সাথে মিলে যায়।

---

## 4. CURRENTLY ACTIVE TASK

> এই section টা সবচেয়ে গুরুত্বপূর্ণ — নতুন agent এখানে দেখবে ঠিক কোথা
> থেকে শুরু করতে হবে।

**Active task number:** None
**Status:** NONE
**No active tasks currently.**





---

## 5. HARD RULES — সব Agent কে মানতে হবে

এই rules গুলো কোনো agent override করতে পারবে না, প্রজেক্ট pattern যত
ভিন্নই মনে হোক:

1. **একসাথে একাধিক টাস্কে কাজ করা অনুমোদিত।** Section 3 এর টেবিলে `IN PROGRESS` অথবা `IN PROGRESS` থাকা যেকোনো টাস্ক শুরু করা যেতে পারে, এবং এক টাস্কের কাজ করার সময় একই সাথে অন্য টাস্কেও কাজ করা যাবে।
2. **কোনো নতুন file বানানোর আগে চেক করো ওই file ইতিমধ্যে আছে কিনা।**
   যদি থাকে — সেটা edit করো, নতুন duplicate (যেমন `Navbar2.jsx`,
   `NavbarNew.jsx`, `Navbar_v2.jsx`) বানাবে না।
3. **নতুন library/package install করার আগে check করো `package.json`
   এ already আছে কিনা।** Build_Workflow.docx Section 8 এ "Key npm
   packages" তালিকা দেখো — এর বাইরে কিছু লাগলে শুধু তখনই install করো।
4. **UISpec.docx এর exact spec অনুসরণ করো** — রং, spacing, animation
   নিজের পছন্দমতো বদলাবে না।
5. **কাজ শেষে অবশ্যই self-test করো** (browser/Postman দিয়ে) তারপর
   Section 3 table এ status আপডেট করো। Test না করে `DONE — VERIFIED`
   লেখা নিষেধ — সেটা শুধু human approve করার পর লেখা হবে।
6. **কাজ শেষে Section 4 (Currently Active Task) আপডেট করো** পরিষ্কারভাবে,
   পরের agent (তুমিই হও বা অন্য কেউ) যাতে confuse না হয়।
7. **Human explicitly না বললে এক task এর বেশি এগিয়ে যাবে না।** কাজ শেষ
   করে থেমে যাও, রিপোর্ট দাও।

---

## 6. Agent Switch হলে কী করতে হবে (Human এর জন্য নোট)

Agent বদলানোর সময় (Copilot → GPT, GPT → Claude, ইত্যাদি) নতুন agent কে
শুধু একটাই কথা বলতে হবে:

> "এই project এর root এ `PROJECT_STATE.md` file আছে। সেটা পড়ো, Section 4
> (Currently Active Task) থেকে বুঝে নাও ঠিক কোথায় কাজ আছে, এবং সেখান থেকেই
> continue করো। আগের কোনো instruction history নেই, এই file ই একমাত্র সত্য।"

এতে নতুন agent থেকে আবার পুরো প্রজেক্ট audit করানোর দরকার পড়বে না — token
খরচ বাঁচবে, duplicate কাজও হবে না।
