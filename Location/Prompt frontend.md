Create a scalable, production-ready frontend for a Rental Management ERP.

Tech Stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Clean architecture
- Modular and scalable folder structure

Design Style:
- Modern professional dashboard
- Minimalistic
- Soft neutral colors
- Clean spacing
- Responsive (desktop-first but mobile compatible)

Main Layout:
- Left sidebar navigation
- Top header with user profile + notifications
- Main content area dynamic
- Collapsible sidebar

Modules to implement:

1) Dashboard
- KPI cards:
  - Total Properties
  - Active Contracts
  - Monthly Revenue
  - Outstanding Payments
- Revenue vs Expenses chart
- Recent Payments table

2) Properties Module
- Table view
- Filters (status, type)
- Status badges:
  - Available
  - Rented
  - Maintenance
- Add/Edit Property modal form

3) Clients Module
- Client list table
- Search bar
- Client detail page
- Linked contracts section

4) Contracts Module
- Contract list
- Status badge:
  - Active
  - Terminated
  - Cancelled
- Contract detail page
- Payment history section

5) Payments Module
- Payments table
- Status badge:
  - Paid
  - Partial
  - Late
- Filters by month
- Add payment modal

6) Expenses Module
- Expenses table
- Category filter
- Monthly summary card

7) Financial Analytics
- ROI card
- Occupancy rate card
- Cashflow chart
- Monthly projection chart

Architecture Requirements:
- Use reusable components
- Separate UI components from business logic
- Create services folder for API calls (mocked for now)
- Prepare structure for REST API integration
- Use proper TypeScript types
- Use loading states and empty states
- Use consistent status badge components

Folder Structure:

/app
/components
/features
/services
/types
/hooks
/utils

Create mock data for all modules.

Make it easy to connect later to a Django REST API backend.

Ensure the design is clean and scalable for future SaaS expansion.

Do not create unnecessary complexity.
Focus on maintainability and scalability.