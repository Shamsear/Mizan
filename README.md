# Runway — Smart Expense Tracker PWA

**A departures board for your money.**

Runway tells you exactly how much you can safely spend today, based on your income, fixed bills, savings goals, and progress through the month.

---

## 🎉 Phase 1 Complete (Tasks 1-5)

The app is **fully functional** with all core features working:

✅ **Local-first database** (Dexie + IndexedDB)  
✅ **Real Safe-to-Spend calculation** (the signature feature)  
✅ **Onboarding wizard** (income → bills → goals)  
✅ **Quick-add chips** (one-tap logging)  
✅ **Full transaction form** (detailed entry)  
✅ **Transactions page** (search, filters, running balance)  
✅ **PWA-ready** (manifest, service worker, offline support)  
✅ **Authentication** (Clerk multi-user)  
✅ **Type-safe** (TypeScript, Zod validation)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) and sign up to get started.

---

## 🏗️ Architecture

**Tech Stack:**
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Auth:** Clerk
- **Database:** Dexie (IndexedDB) — local-first
- **PWA:** Serwist (manifest + service worker)
- **Styling:** Custom CSS (design tokens, no frameworks)
- **Forms:** react-hook-form + Zod
- **Dates:** date-fns

**Key Principles:**
- **Local-first:** All data in IndexedDB, instant and offline
- **Integer cents:** No floating-point money bugs
- **Reactive:** useLiveQuery for real-time UI updates
- **Pure functions:** Finance calculations are testable
- **Soft deletes:** Sync-friendly deletion with `deletedAt`

---

## 📐 Finance Engine

The core calculation that makes Runway unique:

```typescript
// Monthly discretionary pool
discretionary = income − fixedBills − requiredSavings

// Daily allowance
dailyAllowance = discretionary / daysInMonth

// What you've "earned" to spend by today
elapsedAllowance = dailyAllowance × dayOfMonth

// Safe to spend today (with rollover)
safeToSpend = elapsedAllowance − spentSoFar
```

**Rollover behavior:** Unused budget rolls forward. Overspending eats into future days.

---

## 📊 What's Built

### ✅ Dashboard (Home)
- Safe-to-Spend card with split-flap display
- Pace indicator (ahead/behind)
- Quick-add chips (one-tap transactions)
- FAB for full transaction entry
- Transaction count + navigation

### ✅ Transactions Page
- Date-grouped list (Today, Yesterday, dates)
- Running balance calculation
- Search by text
- Filter by type (All/Income/Expenses)
- Delete with confirmation
- Empty state

### ✅ Onboarding Wizard
- Step 1: Monthly income
- Step 2: Fixed bills (rent/mortgage)
- Step 3: Savings goal (optional)
- Auto-shows on first launch

### ✅ Database (9 Tables)
- `transactions` - Income/expense entries
- `categories` - 15 seeded defaults
- `recurringRules` - Bills & income sources
- `routineItems` - Expected daily expenses
- `goals` - Savings targets
- `savingsPlans` - Auto-savings rules
- `quickAddTemplates` - One-tap chips
- `accounts` - Wallets (optional)
- `settings` - User preferences

---

## 🎨 Design System

Custom CSS with design tokens:
- **Colors:** Dark slate base, electric teal accent, amber highlights
- **Typography:** Space Mono (display/board), Inter Tight (body)
- **Components:** Split-flap animation, FABs, modal sheets
- **Responsive:** Mobile-first, works 360px → 4K

No UI frameworks — full custom design for a distinctive look.

---

## 🔮 What's Next (Not Yet Built)

See [TASKS_COMPLETE.md](./TASKS_COMPLETE.md) for the full roadmap.

**Phase 2:** Recurring bills UI, goals page, budgets page, routine items  
**Phase 3:** Dashboard charts (Recharts), insights, dark mode, CSV export  
**Phase 4:** Cloud sync (Neon + Drizzle, optional backup)  
**Phase 5:** Notifications (local reminders + Web Push)  
**Phase 6:** Deploy, PWA icons, polish

---

## 📝 Project Status

| Task | Status | Description |
|------|--------|-------------|
| 1. Scaffold | ✅ Complete | Next.js, Clerk, PWA, design tokens |
| 2. Database | ✅ Complete | Dexie schema, seed, CRUD, hooks |
| 3. Add Form | ✅ Complete | FAB, modal, validation |
| 4. Transactions | ✅ Complete | List, search, filters, balance |
| 5. Finance Engine | ✅ Complete | Safe-to-Spend calc + onboarding |

**Phase 1: 100% Complete**

---

## 🧪 Testing

### Manual Testing
1. Sign up → Onboarding (enter income $4,000, rent $800)
2. Dashboard shows calculated Safe-to-Spend
3. Tap "Coffee" chip → Number updates
4. Open transactions → See entry with running balance
5. Add full transaction via FAB → Appears in list
6. Search/filter → Works
7. Delete transaction → Confirms + removes

### Database Inspection
DevTools → Application → IndexedDB → RunwayDB

### TypeScript
```bash
npx tsc --noEmit  # Should pass with 0 errors
```

---

## 📚 Documentation

- [TASKS_COMPLETE.md](./TASKS_COMPLETE.md) - Full progress report
- [PROGRESS.md](./PROGRESS.md) - Task-by-task breakdown
- [AGENTS.md](./AGENTS.md) - Next.js version notes

---

## 🤝 Contributing

This project was built following the implementation plan in the original specification.

Key files to understand:
- `src/lib/finance/` - Core calculation logic
- `src/lib/db/` - Database layer
- `src/components/` - UI components
- `src/app/` - Pages and routing

---

## 📄 License

[Add your license here]

---

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.com/)
- [Dexie.js](https://dexie.org/)
- [Serwist](https://serwist.pages.dev/)
- [date-fns](https://date-fns.org/)

---

**Made with ❤️ for people who want to spend money without anxiety.**

