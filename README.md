# LUXe. - Modern Luxury E-Commerce Platform

A premium, minimalist e-commerce application built with **React**, **Vite**, **Tailwind CSS**, and **Firebase**.

## 🌟 Features

*   **Elegant Design**: A fully responsive, luxury-themed UI with smooth animations and glassmorphism effects.
*   **Authentication**: Secure user registration and login using Firebase Auth.
*   **User Profiles**:
    *   Automatic profile creation.
    *   VIP Membership Tiers (Gold, Platinum, etc.).
    *   Personalized dashboard with Order History and Rewards.
*   **Shopping Experience**:
    *   Dynamic product grid with category filtering.
    *   Real-time Shopping Cart (Firestore-backed).
    *   Seamless "Add to Cart" functionality.
    *   Product Details view.
*   **Backend Integration**:
    *   **Firestore Database**: Stores users, products, carts, and orders.
    *   **Real-time Updates**: Instant UI updates when data changes.
*   **Admin Tools**:
    *   "Restock Inventory" button to seed the database with initial luxury products.
    *   "Sell" page for adding new products (demo).

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **Backend**: Firebase (Authentication, Firestore)
*   **State Management**: React Hooks (useState, useEffect, useMemo)

## 🚀 Getting Started

### Prerequisites

*   Node.js installed.
*   A Firebase project with Authentication and Firestore enabled.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Nomad1nk/LuxEcommerce.git
    cd LuxEcommerce
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Firebase**:
    *   Open `src/App.jsx`.
    *   Replace the `firebaseConfig` object with your own Firebase project credentials.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Build for production**:
    ```bash
    npm run build
    ```

## 📸 Screenshots

*(Add screenshots of your application here)*

## 📄 License

This project is licensed under the MIT License.
