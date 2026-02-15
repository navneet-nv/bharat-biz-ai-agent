'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileText, CreditCard, Users, BarChart3, Settings, LogOut, Bell, Plus, Minus, Search, Trash2, Send, Mic, Download, ShoppingBag, ListChecks, TrendingUp, TrendingDown, Sparkles, Citrus, Utensils, GlassWater, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({ totalRevenue: 0, totalInvoices: 0, pendingPayments: 0, totalCustomers: 0 });
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_phone: '',
    items: [{ description: '', quantity: 1, price: 0, productId: null, gstRate: 18 }]
  });
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ item: '', amount: '', category: 'Stock' });

  // Default Fruit & Juice Shop Products
  const defaultProducts = [
    { id: 1, name: 'Mosambi Juice (Fresh)', stock: 50, price: 60, category: 'Juice', minStock: 20 },
    { id: 2, name: 'Orange Juice', stock: 40, price: 80, category: 'Juice', minStock: 15 },
    { id: 3, name: 'Mixed Fruit Shake', stock: 25, price: 100, category: 'Shake', minStock: 10 },
    { id: 4, name: 'Kashmiri Apple (1kg)', stock: 100, price: 180, category: 'Fruit', minStock: 30 },
    { id: 5, name: 'Banana (Dozen)', stock: 50, price: 60, category: 'Fruit', minStock: 20 },
    { id: 6, name: 'Coconut Water', stock: 30, price: 50, category: 'Beverage', minStock: 10 },
  ];

  useEffect(() => {
    // Initialize with some demo data if empty
    if (products.length === 0) {
      setProducts(defaultProducts);
    }
  }, []);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: 0, stock: 0, category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    fetchData(storedToken);
  }, []);

  const fetchData = async (authToken) => {
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      // Fetch stats
      const statsRes = await fetch('/api/dashboard/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch recent invoices
      const invoicesRes = await fetch('/api/invoices?limit=5', { headers });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      // Fetch expenses
      const expensesRes = await fetch('/api/expenses', { headers });
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAllInvoices = async () => {
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = field === 'description' ? value : Number(value);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceForm.items.reduce((sum, item) => {
      const base = item.quantity * item.price;
      const gst = base * (item.gstRate / 100);
      return sum + base + gst;
    }, 0);
  };

  const handleSaveProduct = async () => {
    // 1. Prepare Data
    const newProduct = {
      ...productForm,
      id: selectedProduct ? selectedProduct.id : `PROD-${Date.now()}`,
      userId: user.id
    };

    // 2. Optimistic Update
    const previousProducts = [...products];
    if (selectedProduct) {
      setProducts(products.map(p => p.id === newProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }

    setShowProductModal(false);
    toast.success(selectedProduct ? 'Product updated! (Syncing...)' : 'Product added! (Syncing...)');

    try {
      // 3. Actual API Call
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct) // Send the prepared data
      });

      if (res.ok) {
        toast.success('Product synced successfully!');
        fetchProducts(); // Refresh to get real IDs/data
      } else {
        throw new Error('Failed to save product');
      }
    } catch (e) {
      // 4. Rollback
      console.error('Save product failed:', e);
      toast.error('Sync failed. Reverting changes.');
      setProducts(previousProducts);
    }
  };

  const createInvoice = async () => {
    // 1. Calculate & Prepare Data
    const total = calculateTotal();
    const newInvoice = {
      id: `INV-${Date.now()}`, // Temporary ID
      userId: user.id,
      customer_name: invoiceForm.customer_name,
      customer_phone: invoiceForm.customer_phone,
      items: invoiceForm.items,
      amount: total,
      status: 'pending',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // 2. Optimistic Update (Immediate UI Refresh)
    const previousInvoices = [...invoices];
    const previousStats = { ...stats };

    setInvoices([newInvoice, ...invoices]);
    setStats({
      ...stats,
      totalRevenue: stats.totalRevenue + total,
      totalInvoices: stats.totalInvoices + 1,
      pendingPayments: stats.pendingPayments + 1
    });

    setShowInvoiceModal(false);
    toast.success('Invoice created! (Syncing...)');

    // 3. Reset Form immediately
    setInvoiceForm({
      customer_name: '',
      customer_phone: '',
      items: [{ description: '', quantity: 1, price: 0, productId: null }]
    });

    try {
      // 4. Actual API Call
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...invoiceForm,
          amount: total
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Invoice synced successfully!');
        // Optional: Replace temp ID with real one if needed, but for list view it's fine
        // Ideally, we'd swap the temp invoice with data.invoice
        fetchData(token);
      } else {
        throw new Error('Failed to sync');
      }
    } catch (error) {
      // 5. Rollback on Error
      console.error('Invoice creation failed:', error);
      toast.error('Sync failed. Reverting changes.');
      setInvoices(previousInvoices);
      setStats(previousStats);
    }
  };

  const sendReminder = async (invoiceId) => {
    try {
      const res = await fetch(`/api/payments/${invoiceId}/remind`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (error) {
      toast.error('Error sending reminder');
    }
  };

  const speakText = async (text) => {
    try {
      if (!text) return;

      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      } else {
        // Fallback to Browser TTS if API fails/missing keys
        console.warn("API TTS Failed, falling back to Browser TTS");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN'; // Hint for Hinglish/Hindi
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("TTS Network Error, falling back to Browser TTS:", e);
      // Fallback on Network Error
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAIChat = async (directMessage = null) => {
    // Regex logic removed to use Backend Agent
    const messageToSend = typeof directMessage === 'string' ? directMessage : aiMessage;
    if (!messageToSend?.trim()) return;

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageToSend, language: 'hinglish' })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
        if (data.message) speakText(data.message); // Speak AI response
        if (data.actionResult) {
          fetchData(token);
        }
      } else {
        // Fallback simulation if API fails
        const fallback = "Sahi hai! I've noted that down boss.";
        setAiResponse({ message: fallback });
        speakText(fallback);
      }
    } catch (error) {
      // Fallback simulation
      const errorMsg = "Connection issue, but I'm listening.";
      setAiResponse({ message: errorMsg });
      speakText(errorMsg);
    }
  };

  const addExpense = () => {
    if (!expenseForm.item || !expenseForm.amount) return;
    setExpenses([...expenses, { ...expenseForm, id: Date.now(), date: new Date() }]);
    setExpenseForm({ item: '', amount: '', category: 'Fruits' });
    toast.success('Kharcha added!');
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      toast.info('Analyzing image... 🔍');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        const res = await fetch('/api/ocr/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Image })
        });

        if (res.ok) {
          const data = await res.json();
          const extracted = typeof data === 'string' ? JSON.parse(data) : data;

          setAiResponse({
            message: `Extracted Details from ${extracted.type || 'bill'}:`,
            extractedData: extracted
          });
          toast.success('Extraction complete!');
        } else {
          toast.error('OCR failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Error uploading image');
    }
  };

  // Browser Native Speech Recognition Setup
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechConstant = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechConstant();
      recognitionInstance.continuous = false; // Stop automatically after speech ends
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'hi-IN'; // Optimized for Hinglish/Hindi

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice Result:', transcript);
        setAiMessage(transcript);
        toast.success('Generated: ' + transcript);
        handleAIChat(transcript); // Auto-send to AI
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone blocked. Check browser settings.');
        } else {
          toast.error('Voice input failed: ' + event.error);
        }
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startRecording = async () => {
    // 1. Try Browser Native STT First (Faster, Free, Reliable)
    if (recognition) {
      try {
        recognition.start();
        setIsRecording(true);
        toast.info('🎤 Boliyiye... (Listening via Browser)');
        return;
      } catch (e) {
        console.warn('Browser STT start failed, falling back to Server API', e);
      }
    }

    // 2. Fallback to Server Whisper API (if browser support missing or failed)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('🎤 Recording... Speak in Hindi, Hinglish, or English (Server Mode)');
    } catch (error) {
      toast.error('Microphone access denied');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAiMessage(data.text);
        toast.success('✅ Transcription complete!');

        // Auto-submit to Agent
        setTimeout(() => handleAIChat(data.text), 500);
      } else {
        toast.error('Transcription failed');
      }
    } catch (error) {
      toast.error('Failed to transcribe audio');
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'invoices' && token) {
      fetchAllInvoices();
    } else if (currentPage === 'customers' && token) {
      fetchCustomers();
    } else if (currentPage === 'inventory' && token) {
      fetchProducts();
    } else if (currentPage === 'analytics' && token) {
      fetchAnalytics();
    }
  }, [currentPage, token]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Billing Counter', icon: LayoutDashboard },
    { id: 'market', label: 'Market Visit (Kharcha)', icon: ShoppingBag },
    { id: 'invoices', label: 'Bills & Udhaar', icon: FileText },
    { id: 'inventory', label: 'Stock (Maal)', icon: ListChecks },
    { id: 'customers', label: 'Grahak List', icon: Users },
    { id: 'analytics', label: 'Hisab Kitab', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-68 glass border-r hidden md:block relative z-10 shadow-xl shadow-blue-500/5">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Citrus size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-orange-600">Fresh Fruits</h1>
          </div>
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest px-1">Juice & Shake POS</p>
        </div>

        <nav className="px-4 space-y-1.5">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-stone-600 hover:bg-orange-50 hover:shadow-md hover:text-orange-600'
                  }`}
              >
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-4 right-4">
          <Button
            onClick={() => setShowAIChat(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 shadow-xl active:scale-95 transition-all text-sm font-semibold"
          >
            <Mic className="mr-2" size={18} />
            Speak to Agent
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="glass border-b px-8 py-5 z-20">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-slate-800">Namaste, {user?.name}! 👋</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-auto text-blue-600 bg-blue-50 border-blue-200">
                  {user?.businessName}
                </Badge>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500 font-medium">Shop ID: BB-{user?.id?.slice(-4) || '8821'}</span>
              </div>
            </motion.div>

            <div className="flex items-center gap-5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl relative shadow-sm transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </motion.button>

              <div className="h-8 w-[1px] bg-slate-200 mx-1" />

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-rose-500 hover:bg-rose-50 rounded-xl font-semibold"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {currentPage === 'dashboard' && (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
              {/* LEFT: Product Grid */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Search & Categories */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <Input
                      placeholder="Search items..."
                      className="pl-10 h-11 bg-white border-none shadow-sm rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {['All', 'Juice', 'Shake', 'Fruit'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-white text-slate-600 hover:bg-orange-50 border border-transparent'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products
                      .filter(p => activeCategory === 'All' || p.category === activeCategory)
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(product => (
                        <motion.div
                          key={product.id}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ y: -4 }}
                          onClick={() => {
                            const existing = invoiceForm.items.find(i => i.productId === product.id);
                            if (existing) {
                              // Increment if exists
                              const idx = invoiceForm.items.indexOf(existing);
                              updateInvoiceItem(idx, 'quantity', existing.quantity + 1);
                              toast.success(`Checking ${product.name} quantity: ${existing.quantity + 1}`);
                            } else {
                              // Add new
                              setInvoiceForm({
                                ...invoiceForm,
                                items: [...invoiceForm.items, {
                                  description: product.name,
                                  quantity: 1,
                                  price: product.price,
                                  productId: product.id,
                                  gstRate: 18 // Default
                                }]
                              });
                            }
                          }}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:border-orange-200 hover:shadow-orange-100 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-2 right-2">
                            <Badge className={`${product.stock < product.minStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} hover:bg-white`}>
                              {product.stock} left
                            </Badge>
                          </div>
                          <div className="mb-3 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            {product.category === 'Juice' ? <GlassWater size={24} /> : product.category === 'Shake' ? <Citrus size={24} /> : <Utensils size={24} />}
                          </div>
                          <h3 className="font-bold text-slate-800 leading-tight mb-1">{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <p className="text-orange-600 font-extrabold">₹{product.price}</p>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                              <Plus size={16} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Current Bill */}
              <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="text-orange-500" size={20} />
                    Current Bill
                  </h3>
                  <Badge variant="outline" className="bg-white">
                    {invoiceForm.items.length} items
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {invoiceForm.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                      <ShoppingBag size={48} />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    invoiceForm.items.map((item, idx) => (
                      <motion.div
                        layout
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl group relative"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800">{item.description || 'Unknown Item'}</p>
                          <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                        </div>
                        <div className="font-bold text-slate-700">
                          ₹{item.price * item.quantity}
                        </div>

                        <div className="flex items-center gap-2 absolute right-2 top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-lg p-1">
                          <button
                            onClick={() => updateInvoiceItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            onClick={() => removeInvoiceItem(idx)}
                            className="p-1 hover:bg-red-50 rounded text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => updateInvoiceItem(idx, 'quantity', item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="p-5 bg-slate-50 border-t border-slate-100">
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>GST (18%)</span>
                      <span>Included</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-slate-800 mt-2 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Customer Name"
                      value={invoiceForm.customer_name}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                      className="bg-white"
                    />
                    <Button
                      disabled={invoiceForm.items.length === 0}
                      onClick={createInvoice}
                      className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-xl text-lg font-bold shadow-lg shadow-slate-900/20"
                    >
                      Checkout
                    </Button>
                    <Button
                      onClick={() => setShowAIChat(true)}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-4 shadow-lg active:scale-95 transition-all font-semibold"
                    >
                      <Mic className="mr-2" size={18} />
                      Ask AI Assistant
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'market' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shopping List Generator */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <ListChecks />
                      Market List (Kal ki Tayari)
                    </CardTitle>
                    <p className="text-sm text-yellow-700">Calculated based on low stock & daily average</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {products.filter(p => (p.stock || 0) < (p.minStock || 10)).map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 bg-white rounded border border-yellow-100">
                          <span className="font-medium text-gray-700">{p.name}</span>
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            Buy {Math.max(5, (p.minStock || 10) - (p.stock || 0))} kg/units
                          </Badge>
                        </div>
                      ))}
                      {products.filter(p => (p.stock || 0) < (p.minStock || 10)).length === 0 && (
                        <p className="text-green-600 font-medium">Badhai ho! Stock full hai.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Expense Logger */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Daily Expense</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Item (e.g. Apple)"
                        value={expenseForm.item}
                        onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Cost (₹)"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      />
                      <Button onClick={addExpense}>Add</Button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-gray-700">Today's Purchases</h4>
                      {expenses.length === 0 ? (
                        <p className="text-sm text-gray-500">No expenses added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {expenses.map((e) => (
                            <div key={e.id} className="flex justify-between text-sm border-b pb-2">
                              <span>{e.item}</span>
                              <span className="font-semibold">₹{e.amount}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold pt-2 text-lg">
                            <span>Total</span>
                            <span>₹{expenses.reduce((sum, e) => sum + Number(e.amount), 0)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentPage === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Bills & Udhaar</h1>
                  <p className="text-gray-600">Manage invoices and credit functionality</p>
                </div>
                <Button onClick={() => setShowInvoiceModal(true)}>
                  <Plus size={20} className="mr-2" />
                  New Bill
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{invoice.id}</td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">{invoice.customer_name}</div>
                              <div className="text-sm text-gray-500">{invoice.customer_phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{invoice.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                                {invoice.status === 'pending' ? 'Udhaar' : invoice.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                                >
                                  <Download size={14} className="mr-1" />
                                  PDF
                                </Button>
                                {invoice.status !== 'paid' && (
                                  <Button
                                    size="sm"
                                    onClick={() => sendReminder(invoice.id)}
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    <Send size={14} className="mr-1" />
                                    WhatsApp
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Customers</h1>
                  <p className="text-gray-600">Manage your customer database</p>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Invoices</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                            <td className="px-6 py-4 text-sm">{customer.phone}</td>
                            <td className="px-6 py-4 text-sm">{customer.totalInvoices || 0}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{(customer.totalAmount || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-orange-600 font-medium">₹{(customer.pendingAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Inventory</h1>
                  <p className="text-gray-600">Manage your products and stock levels</p>
                </div>
                <Button onClick={() => {
                  setSelectedProduct(null);
                  setProductForm({ name: '', sku: '', price: 0, stock: 0, category: '' });
                  setShowProductModal(true);
                }}>
                  <Plus size={20} className="mr-2" />
                  Add Product
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                            <td className="px-6 py-4 text-sm">{product.sku}</td>
                            <td className="px-6 py-4 text-sm">{product.category}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{product.price.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">{product.stock}</td>
                            <td className="px-6 py-4">
                              <Badge variant={product.stock > 10 ? 'success' : 'warning'}>
                                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setProductForm({ ...product });
                                  setShowProductModal(true);
                                }}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-gray-600">Business insights and trends</p>
              </div>

              {analytics && (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 font-medium">Paid Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.paid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-orange-600 font-medium">Pending Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-600 font-medium">Overdue Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.overdue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">
                        ₹{analytics.totalRevenue.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={user?.businessName} readOnly />
                  </div>
                  <div>
                    <Label>Owner Name</Label>
                    <Input value={user?.name} readOnly />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={user?.phone} readOnly />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={invoiceForm.customer_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={invoiceForm.customer_phone}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Items</Label>
                <Button onClick={addInvoiceItem} size="sm" variant="outline">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg bg-gray-50/50">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-12 md:col-span-5">
                        <Label className="text-xs">Description / Product</Label>
                        <select
                          className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white"
                          value={item.productId || ''}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            if (prodId === "") {
                              updateInvoiceItem(index, 'productId', null);
                              return;
                            }
                            const prod = products.find(p => p.id === prodId);
                            if (prod) {
                              const newItems = [...invoiceForm.items];
                              newItems[index] = {
                                ...newItems[index],
                                productId: prod.id,
                                description: prod.name,
                                price: prod.price
                              };
                              setInvoiceForm({ ...invoiceForm, items: newItems });
                            }
                          }}
                        >
                          <option value="">Custom Item / Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <Input
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Or type custom description"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateInvoiceItem(index, 'price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <Button
                          onClick={() => removeInvoiceItem(index)}
                          variant="destructive"
                          size="icon"
                          className="h-10 w-full"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">GST Rate (%)</Label>
                        <select
                          className="h-8 px-2 border rounded text-xs"
                          value={item.gstRate}
                          onChange={(e) => updateInvoiceItem(index, 'gstRate', Number(e.target.value))}
                        >
                          {[0, 5, 12, 18, 28].map(rate => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-gray-500">
                        Item Total: ₹{((item.quantity * item.price) * (1 + item.gstRate / 100)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowInvoiceModal(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={createInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chat Modal */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-2xl glass border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-8 right-8"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                <Sparkles size={24} />
              </div>
            </motion.div>
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-3xl font-black tracking-tight text-white mb-1">Business AI Agent</DialogTitle>
              <p className="text-blue-100 font-medium">Your personal growth assistant</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Textarea
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="E.g., 'What's my revenue today?' or 'Ping Rahul for payment'"
                    rows={4}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 resize-none transition-all shadow-inner"
                    disabled={isRecording || isTranscribing}
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <AnimatePresence>
                      {aiMessage && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Button
                            onClick={handleAIChat}
                            size="icon"
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
                          >
                            <Send size={18} />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isRecording
                    ? 'bg-rose-500 text-white shadow-rose-500/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200'
                    }`}
                  disabled={isTranscribing}
                >
                  {isRecording ? <div className="w-4 h-4 bg-white rounded-sm animate-pulse" /> : <Mic size={24} />}
                </motion.button>

                <input
                  type="file"
                  id="ocr-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleOCRUpload}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => document.getElementById('ocr-upload').click()}
                  className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-lg transition-all"
                  disabled={isRecording || isTranscribing}
                >
                  <Plus size={24} />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(isRecording || isTranscribing) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4] }}
                        transition={{ repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-blue-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">
                    {isRecording ? 'Listening...' : 'Transcribing...'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAIChat} className="flex-1" disabled={isRecording || isTranscribing}>
                <Send className="mr-2" size={18} />
                Send Message
              </Button>
              {isRecording && (
                <Button onClick={stopRecording} variant="destructive">
                  Stop Recording
                </Button>
              )}
            </div>

            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="font-medium text-blue-900">{aiResponse.message}</p>
                {aiResponse.needsConfirmation && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setAiMessage('Yes');
                        setTimeout(handleAIChat, 100);
                      }}
                    >
                      Confirm (Yes)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAiMessage('No');
                        setTimeout(handleAIChat, 100);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {aiResponse.actionResult && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded border">
                    {JSON.stringify(aiResponse.actionResult, null, 2)}
                  </pre>
                )}
                {aiResponse.extractedData && (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><strong>Vendor:</strong> {aiResponse.extractedData.vendor}</p>
                      <p><strong>Amount:</strong> ₹{aiResponse.extractedData.amount}</p>
                      <p><strong>Date:</strong> {aiResponse.extractedData.date}</p>
                    </div>
                    {aiResponse.extractedData.items && (
                      <div className="text-xs">
                        <strong>Items:</strong>
                        <ul className="list-disc ml-4">
                          {aiResponse.extractedData.items.map((it, i) => (
                            <li key={i}>{it.name} - {it.qty} x ₹{it.price}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setInvoiceForm({
                          customer_name: aiResponse.extractedData.vendor || '',
                          customer_phone: '',
                          items: aiResponse.extractedData.items?.map(it => ({
                            description: it.name,
                            quantity: it.qty,
                            price: it.price,
                            gstRate: 18,
                            productId: null
                          })) || [{ description: 'Extracted Invoice', quantity: 1, price: aiResponse.extractedData.amount, gstRate: 18, productId: null }]
                        });
                        setShowAIChat(false);
                        setShowInvoiceModal(true);
                      }}
                    >
                      Convert to Invoice
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">💡 Voice Commands Examples:</p>
              <div className="space-y-1 text-xs text-purple-800">
                <p>• "Kitne total invoices hain?"</p>
                <p>• "Rahul ko payment reminder bhejo"</p>
                <p>• "Show me pending payments"</p>
                <p>• "मेरी total revenue कितनी है?"</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. Cotton T-Shirt"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="SKU001"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Apparel"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={() => setShowProductModal(false)} variant="outline">Cancel</Button>
              <Button onClick={handleSaveProduct}>Save Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}