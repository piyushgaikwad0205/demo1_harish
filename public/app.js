document.addEventListener('DOMContentLoaded', () => {
  // State
  let uptimeSeconds = 0;
  let currentTab = 'playground';
  const baseUrl = window.location.origin;

  // Cache DOM Elements
  const serverHost = document.getElementById('serverHost');
  const liveUptime = document.getElementById('liveUptime');
  const metricTotalReq = document.getElementById('metricTotalReq');
  const metricAvgLatency = document.getElementById('metricAvgLatency');
  const metricMemory = document.getElementById('metricMemory');
  const metricMemorySub = document.getElementById('metricMemorySub');
  const metricEnv = document.getElementById('metricEnv');
  const metricPlatform = document.getElementById('metricPlatform');

  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Playground Elements
  const endpointPresets = document.getElementById('endpointPresets');
  const httpMethod = document.getElementById('httpMethod');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const sendRequestBtn = document.getElementById('sendRequestBtn');
  const requestBodySection = document.getElementById('requestBodySection');
  const requestBodyInput = document.getElementById('requestBodyInput');
  const formatJsonBtn = document.getElementById('formatJsonBtn');
  const curlOutput = document.getElementById('curlOutput');
  const copyCurlBtn = document.getElementById('copyCurlBtn');
  const responseJsonOutput = document.getElementById('responseJsonOutput');
  const copyResponseBtn = document.getElementById('copyResponseBtn');
  const responseMeta = document.getElementById('responseMeta');
  const resStatusBadge = document.getElementById('resStatusBadge');
  const resTimeBadge = document.getElementById('resTimeBadge');
  const resSizeLabel = document.getElementById('resSizeLabel');

  // Counters & Badges
  const usersTabCount = document.getElementById('usersTabCount');
  const productsTabCount = document.getElementById('productsTabCount');
  const trafficTabCount = document.getElementById('trafficTabCount');

  // Tables & Grids
  const usersTableBody = document.getElementById('usersTableBody');
  const userSearchInput = document.getElementById('userSearchInput');
  const refreshUsersBtn = document.getElementById('refreshUsersBtn');
  const productsGrid = document.getElementById('productsGrid');
  const productCategoryFilter = document.getElementById('productCategoryFilter');
  const trafficTableBody = document.getElementById('trafficTableBody');
  const clearLogsBtn = document.getElementById('clearLogsBtn');

  // Modals
  const addUserModal = document.getElementById('addUserModal');
  const openAddUserModalBtn = document.getElementById('openAddUserModalBtn');
  const closeAddUserModalBtn = document.getElementById('closeAddUserModalBtn');
  const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
  const addUserForm = document.getElementById('addUserForm');

  const addProductModal = document.getElementById('addProductModal');
  const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
  const closeAddProductModalBtn = document.getElementById('closeAddProductModalBtn');
  const cancelAddProductBtn = document.getElementById('cancelAddProductBtn');
  const addProductForm = document.getElementById('addProductForm');

  const copyBaseUrlBtn = document.getElementById('copyBaseUrlBtn');

  // Initialize Host
  serverHost.textContent = window.location.host || 'localhost:3000';

  // Format seconds to hh:mm:ss
  function formatUptime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: ${type === 'success' ? '#10b981' : (type === 'error' ? '#f43f5e' : '#6366f1')}">●</span>
      <span>${message}</span>
    `;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Update Curl Command preview
  function updateCurlPreview() {
    const method = httpMethod.value;
    const path = apiUrlInput.value.trim();
    const fullUrl = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    let curl = `curl -X ${method} "${fullUrl}"`;

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
      const body = requestBodyInput.value.trim();
      if (body) {
        try {
          const compactJson = JSON.stringify(JSON.parse(body));
          curl += ` \\\n  -d '${compactJson}'`;
        } catch {
          curl += ` \\\n  -d '${body}'`;
        }
      }
    }
    curlOutput.textContent = curl;
  }

  // Navigation Tabs Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`view-${tabId}`);
      if (target) target.classList.add('active');
      currentTab = tabId;

      if (tabId === 'users') fetchUsers();
      if (tabId === 'products') fetchProducts();
      if (tabId === 'traffic') fetchTrafficLogs();
    });
  });

  // Method select change
  httpMethod.addEventListener('change', () => {
    httpMethod.className = `method-select method-${httpMethod.value.toLowerCase()}`;
    const needsBody = ['POST', 'PUT', 'PATCH'].includes(httpMethod.value);
    requestBodySection.style.display = needsBody ? 'block' : 'none';
    updateCurlPreview();
  });

  apiUrlInput.addEventListener('input', updateCurlPreview);
  requestBodyInput.addEventListener('input', updateCurlPreview);

  // Preset Selector
  endpointPresets.addEventListener('change', () => {
    const val = endpointPresets.value;
    if (val === 'custom') return;

    const presets = {
      health: { method: 'GET', url: '/api/health', body: '' },
      metrics: { method: 'GET', url: '/api/metrics', body: '' },
      get_users: { method: 'GET', url: '/api/users', body: '' },
      get_user_1: { method: 'GET', url: '/api/users/1', body: '' },
      post_user: {
        method: 'POST',
        url: '/api/users',
        body: JSON.stringify({
          name: 'David Lightman',
          email: 'd.lightman@norad.mil',
          role: 'Cybersecurity Spec',
          status: 'Active'
        }, null, 2)
      },
      get_products: { method: 'GET', url: '/api/products', body: '' },
      post_product: {
        method: 'POST',
        url: '/api/products',
        body: JSON.stringify({
          name: 'HyperDrive SSD 2TB PCIe 5.0',
          category: 'Hardware',
          price: 219.99,
          stock: 30
        }, null, 2)
      },
      echo: {
        method: 'POST',
        url: '/api/echo',
        body: JSON.stringify({
          clientMessage: 'Hello from Nexus Dashboard!',
          testTimestamp: new Date().toISOString(),
          activeFeatures: ['REST', 'Telemetry', 'CORS']
        }, null, 2)
      }
    };

    const p = presets[val];
    if (p) {
      httpMethod.value = p.method;
      httpMethod.className = `method-select method-${p.method.toLowerCase()}`;
      apiUrlInput.value = p.url;
      const needsBody = ['POST', 'PUT', 'PATCH'].includes(p.method);
      requestBodySection.style.display = needsBody ? 'block' : 'none';
      requestBodyInput.value = p.body;
      updateCurlPreview();
    }
  });

  // Format JSON button
  formatJsonBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(requestBodyInput.value);
      requestBodyInput.value = JSON.stringify(parsed, null, 2);
      updateCurlPreview();
      showToast('JSON Formatted', 'success');
    } catch {
      showToast('Invalid JSON syntax', 'error');
    }
  });

  // Send API Request
  async function executeRequest() {
    const method = httpMethod.value;
    const path = apiUrlInput.value.trim();
    const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

    sendRequestBtn.disabled = true;
    sendRequestBtn.innerHTML = `<span>Sending...</span>`;

    const startTime = performance.now();
    try {
      const options = {
        method,
        headers: {}
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        options.headers['Content-Type'] = 'application/json';
        const bodyContent = requestBodyInput.value.trim();
        if (bodyContent) {
          options.body = bodyContent;
        }
      }

      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - startTime);

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      // Render Meta
      responseMeta.style.display = 'flex';
      resStatusBadge.textContent = `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Error')}`;
      resStatusBadge.className = `badge ${res.ok ? 'badge-success' : 'badge-danger'}`;
      resTimeBadge.textContent = `${elapsed}ms`;

      // Render Body
      const jsonString = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      responseJsonOutput.textContent = jsonString;
      resSizeLabel.textContent = `Response (${(new Blob([jsonString]).size / 1024).toFixed(1)} KB)`;

      showToast(`Request complete (${res.status})`, res.ok ? 'success' : 'error');
      fetchMetrics();
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      responseMeta.style.display = 'flex';
      resStatusBadge.textContent = 'Network Error';
      resStatusBadge.className = 'badge badge-danger';
      resTimeBadge.textContent = `${elapsed}ms`;
      responseJsonOutput.textContent = `// Error executing request:\n${err.message}`;
      showToast('Request Failed: ' + err.message, 'error');
    } finally {
      sendRequestBtn.disabled = false;
      sendRequestBtn.innerHTML = `<span>Send</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    }
  }

  sendRequestBtn.addEventListener('click', executeRequest);

  // Copy Buttons
  copyCurlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(curlOutput.textContent);
    showToast('cURL copied to clipboard!', 'success');
  });

  copyResponseBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(responseJsonOutput.textContent);
    showToast('JSON response copied!', 'success');
  });

  copyBaseUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(baseUrl);
    showToast('Base URL copied: ' + baseUrl, 'success');
  });

  // Fetch Metrics & Telemetry
  async function fetchMetrics() {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/health')
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        metricTotalReq.textContent = m.totalRequests.toLocaleString();
        metricAvgLatency.textContent = m.avgLatencyMs;
        uptimeSeconds = m.uptimeSeconds;
        usersTabCount.textContent = m.activeUsersCount;
        productsTabCount.textContent = m.activeProductsCount;
      }

      if (healthRes.ok) {
        const h = await healthRes.json();
        metricMemory.textContent = h.processMemory.heapUsedMb;
        metricMemorySub.textContent = `RSS: ${h.processMemory.rssMb} MB`;
        metricEnv.textContent = h.system.nodeVersion;
        metricPlatform.textContent = `${h.system.platform} (${h.system.arch})`;
      }
    } catch (e) {
      // Server might be reloading
    }
  }

  // Fetch Users
  async function fetchUsers() {
    try {
      const q = userSearchInput.value.trim();
      const res = await fetch(`/api/users${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      usersTabCount.textContent = data.count;

      if (data.users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;" class="text-muted">No users found. Click 'Add User' above to create one.</td></tr>`;
        return;
      }

      usersTableBody.innerHTML = data.users.map(u => `
        <tr>
          <td>
            <div class="user-avatar-cell">
              <img src="${u.avatar}" alt="${u.name}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff'">
              <div>
                <div class="user-name">${escapeHtml(u.name)}</div>
                <div class="user-email">${escapeHtml(u.email)}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-subtle">${escapeHtml(u.role)}</span></td>
          <td>
            <span class="badge ${u.status === 'Active' ? 'badge-success' : (u.status === 'Idle' ? 'badge-warning' : 'badge-subtle')}">
              ${escapeHtml(u.status)}
            </span>
          </td>
          <td class="font-mono text-muted" style="font-size:0.75rem;">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td class="text-right">
            <button class="btn-danger-outline" onclick="deleteUser(${u.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error loading users: ' + err.message, 'error');
    }
  }

  window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('User deleted', 'success');
        fetchUsers();
        fetchMetrics();
      } else {
        showToast('Failed to delete user', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Fetch Products
  async function fetchProducts() {
    try {
      const cat = productCategoryFilter.value;
      const res = await fetch(`/api/products${cat ? `?category=${encodeURIComponent(cat)}` : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      productsTabCount.textContent = data.count;

      if (data.products.length === 0) {
        productsGrid.innerHTML = `<div class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No products found in this category.</div>`;
        return;
      }

      productsGrid.innerHTML = data.products.map(p => `
        <div class="product-card">
          <div>
            <div class="prod-cat">${escapeHtml(p.category)}</div>
            <h4 class="prod-name">${escapeHtml(p.name)}</h4>
            <div style="display:flex; gap: 0.5rem; align-items:center;">
              <span class="badge ${p.status === 'In Stock' ? 'badge-success' : (p.status === 'Low Stock' ? 'badge-warning' : 'badge-danger')}">${escapeHtml(p.status)}</span>
              <span class="text-muted" style="font-size: 0.75rem;">Stock: ${p.stock}</span>
            </div>
          </div>
          <div class="prod-details">
            <span class="prod-price">$${p.price.toFixed(2)}</span>
            <button class="btn-danger-outline" onclick="deleteProduct(${p.id})">Remove</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      showToast('Error loading products: ' + err.message, 'error');
    }
  }

  window.deleteProduct = async function(id) {
    if (!confirm('Delete this product from catalog?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed', 'success');
        fetchProducts();
        fetchMetrics();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Fetch Traffic Logs
  async function fetchTrafficLogs() {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) return;
      const data = await res.json();
      trafficTabCount.textContent = data.count;

      if (data.logs.length === 0) {
        trafficTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;" class="text-muted">No requests recorded yet. Fire some queries in the Playground!</td></tr>`;
        return;
      }

      trafficTableBody.innerHTML = data.logs.slice(0, 30).map(l => {
        const statusClass = l.statusCode >= 500 ? 'badge-danger' : (l.statusCode >= 400 ? 'badge-warning' : 'badge-success');
        const methodClass = `method-${l.method.toLowerCase()}`;
        return `
          <tr>
            <td class="text-muted">${new Date(l.timestamp).toLocaleTimeString()}</td>
            <td><span class="method-tag ${methodClass}">${l.method}</span></td>
            <td><code style="color:#e2e8f0;">${escapeHtml(l.path)}</code></td>
            <td><span class="badge ${statusClass}">${l.statusCode}</span></td>
            <td class="text-muted">${l.durationMs}ms</td>
            <td class="text-muted">${l.ip}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      // Ignore background poll errors
    }
  }

  // Clear Logs
  clearLogsBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      showToast('Traffic logs cleared', 'success');
      fetchTrafficLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Modal Handlers
  openAddUserModalBtn.addEventListener('click', () => addUserModal.style.display = 'flex');
  closeAddUserModalBtn.addEventListener('click', () => addUserModal.style.display = 'none');
  cancelAddUserBtn.addEventListener('click', () => addUserModal.style.display = 'none');

  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('newUserName').value.trim(),
      email: document.getElementById('newUserEmail').value.trim(),
      role: document.getElementById('newUserRole').value.trim(),
      status: document.getElementById('newUserStatus').value
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('User created successfully!', 'success');
        addUserModal.style.display = 'none';
        addUserForm.reset();
        fetchUsers();
        fetchMetrics();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  openAddProductModalBtn.addEventListener('click', () => addProductModal.style.display = 'flex');
  closeAddProductModalBtn.addEventListener('click', () => addProductModal.style.display = 'none');
  cancelAddProductBtn.addEventListener('click', () => addProductModal.style.display = 'none');

  addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('newProdName').value.trim(),
      category: document.getElementById('newProdCategory').value,
      price: parseFloat(document.getElementById('newProdPrice').value),
      stock: parseInt(document.getElementById('newProdStock').value, 10)
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Product added to catalog!', 'success');
        addProductModal.style.display = 'none';
        addProductForm.reset();
        fetchProducts();
        fetchMetrics();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add product', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Filters & search listeners
  let searchDebounce;
  userSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(fetchUsers, 300);
  });
  refreshUsersBtn.addEventListener('click', fetchUsers);
  productCategoryFilter.addEventListener('change', fetchProducts);

  // Escaping helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Ticker timer
  setInterval(() => {
    uptimeSeconds++;
    liveUptime.textContent = formatUptime(uptimeSeconds);
  }, 1000);

  // Background Telemetry Poller
  setInterval(() => {
    fetchMetrics();
    if (currentTab === 'traffic') {
      fetchTrafficLogs();
    }
  }, 2500);

  // Initial loads
  updateCurlPreview();
  fetchMetrics();
  fetchUsers();
  fetchProducts();
});
