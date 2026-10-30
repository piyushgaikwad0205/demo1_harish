const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_START_TIME = Date.now();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Request Metrics & Traffic Logs
const metrics = {
  totalRequests: 0,
  endpoints: {},
  responseTimes: [],
};

const trafficLogs = [];
const MAX_LOGS = 100;

// Request logger middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  metrics.totalRequests++;

  const routeKey = `${req.method} ${req.path}`;
  metrics.endpoints[routeKey] = (metrics.endpoints[routeKey] || 0) + 1;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 200) {
      metrics.responseTimes.shift();
    }

    // Skip logging static asset requests to keep log focused on API
    if (!req.path.startsWith('/api') && req.path !== '/') return;

    trafficLogs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.socket.remoteAddress || '127.0.0.1'
    });

    if (trafficLogs.length > MAX_LOGS) {
      trafficLogs.pop();
    }
  });

  next();
});

// Serve frontend static assets
app.use(express.static(path.join(__dirname, 'public')));

// Mock Data
let users = [
  {
    id: 1,
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.io',
    role: 'Lead Architect',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-01-15T09:20:00Z'
  },
  {
    id: 2,
    name: 'Alexander Chen',
    email: 'alex.chen@nexuscloud.dev',
    role: 'Senior DevOps',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-02-01T11:45:00Z'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    email: 'elena.r@quantumai.tech',
    role: 'ML Engineer',
    status: 'Idle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-02-18T14:10:00Z'
  },
  {
    id: 4,
    name: 'Marcus Vance',
    email: 'm.vance@cryptovault.org',
    role: 'Security Analyst',
    status: 'Offline',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-03-05T16:30:00Z'
  }
];

let products = [
  {
    id: 101,
    name: 'OmniDesk Pro Dual Monitor Stand',
    category: 'Hardware',
    price: 189.99,
    stock: 45,
    rating: 4.8,
    status: 'In Stock'
  },
  {
    id: 102,
    name: 'NeuralKey Mechanical RGB 75%',
    category: 'Peripherals',
    price: 129.50,
    stock: 12,
    rating: 4.9,
    status: 'Low Stock'
  },
  {
    id: 103,
    name: 'CloudSync Enterprise Seat (1 yr)',
    category: 'Software',
    price: 360.00,
    stock: 999,
    rating: 4.7,
    status: 'In Stock'
  },
  {
    id: 104,
    name: 'PulseFlow Noise-Canceling Headset',
    category: 'Audio',
    price: 249.00,
    stock: 0,
    rating: 4.6,
    status: 'Out of Stock'
  }
];

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health & System Info
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  const memory = process.memoryUsage();

  res.json({
    status: 'healthy',
    message: 'Demo server is running smoothly',
    uptime: `${uptimeSeconds} seconds`,
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024))
    },
    processMemory: {
      heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024) * 100) / 100,
      heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024) * 100) / 100,
      rssMb: Math.round(memory.rss / (1024 * 1024) * 100) / 100
    }
  });
});

// Realtime Metrics
app.get('/api/metrics', (req, res) => {
  const avgLatency = metrics.responseTimes.length > 0
    ? Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length)
    : 0;

  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

  res.json({
    totalRequests: metrics.totalRequests,
    avgLatencyMs: avgLatency,
    uptimeSeconds,
    endpointHits: metrics.endpoints,
    memoryUsage: process.memoryUsage(),
    activeUsersCount: users.length,
    activeProductsCount: products.length
  });
});

// Live Traffic Logs
app.get('/api/logs', (req, res) => {
  res.json({
    count: trafficLogs.length,
    logs: trafficLogs
  });
});

app.post('/api/logs/clear', (req, res) => {
  trafficLogs.length = 0;
  res.json({ message: 'Traffic logs cleared successfully' });
});

// USERS CRUD
app.get('/api/users', (req, res) => {
  const { search, role, status } = req.query;
  let result = [...users];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role) {
    result = result.filter(u => u.role.toLowerCase() === role.toLowerCase());
  }
  if (status) {
    result = result.filter(u => u.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    count: result.length,
    users: result
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email, role, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required fields' });
  }

  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name,
    email,
    role: role || 'Member',
    status: status || 'Active',
    avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 100)}?w=120&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, email, role, status } = req.body;
  users[index] = {
    ...users[index],
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };

  res.json({
    message: 'User updated successfully',
    user: users[index]
  });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const deletedUser = users.splice(index, 1)[0];
  res.json({
    message: 'User deleted successfully',
    user: deletedUser
  });
});

// PRODUCTS API
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let result = [...products];

  if (category) {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q));
  }

  res.json({
    count: result.length,
    products: result
  });
});

app.post('/api/products', (req, res) => {
  const { name, category, price, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 101,
    name,
    category: category || 'General',
    price: parseFloat(price),
    stock: parseInt(stock, 10) || 0,
    rating: 5.0,
    status: (stock > 10 ? 'In Stock' : (stock > 0 ? 'Low Stock' : 'Out of Stock'))
  };

  products.push(newProduct);
  res.status(201).json({
    message: 'Product added successfully',
    product: newProduct
  });
});

app.delete('/api/products/:id', (req, res) => {
  const prodId = parseInt(req.params.id, 10);
  const index = products.findIndex(p => p.id === prodId);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const deletedProduct = products.splice(index, 1)[0];
  res.json({
    message: 'Product removed successfully',
    product: deletedProduct
  });
});

// Echo & Utility endpoint
app.post('/api/echo', (req, res) => {
  res.json({
    message: 'Payload received successfully',
    receivedHeaders: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    },
    receivedBody: req.body,
    serverTime: new Date().toISOString()
  });
});

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedRoute: `${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/metrics',
      'GET /api/logs',
      'GET /api/users',
      'POST /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      'GET /api/products',
      'POST /api/products',
      'DELETE /api/products/:id',
      'POST /api/echo'
    ]
  });
});

// Catch-all to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`🚀 Demo Express Server is live!`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`📊 Metrics API: http://localhost:${PORT}/api/metrics`);
  console.log(`==========================================\n`);
});
