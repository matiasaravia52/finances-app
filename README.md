# Finance App Frontend

A modern and responsive web application built with Next.js and TypeScript for managing personal finances.

## 🚀 Features

- **Dashboard Overview**: View your current balance and transaction history at a glance
- **Transaction Management**: Add, edit, and delete financial transactions with ease
- **Advanced Filtering**: Filter transactions by period, type, and category
- **Smart Categorization**: Categories dynamically filtered based on transaction type
- **Transaction Pagination**: Navigate through transactions with intuitive pagination controls
- **Customizable Display**: Adjust the number of transactions displayed per page
- **Currency Formatting**: Beautiful currency formatting with proper thousand separators
- **Responsive Design**: Beautiful UI that works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant feedback on financial changes
- **Type Safety**: Built with TypeScript for better development experience
- **Error Handling**: Graceful error handling and user feedback
- **API Integration**: Seamless integration with the backend API
- **Authentication**: Secure user authentication and protected routes

## 🛠️ Tech Stack

- Next.js 14
- TypeScript
- React
- CSS Modules
- Fetch API

## 📁 Project Structure

```
src/
├── app/            # App router pages and layouts
│   ├── dashboard/   # Dashboard page
│   ├── login/       # Login page
│   ├── register/    # Registration page
│   └── layout.tsx   # Root layout
├── components/     # Reusable React components
│   ├── forms/      # Form components
│   │   ├── LoginForm.tsx      # Login form
│   │   ├── RegisterForm.tsx   # Registration form
│   │   └── TransactionForm.tsx # Transaction form
│   ├── layout/     # Layout components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   └── ProtectedRoute.tsx # Auth protection
│   └── ui/         # UI components
│       ├── Button.tsx         # Button component
│       ├── Modal.tsx          # Modal component
│       ├── PeriodSelector.tsx  # Period selector
│       └── TransactionFilters.tsx # Transaction filters
├── contexts/       # React contexts
│   └── AuthContext.tsx # Authentication context
├── services/       # API services
│   ├── api.ts      # API service
│   └── auth.ts     # Authentication service
├── styles/         # CSS modules
│   ├── Dashboard.module.css    # Dashboard styles
│   ├── TransactionForm.module.css # Form styles
│   └── TransactionFilters.module.css # Filters styles
├── types/          # TypeScript types
│   ├── api.ts      # API types
│   ├── auth.ts     # Authentication types
│   └── transaction.ts # Transaction types
└── utils/          # Utility functions
    ├── dateFormatter.ts # Date formatting utilities
    ├── numberFormatter.ts # Number formatting utilities
    └── transactionFilters.ts # Filter utilities
```

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/finances-app.git
cd finances-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
pnpm dev
# or
bunpm run dev
```

The app will be available at `http://localhost:3000`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 💬 Usage

### Dashboard

The dashboard provides an overview of your financial situation:

- **Balance Cards**: View your current balance and monthly/yearly summaries with proper currency formatting
- **Transaction List**: See all your transactions with advanced filtering options and pagination
- **Quick Actions**: Add new income or expenses quickly

### Adding Transactions

1. Click the "Add Income" or "Add Expense" button
2. Fill in the transaction details:
   - Amount (automatically formatted as currency)
   - Category (dynamically loaded based on transaction type)
   - Description (optional)
3. Click "Add" to save the transaction

### Filtering Transactions

Use the filter options to narrow down your transaction list:

- **Period**: Filter by time period (All, Current Month, Last Month, Current Year)
- **Type**: Filter by transaction type (All, Income, Expense)
- **Category**: Filter by specific categories (dynamically filtered based on selected type)

### Pagination

Navigate through your transactions with ease:

- Use the pagination controls to move between pages
- Adjust the number of transactions displayed per page (5, 10, 20, or 50)
- See the total number of transactions and current page information

## 🧪 Testing

```bash
npm test
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 👨‍💻 Developer Notes

### State Management

This application uses React's built-in state management with hooks:

- `useState` for component-level state
- `useEffect` for side effects and API calls
- `useContext` for global state (authentication)

### Formatting Utilities

The application includes several utility functions for consistent formatting:

- `numberFormatter.ts`: Formats numbers as currency with proper thousand separators
- `dateFormatter.ts`: Formats dates in a user-friendly way, including relative time

### Dynamic Categories

Categories in the filter dropdown are dynamically loaded based on the selected transaction type:

- When "Income" is selected, only income categories are shown
- When "Expense" is selected, only expense categories are shown
- When "All" is selected, all categories are shown

### Pagination Implementation

The pagination system includes:

- Server-side pagination for better performance
- Customizable items per page
- Page navigation controls
- Current page indicator

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
