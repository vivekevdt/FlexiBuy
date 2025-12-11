# 🛒 Next.js + Supabase E-Commerce Platform

A modern, fully responsive E-Commerce Web Application built using Next.js (App Router), Supabase, Tailwind CSS, localForage, and shadcn/ui. Includes authentication, protected routes, product filtering, cart persistence, checkout flow, and complete order history.


## 🚀 Features

### 🔐 Authentication (Supabase Auth)
- **Email & Password Login / Signup**
- **Real-time auth state sync**
- **Protected routes** (Checkout, Orders)
- **Auto session recovery** on refresh

### 🛍 Product System
- **Product listing with pagination**
- **Filtering** by min price, max price, and category
- **Fully responsive product grid**
- **Category chip** displayed on each product
- **Clean UI** with shadcn components

### 🛒 Persistent Cart (Local + Cloud Sync)
- **Add, update, and remove items**
- **Cart persists** even after refresh
- **Syncs to Supabase** when logged in
- **Clears automatically** on logout
- **Cart badge** shown in header
- Uses **React Context** for global state

### 📦 Checkout & Orders
- **Checkout page** with shipping details
- **Saves order** to Supabase orders table
- **Clears cart** after successful checkout
- **Orders page** displays complete order history
- **Expandable order details** (items + shipping)

### 💅 Modern, Responsive UI
- **Mobile-friendly navigation** (hamburger)
- **Desktop categories bar** + conditional navbar
- **Sticky sidebar filters** on desktop
- **Collapsible filters** on mobile
- **Smooth layout & spacing** with Tailwind

## 🧱 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 (App Router) | Frontend, routing, SSR/CSR |
| Supabase | Auth, Database, Storage |
| Tailwind CSS | Styling |
| shadcn/ui | Reusable UI components |
| localForage | Offline cart persistence |
| React Context | Cart state management |
| PostgreSQL | Products, Carts & Orders |


