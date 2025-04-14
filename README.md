# Finance App Frontend

A modern and responsive web application built with Next.js and TypeScript for managing personal finances.

## 🚀 Features

- **Dashboard Overview**: View your current balance and transaction history
- **Transaction Management**: Add, edit, and delete financial transactions
- **Responsive Design**: Beautiful UI that works on desktop and mobile
- **Real-time Updates**: Instant feedback on financial changes
- **Type Safety**: Built with TypeScript for better development experience
- **Error Handling**: Graceful error handling and user feedback
- **API Integration**: Seamless integration with the backend API

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
├── components/     # Reusable React components
│   ├── forms/      # Form components
│   ├── layout/     # Layout components
│   └── ui/         # UI components
├── services/       # API services
├── styles/         # CSS modules
└── types/          # TypeScript types
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

## 🎯 Usage

### Dashboard

The dashboard provides an overview of your finances:
- Current balance
- Quick actions for adding income or expenses
- Transaction history with filtering options
- Edit or delete existing transactions

### Adding Transactions

1. Click the "Add Income" or "Add Expense" button
2. Fill in the transaction details:
   - Amount
   - Category
   - Description (optional)
3. Click "Save" to add the transaction

### Managing Transactions

- **Edit**: Click the edit icon (✏️) on any transaction
- **Delete**: Click the delete icon (🗑️) to remove a transaction
- **View History**: Scroll through your transaction history
- **Filter**: (Coming soon) Filter transactions by date or category

## 🧪 Testing

```bash
npm test
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔄 State Management

- React's built-in hooks for local state
- Custom hooks for API integration
- TypeScript for type-safe state management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
