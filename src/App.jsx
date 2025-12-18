import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  ArrowRight,
  Star,
  Plus,
  Trash2,
  User,
  LogOut,
  Package,
  CreditCard,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
  Award,
  Gift,
  ChevronRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  updateDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

/**
 * FIREBASE CONFIGURATION & INITIALIZATION
 */
/**
 * FIREBASE CONFIGURATION & INITIALIZATION
 */
const firebaseConfig = {
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
// Connect to the specific database "luxe-store" instead of "(default)"
const db = getFirestore(app, 'luxe-store');
const appId = 'luxe-store-main';

/**
 * HELPER: Format Currency
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// --- ISOLATED COMPONENTS (Defined outside App to prevent re-renders) ---

const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
      <p className="text-gray-500 font-medium tracking-wide">LOADING LUXE</p>
    </div>
  </div>
);

const InfoPage = ({ title, content }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">{title}</h1>
    <div className="prose prose-lg text-gray-600 whitespace-pre-wrap">
      {content}
    </div>
  </div>
);

const Navbar = ({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  cartCount,
  userProfile,
  setIsCartOpen,
  setIsProfileOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center sm:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setView('home')}>
            <span className="font-serif text-2xl font-bold tracking-tighter text-gray-900">LUXE.</span>
          </div>
          <div className="hidden sm:flex space-x-8">
            <button onClick={() => setView('home')} className={`${view === 'home' ? 'text-gray-900' : 'text-gray-500'} hover:text-gray-900 transition-colors`}>Shop</button>
            <button onClick={() => setView('sell')} className={`${view === 'sell' ? 'text-gray-900' : 'text-gray-500'} hover:text-gray-900 transition-colors`}>Sell</button>
            <button onClick={() => setView('stories')} className={`${view === 'stories' ? 'text-gray-900' : 'text-gray-500'} hover:text-gray-900 transition-colors`}>Stories</button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-100 rounded-full py-1.5 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-40 transition-all focus:w-60"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 0 && view !== 'home') {
                    setView('home');
                  }
                }}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button onClick={() => setIsCartOpen(true)} className="relative p-1 text-gray-600 hover:text-gray-900">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <div
              onClick={() => setIsProfileOpen(true)}
              className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors relative overflow-hidden"
              title={userProfile ? userProfile.name : "Guest"}
            >
              {userProfile ? (
                <div className="bg-black text-white w-full h-full flex items-center justify-center text-xs font-bold">
                  {userProfile.name.charAt(0)}
                </div>
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProfileSidebar = ({
  isProfileOpen,
  setIsProfileOpen,
  userProfile,
  handleLogout,
  handleRegister,
  handleLogin,
  setView
}) => {
  const [authTab, setAuthTab] = useState('register');

  return (
    <div className={`fixed inset-0 overflow-hidden z-50 ${isProfileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isProfileOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setIsProfileOpen(false)}
      />
      <div className={`fixed inset-y-0 right-0 max-w-md w-full flex transition-transform duration-500 transform ${isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col bg-white shadow-2xl w-full">
          {/* Header */}
          <div className="px-8 py-8 flex justify-between items-center bg-white">
            <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
              {userProfile ? `Hello, ${userProfile.name.split(' ')[0]}` : 'Welcome'}
            </h2>
            <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-black transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {userProfile ? (
              <div className="space-y-10">
                {/* VIP Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white shadow-2xl p-8 transform transition-transform hover:scale-[1.02] duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Award className="w-40 h-40 -mr-10 -mt-10" />
                  </div>
                  <div className="relative z-10 flex flex-col h-48 justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-2">Membership</p>
                        <h3 className="text-3xl font-serif italic text-yellow-500 flex items-center gap-2">
                          {userProfile.memberTier} <Shield className="w-6 h-6" />
                        </h3>
                      </div>
                      <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <span className="font-serif font-bold text-xl">{userProfile.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium tracking-wide text-lg">{userProfile.name}</p>
                      <p className="text-sm text-gray-400 font-mono mt-1">{userProfile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="space-y-4">
                  <button onClick={() => { setView('orders'); setIsProfileOpen(false); }} className="group w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-full group-hover:bg-gray-800 transition-colors">
                        <Package className="w-5 h-5 text-gray-900 group-hover:text-white" />
                      </div>
                      <span className="font-medium text-lg">Order History</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                  </button>

                  <button onClick={() => { setView('rewards'); setIsProfileOpen(false); }} className="group w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-full group-hover:bg-gray-800 transition-colors">
                        <Gift className="w-5 h-5 text-gray-900 group-hover:text-white" />
                      </div>
                      <span className="font-medium text-lg">Rewards & Offers</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                  </button>
                </div>

                <button onClick={handleLogout} className="w-full py-4 border border-gray-200 rounded-xl text-gray-500 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex mb-10 bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={() => setAuthTab('login')} className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${authTab === 'login' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-900'}`}>Sign In</button>
                  <button onClick={() => setAuthTab('register')} className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${authTab === 'register' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-900'}`}>Register</button>
                </div>

                {authTab === 'login' ? (
                  <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                      <input type="email" name="email" className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all rounded-t-lg" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
                      <input type="password" name="password" className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all rounded-t-lg" placeholder="••••••••" />
                    </div>
                    <button className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-900 transform hover:-translate-y-1 transition-all shadow-xl mt-4">
                      SIGN IN
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-4 cursor-pointer hover:text-black transition-colors">Forgot your password?</p>
                  </form>
                ) : (
                  <form className="space-y-6" onSubmit={handleRegister}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                      <input type="text" name="name" className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all rounded-t-lg" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                      <input type="email" name="email" className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all rounded-t-lg" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
                      <input type="password" name="password" className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all rounded-t-lg" placeholder="••••••••" />
                    </div>
                    <button className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-900 transform hover:-translate-y-1 transition-all shadow-xl mt-4">
                      JOIN THE CLUB
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CartSidebar = ({ isCartOpen, setIsCartOpen, cart, cartTotal, updateQuantity, removeFromCart, setView }) => (
  <div className={`fixed inset-0 overflow-hidden z-50 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    <div className={`absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsCartOpen(false)} />
    <div className={`fixed inset-y-0 right-0 max-w-md w-full flex transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col bg-white shadow-xl">
        <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-medium text-gray-900 font-serif">Shopping Cart</h2>
            <div className="ml-3 h-7 flex items-center">
              <button onClick={() => setIsCartOpen(false)} className="-m-2 p-2 text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="mt-8">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Your cart is empty.</p>
                <button onClick={() => setIsCartOpen(false)} className="mt-4 text-black font-medium hover:underline">Continue Shopping</button>
              </div>
            ) : (
              <div className="flow-root">
                <ul role="list" className="-my-6 divide-y divide-gray-200">
                  {cart.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-center object-cover" />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center border rounded-md">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600">-</button>
                            <span className="px-2 font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600">+</button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 py-6 px-4 sm:px-6 bg-gray-50">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p>{formatPrice(cartTotal)}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <button
              onClick={() => {
                setView('checkout');
                setIsCartOpen(false);
              }}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Hero = () => (
  <div className="relative bg-gray-900 text-white overflow-hidden">
    <div className="absolute inset-0">
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80" alt="Hero" className="w-full h-full object-cover opacity-60" />
    </div>
    <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-serif mb-6">Elevate Your Everyday.</h1>
      <p className="mt-6 text-xl text-gray-300 max-w-3xl">Curated essentials for the modern minimalist. Quality that speaks for itself.</p>
      <div className="mt-10">
        <button onClick={() => document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 transition-all duration-300 hover:scale-105">
          Shop Collection <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const ProductGrid = ({ products, filteredProducts, categories, categoryFilter, setCategoryFilter, addToCart, setSelectedProduct, setView, seedDatabase }) => (
  <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
      <h2 className="text-2xl font-bold text-gray-900 font-serif">New Arrivals</h2>
      <div className="flex gap-2 mt-4 md:mt-0 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
      {filteredProducts.map((product) => (
        <div key={product.id} className="group relative flex flex-col">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8 cursor-pointer relative" onClick={() => { setSelectedProduct(product); setView('product'); }}>
            <img src={product.image} alt={product.name} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300 h-64 lg:h-80 w-full" />
            <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:bg-gray-900 hover:text-white z-10">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex justify-between flex-1">
            <div>
              <h3 className="text-sm text-gray-700"><span aria-hidden="true" className="absolute inset-0" />{product.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{product.category}</p>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</p>
          </div>
        </div>
      ))}
    </div>
    {filteredProducts.length === 0 && (
      <div className="text-center py-20">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="text-gray-500">Try adjusting your filters or search.</p>
        {categoryFilter !== 'All' && (
          <button onClick={() => setCategoryFilter('All')} className="mt-4 text-sm font-medium text-black underline">Clear Filters</button>
        )}
        <div className="mt-8">
          <button onClick={() => seedDatabase()} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
            <RefreshCw className="mr-2 h-4 w-4" />
            Restock Inventory
          </button>
        </div>
      </div>
    )}
  </div>
);

const ProductDetail = ({ selectedProduct, setView, addToCart }) => {
  if (!selectedProduct) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <button onClick={() => setView('home')} className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to shopping
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="rounded-2xl overflow-hidden bg-gray-100">
          <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover object-center" />
        </div>
        <div className="flex flex-col h-full justify-center">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">{selectedProduct.category}</h2>
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{selectedProduct.name}</h1>
            <div className="flex items-center mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="ml-2 text-gray-500 text-sm">({selectedProduct.rating} Stars)</span>
            </div>
            <p className="text-3xl font-medium text-gray-900">{formatPrice(selectedProduct.price)}</p>
          </div>
          <div className="prose prose-sm text-gray-500 mb-8">
            <p>{selectedProduct.description}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <button onClick={() => addToCart(selectedProduct)} className="w-full bg-gray-900 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Add to Cart
          </button>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Package className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Free Shipping</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">2 Year Warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SellPage = ({ handleAddProduct, resetDatabase }) => (
  <div className="max-w-2xl mx-auto px-4 py-16">
    <div className="text-center mb-10">
      <h1 className="text-3xl font-serif font-bold text-gray-900">List a Product</h1>
      <p className="mt-2 text-gray-600">Add new inventory to the Luxe collection.</p>
    </div>
    <form onSubmit={handleAddProduct} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-3 px-4 shadow-sm focus:border-black focus:ring-black sm:text-sm" placeholder="e.g. Midnight Silk Scarf" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
            <input name="price" type="number" step="0.01" required className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-3 px-4 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select name="category" className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-3 px-4 shadow-sm focus:border-black focus:ring-black sm:text-sm">
              <option>Fashion</option>
              <option>Electronics</option>
              <option>Home</option>
              <option>Accessories</option>
              <option>Furniture</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input name="image" type="url" className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-3 px-4 shadow-sm focus:border-black focus:ring-black sm:text-sm" placeholder="https://..." />
          <p className="mt-1 text-xs text-gray-500">Leave empty for a random Unsplash image.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" rows={4} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-3 px-4 shadow-sm focus:border-black focus:ring-black sm:text-sm" placeholder="Describe the item..." />
        </div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors">
          List Item
        </button>
      </div>
    </form>
    <div className="mt-12 pt-8 border-t border-gray-200 text-center">
      <p className="text-gray-400 text-sm mb-4">Don't see all the items? Force a restock.</p>
      <button onClick={() => { resetDatabase(); alert('Resetting inventory... This may take a few seconds.'); }} className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors">
        <RefreshCw className="w-4 h-4 mr-2" /> Reset & Restock Inventory
      </button>
    </div>
  </div>
);

const CheckoutPage = ({ setView, handleCheckout, cartTotal, cart }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <button onClick={() => setView('home')} className="mb-8 flex items-center text-gray-500 hover:text-gray-900">
      <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back
    </button>
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">Shipping Information</h2>
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">ZIP</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black bg-gray-50 py-3 px-4" />
            </div>
          </div>
          <div className="pt-8">
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Payment</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                <span className="font-medium">Credit Card</span>
              </div>
              <input type="text" placeholder="Card number" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black mb-4 py-2 px-3" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM / YY" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black py-2 px-3" />
                <input type="text" placeholder="CVC" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black py-2 px-3" />
              </div>
            </div>
          </div>
          <button type="button" onClick={handleCheckout} className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg mt-6">
            Pay {formatPrice(cartTotal)}
          </button>
        </form>
      </div>
      <div className="mt-12 lg:mt-0">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Order Summary</h2>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={item.id} className="py-4 flex">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.name}</h3>
                      <p className="ml-4">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-sm font-medium text-gray-900">{formatPrice(cartTotal)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Shipping</p>
              <p className="text-sm font-medium text-gray-900">Free</p>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <p className="text-base font-medium text-gray-900">Total</p>
              <p className="text-base font-bold text-gray-900">{formatPrice(cartTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * COMPONENT: Stories Page
 */
const StoriesPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-12 text-center">Luxe Stories</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="group cursor-pointer">
        <div className="overflow-hidden rounded-2xl mb-6">
          <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80" alt="Fashion" className="w-full h-80 object-cover transform group-hover:scale-105 transition-transform duration-500" />
        </div>
        <p className="text-sm font-medium text-gray-500 mb-2">STYLE • 5 MIN READ</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">The Art of Minimalist Living</h2>
        <p className="text-gray-600">Discover how decluttering your space can lead to a clearer mind and a more focused life.</p>
      </div>
      <div className="group cursor-pointer">
        <div className="overflow-hidden rounded-2xl mb-6">
          <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80" alt="Design" className="w-full h-80 object-cover transform group-hover:scale-105 transition-transform duration-500" />
        </div>
        <p className="text-sm font-medium text-gray-500 mb-2">DESIGN • 4 MIN READ</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">Sustainable Luxury: A New Era</h2>
        <p className="text-gray-600">How premium brands are embracing eco-friendly materials without compromising on quality.</p>
      </div>
    </div>
  </div>
);

/**
 * COMPONENT: Order History Page
 */
const OrderHistoryPage = ({ orders }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Order History</h1>
    {orders.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
        <p className="text-gray-500">Start shopping to see your orders here.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order Placed</p>
                <p className="font-medium text-gray-900">{order.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-2.5 w-2.5 rounded-full ${order.status === 'Processing' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">{order.status}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <li key={index} className="py-3 flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

/**
 * COMPONENT: Rewards Page
 */
const RewardsPage = ({ userProfile }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-white mb-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10"><Award className="w-64 h-64" /></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-serif font-bold mb-2">Luxe Rewards</h1>
        <p className="text-gray-400 mb-8">Exclusive benefits for our most valued members.</p>
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Current Tier</p>
            <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">{userProfile?.memberTier || 'Guest'} <Shield className="w-5 h-5" /></p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Points Balance</p>
            <p className="text-2xl font-bold">1,250</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
        </div>
        <p className="text-sm text-gray-400">750 points to Platinum Tier</p>
      </div>
    </div>

    <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Offers</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded">20% OFF</div>
          <Gift className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="font-bold text-lg mb-2">Birthday Special</h3>
        <p className="text-gray-500 text-sm mb-4">Valid on your birthday month for any single item.</p>
        <button className="w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200">Claim Offer</button>
      </div>
      <div className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded">FREE SHIP</div>
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="font-bold text-lg mb-2">Premium Shipping</h3>
        <p className="text-gray-500 text-sm mb-4">Free next-day delivery on your next order.</p>
        <button className="w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200">Claim Offer</button>
      </div>
    </div>
  </div>
);

/**
 * COMPONENT: App (Main)
 */
export default function App() {
  // State: User & Auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null); // { name, email, memberTier }

  // State: Data
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // State: UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [view, setView] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- EFFECT: Authentication ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser ? `User ${currentUser.uid} (${currentUser.isAnonymous ? 'Anon' : 'Registered'})` : 'No User');
      if (!currentUser) {
        console.log("No user, attempting Anonymous Auth...");
        // If no user is signed in, sign in anonymously to allow guest access
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed", error);
          // If anonymous auth fails (e.g. not enabled in console), stop loading so user can at least see the login screen
          setAuthLoading(false);
        });
      } else {
        setUser(currentUser);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- EFFECT: Fetch User Profile ---
  // --- EFFECT: Fetch User Profile ---
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile');
    console.log("Listening to Profile:", profileRef.path);
    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        console.log("Profile loaded:", docSnap.data());
        setUserProfile(docSnap.data());
      } else {
        console.log("No profile found for user, creating default...");
        // Auto-create profile if missing (e.g. if registration failed to save data)
        const defaultProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'Guest',
          email: user.email || 'guest@example.com',
          memberTier: 'Gold',
          joinedAt: serverTimestamp()
        };
        // Only create if not anonymous (or handle anonymous profile creation if desired)
        if (!user.isAnonymous) {
          await setDoc(profileRef, defaultProfile);
        } else {
          setUserProfile(null);
        }
      }
    }, (error) => console.error("Profile Listener Error:", error));
    return () => unsubscribe();
  }, [user]);

  // --- EFFECT: Fetch Products (Real-time) ---
  useEffect(() => {
    // Allow fetching products even if not logged in
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    console.log("Listening to Products:", productsRef.path);
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      if (items.length === 0) console.log("No products found, seeding needed.");
    }, (error) => console.error("Products Listener Error:", error));
    return () => unsubscribe();
  }, []); // Products are public, no dependency on user

  // --- EFFECT: Fetch Cart ---
  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }
    const cartRef = collection(db, 'artifacts', appId, 'users', user.uid, 'cart');
    console.log("Listening to Cart:", cartRef.path, "for User:", user.uid);
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCart(items);
    }, (error) => console.error("Cart Listener Error:", error));
    return () => unsubscribe();
  }, [user]);

  // --- EFFECT: Fetch Orders ---
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const ordersRef = collection(db, 'artifacts', appId, 'users', user.uid, 'orders');
    console.log("Listening to Orders:", ordersRef.path, "for User:", user.uid);
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date desc
      items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setOrders(items);
    }, (error) => console.error("Orders Listener Error:", error));
    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS: Database Seeding ---
  const seedDatabase = async (ref) => {
    const targetRef = ref || collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const initialProducts = [
      // Fashion
      { name: "Midnight Velvet Tuxedo", price: 1250.00, category: "Fashion", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80", description: "Tailored perfection for evening elegance. Italian velvet.", rating: 4.9 },
      { name: "Cashmere Trench Coat", price: 895.00, category: "Fashion", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=80", description: "Pure cashmere blend. A winter essential.", rating: 4.8 },
      { name: "Silk Slip Dress", price: 320.00, category: "Fashion", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80", description: "100% Mulberry silk in champagne gold.", rating: 4.7 },

      // Accessories
      { name: "Obsidian Chronograph", price: 4500.00, category: "Accessories", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=80", description: "Swiss automatic movement. Sapphire crystal glass.", rating: 5.0 },
      { name: "Heritage Leather Weekender", price: 650.00, category: "Accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80", description: "Full-grain vegetable tanned leather. Ages beautifully.", rating: 4.8 },
      { name: "Tortoiseshell Sunglasses", price: 240.00, category: "Accessories", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80", description: "Handcrafted acetate frames. Polarized lenses.", rating: 4.6 },

      // Electronics
      { name: "Audiophile Turntable", price: 899.00, category: "Electronics", image: "https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&w=1000&q=80", description: "Solid walnut base with carbon fiber tonearm.", rating: 4.9 },
      { name: "Lumina Noise-Cancel Headphones", price: 350.00, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80", description: "Studio-grade sound isolation and clarity.", rating: 4.7 },
      { name: "Leica-Style Rangefinder", price: 2400.00, category: "Electronics", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80", description: "For the purist photographer. Full frame sensor.", rating: 5.0 },

      // Home
      { name: "Japanese Ceramic Tea Set", price: 180.00, category: "Home", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1000&q=80", description: "Hand-thrown pottery. Wabi-sabi aesthetic.", rating: 4.8 },
      { name: "Santal & Amber Candle", price: 65.00, category: "Home", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=80", description: "Hand-poured soy wax. 60-hour burn time.", rating: 4.5 },
      { name: "Egyptian Cotton Bedding", price: 420.00, category: "Home", image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1000&q=80", description: "800 thread count satin weave. Cloud-like comfort.", rating: 4.9 },

      // Furniture
      { name: "Mid-Century Lounge Chair", price: 1450.00, category: "Furniture", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=80", description: "Aniline leather and walnut plywood shell.", rating: 4.9 },
      { name: "Marble Side Table", price: 350.00, category: "Furniture", image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1000&q=80", description: "Solid Carrara marble top with brass legs.", rating: 4.6 },

      // Beauty
      { name: "Rejuvenating Night Serum", price: 125.00, category: "Beauty", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80", description: "With rare botanical extracts and hyaluronic acid.", rating: 4.8 },
      { name: "Signature Eau de Parfum", price: 180.00, category: "Beauty", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80", description: "Notes of oud, bergamot, and spiced leather.", rating: 4.7 }
    ];
    try {
      // Execute writes sequentially to avoid overwhelming the Firestore SDK client
      for (const p of initialProducts) {
        await addDoc(targetRef, { ...p, createdAt: serverTimestamp() });
      }
      alert("Inventory restocked successfully!");
    } catch (error) {
      console.error("Error seeding database:", error);
      alert(`Failed to restock inventory: ${error.message}`);
    }
  };

  const resetDatabase = async () => {
    try {
      const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const snapshot = await getDocs(productsRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      await seedDatabase(productsRef);
      alert("Database reset and seeded successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error resetting database:", error);
      alert(`Failed to reset database: ${error.message}`);
    }
  };

  // --- ACTIONS: Cart & Auth ---
  const addToCart = async (product) => {
    if (!user) {
      alert("Please Sign In or Register to add items to your cart.");
      setIsProfileOpen(true);
      return;
    }
    setIsCartOpen(true);
    try {
      console.log("Adding to cart:", product.name);
      const existingItem = cart.find(item => item.productId === product.id);
      const cartRef = collection(db, 'artifacts', appId, 'users', user.uid, 'cart');
      if (existingItem) {
        console.log("Updating quantity for:", existingItem.id);
        await updateDoc(doc(cartRef, existingItem.id), { quantity: increment(1) });
      } else {
        console.log("Creating new cart item");
        await addDoc(cartRef, { productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
      }
      console.log("Item added successfully");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(`Failed to add item: ${error.message}`);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cart', itemId));
  };

  const updateQuantity = async (itemId, delta) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    if (item.quantity + delta <= 0) { removeFromCart(itemId); return; }
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cart', itemId), { quantity: increment(delta) });
  };

  const clearCart = async () => { cart.forEach(item => removeFromCart(item.id)); };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      category: formData.get('category'),
      description: formData.get('description'),
      image: formData.get('image') || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80",
      rating: 5.0,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), newProduct);
    setView('home');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create profile document
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'profile'), {
        name,
        email,
        memberTier: 'Gold',
        joinedAt: serverTimestamp()
      });
      alert(`Welcome to Luxe, ${name}! You are now a Gold Member.`);
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      console.log("Attempting login with:", email); // Debugging
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the state update
      setIsProfileOpen(false); // Close sidebar on success
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/invalid-credential') {
        alert("Incorrect email or password. Please try again.");
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const orderData = {
        items: cart,
        total: cartTotal,
        status: 'Processing',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), orderData);
      await clearCart();
      alert('Order Placed Successfully!');
      setView('orders');
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileOpen(false);
    setUserProfile(null);
    window.location.reload();
  };

  // --- COMPUTED VALUES ---
  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [products, searchQuery, categoryFilter]);
  const categories = ['All', ...new Set(products.map(p => p.category))];

  if (authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      <Navbar
        view={view}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartCount}
        userProfile={userProfile}
        setIsCartOpen={setIsCartOpen}
        setIsProfileOpen={setIsProfileOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <CartSidebar
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cart={cart}
        cartTotal={cartTotal}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        setView={setView}
      />

      <ProfileSidebar
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        userProfile={userProfile}
        handleLogout={handleLogout}
        handleRegister={handleRegister}
        handleLogin={handleLogin}
        setView={setView}
      />

      <main className="min-h-[calc(100vh-64px)] pb-12">
        {view === 'home' && (
          <>
            <Hero />
            <ProductGrid
              products={products}
              filteredProducts={filteredProducts}
              categories={categories}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              addToCart={addToCart}
              setSelectedProduct={setSelectedProduct}
              setView={setView}
              seedDatabase={seedDatabase}
            />
          </>
        )}

        {view === 'product' && (
          <ProductDetail
            selectedProduct={selectedProduct}
            setView={setView}
            addToCart={addToCart}
          />
        )}

        {view === 'sell' && (
          <SellPage
            handleAddProduct={handleAddProduct}
            resetDatabase={resetDatabase}
          />
        )}

        {view === 'stories' && <StoriesPage />}

        {view === 'orders' && <OrderHistoryPage orders={orders} />}

        {view === 'rewards' && <RewardsPage userProfile={userProfile} />}

        {view === 'checkout' && (
          <CheckoutPage
            setView={setView}
            handleCheckout={handleCheckout}
            cartTotal={cartTotal}
            cart={cart}
          />
        )}


        {view === 'shipping' && (
          <InfoPage
            title="Shipping & Returns"
            content={`
SHIPPING POLICY

We offer complimentary worldwide shipping on all orders over $500. For orders under $500, a flat rate of $25 applies.

- Domestic (US): 2-3 business days via FedEx Priority.
- International: 3-5 business days via DHL Express.

All shipments are fully insured and require a signature upon delivery. You will receive a tracking number via email once your order has been dispatched.

RETURN POLICY

We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in their original condition with all tags attached.

To initiate a return, please contact our concierge team. Refunds are processed within 5-7 business days of receiving your return.
            `}
          />
        )}

        {view === 'warranty' && (
          <InfoPage
            title="Warranty & Care"
            content={`
OUR PROMISE

Every Luxe product is crafted with the highest attention to detail and quality. We stand behind our craftsmanship.

WARRANTY COVERAGE

All products come with a comprehensive 2-year international warranty that covers:
- Manufacturing defects in materials and workmanship.
- Hardware failure (zippers, clasps, buckles).
- Stitching issues.

This warranty does not cover:
- Normal wear and tear.
- Damage caused by misuse, accidents, or improper care.
- Water damage (unless the item is explicitly waterproof).

CARE INSTRUCTIONS

To ensure your luxury items last a lifetime, we recommend:
- Storing leather goods in the provided dust bag.
- Avoiding prolonged exposure to direct sunlight and humidity.
- Professional cleaning only for delicate fabrics.
            `}
          />
        )}

        {view === 'faq' && (
          <InfoPage
            title="Frequently Asked Questions"
            content={`
ORDERING

Q: How do I track my order?
A: Once your order ships, you will receive a tracking number via email. You can also track your order status in the "Order History" section of your profile.

Q: Can I modify or cancel my order?
A: We process orders quickly. Please contact us within 1 hour of placing your order if you need to make changes.

PAYMENT

Q: What payment methods do you accept?
A: We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and Apple Pay.

Q: Is my payment information secure?
A: Yes, we use industry-standard SSL encryption to protect your data. We do not store your credit card information.

PRODUCTS

Q: Are your products authentic?
A: Absolutely. We guarantee the authenticity of every item we sell. We source directly from designers and authorized distributors.
            `}
          />
        )}

        {view === 'contact' && (
          <InfoPage
            title="Contact Us"
            content={`
WE'RE HERE TO HELP

Our dedicated concierge team is available 24/7 to assist you with any inquiries.

CONTACT CHANNELS

- Email: concierge@luxe.com
- Phone: +1 (800) 555-0199 (Toll-free)
- WhatsApp: +1 (555) 012-3456

HEADQUARTERS

Luxe E-Commerce
123 Fashion Avenue, Suite 500
New York, NY 10012
USA

PRESS INQUIRIES

For press and collaboration inquiries, please email press@luxe.com.
            `}
          />
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">LUXE.</h3>
            <p className="text-gray-500 text-sm">Redefining modern e-commerce with simplicity and elegance. Designed for those who appreciate the finer details.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><button onClick={() => setView('shipping')} className="hover:text-black transition-colors">Shipping & Returns</button></li>
              <li><button onClick={() => setView('warranty')} className="hover:text-black transition-colors">Warranty</button></li>
              <li><button onClick={() => setView('faq')} className="hover:text-black transition-colors">FAQ</button></li>
              <li><button onClick={() => setView('contact')} className="hover:text-black transition-colors">Contact Us</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Enter your email" className="bg-white border border-gray-300 rounded-md px-4 py-2 w-full text-sm" />
              <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          © 2025 Lux E-Commerce. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
