import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  auth: {
    hasUsers: () => ipcRenderer.invoke('auth:hasUsers'),
    registerOwner: (data: any) => ipcRenderer.invoke('auth:registerOwner', data),
    login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
    loginWithPIN: (pin: string) => ipcRenderer.invoke('auth:loginWithPIN', pin),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser')
  },
  customers: {
    getAll: (params?: any) => ipcRenderer.invoke('customer:getAll', params),
    getById: (id: number) => ipcRenderer.invoke('customer:getById', id),
    search: (query: string) => ipcRenderer.invoke('customer:search', query),
    create: (data: any) => ipcRenderer.invoke('customer:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('customer:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('customer:delete', id)
  },
  measurements: {
    create: (data: any) => ipcRenderer.invoke('measurement:create', data),
    update: (id: number, data: any) =>
      ipcRenderer.invoke('measurement:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('measurement:delete', id),
    get: (id: number) => ipcRenderer.invoke('measurement:get', id),
    getAll: (params?: any) => ipcRenderer.invoke('measurement:getAll', params),
    getByCustomer: (customerId: number, params?: any) =>
      ipcRenderer.invoke('measurement:getByCustomer', { customerId, params }),
    copy: (measurementId: number) =>
      ipcRenderer.invoke('measurement:copy', measurementId),
    getLatest: (customerId: number, measurementType?: string) =>
      ipcRenderer.invoke('measurement:getLatest', { customerId, measurementType })
  },
  orders: {
    create: (data: any) => ipcRenderer.invoke('order:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('order:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('order:delete', id),
    get: (id: number) => ipcRenderer.invoke('order:get', id),
    getAll: (params?: any) => ipcRenderer.invoke('order:getAll', params),
    getByCustomer: (customerId: number, params?: any) =>
      ipcRenderer.invoke('order:getByCustomer', { customerId, params }),
    changeStatus: (id: number, status: string) =>
      ipcRenderer.invoke('order:changeStatus', { id, status }),
    markReady: (id: number) => ipcRenderer.invoke('order:markReady', id),
    markDelivered: (id: number) => ipcRenderer.invoke('order:markDelivered', id),
    cancel: (id: number) => ipcRenderer.invoke('order:cancel', id),
    search: (query: string) => ipcRenderer.invoke('order:search', query),
    getStats: () => ipcRenderer.invoke('order:getStats'),
    printReceipt: (orderId: number) => ipcRenderer.invoke('order:printReceipt', orderId),
    printDeliveryReceipt: (orderId: number, deliveredBy: string) =>
      ipcRenderer.invoke('order:printDeliveryReceipt', { orderId, deliveredBy })
  },
  payments: {
    create: (data: any) => ipcRenderer.invoke('payment:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('payment:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('payment:delete', id),
    get: (id: number) => ipcRenderer.invoke('payment:get', id),
    getAll: (params?: any) => ipcRenderer.invoke('payment:getAll', params),
    getByCustomer: (customerId: number, params?: any) =>
      ipcRenderer.invoke('payment:getByCustomer', { customerId, params }),
    getByOrder: (orderId: number) => ipcRenderer.invoke('payment:getByOrder', orderId),
    calculateBalance: (orderId: number) =>
      ipcRenderer.invoke('payment:calculateBalance', orderId),
    getStats: () => ipcRenderer.invoke('payment:getStats'),
    printReceipt: (paymentId: number) => ipcRenderer.invoke('payment:printReceipt', paymentId)
  },
  system: {
    getSettings: () => ipcRenderer.invoke('system:getSettings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('system:saveSettings', settings),
    uploadLogo: () => ipcRenderer.invoke('system:uploadLogo'),
    resetSettings: () => ipcRenderer.invoke('system:resetSettings')
  },
  users: {
    getAll: () => ipcRenderer.invoke('user:getAll'),
    create: (data: any) => ipcRenderer.invoke('user:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('user:update', { id, data }),
    setStatus: (id: number, status: string) => ipcRenderer.invoke('user:setStatus', { id, status }),
    resetPassword: (id: number, password: string) => ipcRenderer.invoke('user:resetPassword', { id, password }),
    resetPin: (id: number, pin: string | null) => ipcRenderer.invoke('user:resetPin', { id, pin })
  },
  reports: {
    getKpiSummary: () => ipcRenderer.invoke('report:getKpiSummary'),
    getRevenueReport: (params?: any) => ipcRenderer.invoke('report:getRevenueReport', params),
    getOrdersReport: (params?: any) => ipcRenderer.invoke('report:getOrdersReport', params),
    getCustomerReport: (params?: any) => ipcRenderer.invoke('report:getCustomerReport', params),
    getOutstandingReport: (params?: any) => ipcRenderer.invoke('report:getOutstandingReport', params),
    getDeliveryReport: () => ipcRenderer.invoke('report:getDeliveryReport'),
    getPaymentMethodReport: (params?: any) => ipcRenderer.invoke('report:getPaymentMethodReport', params),
    getRevenueTrend: (params?: any) => ipcRenderer.invoke('report:getRevenueTrend', params),
    exportCsv: (type: string, params?: any) => ipcRenderer.invoke('report:exportCsv', { type, params }),
    exportPdf: (type: string, params?: any) => ipcRenderer.invoke('report:exportPdf', { type, params }),
  },
  backup: {
    createBackup:    ()                  => ipcRenderer.invoke('backup:createBackup'),
    restoreBackup:   ()                  => ipcRenderer.invoke('backup:restoreBackup'),
    confirmRestore:  (filePath: string)  => ipcRenderer.invoke('backup:confirmRestore', filePath),
    listBackups:     ()                  => ipcRenderer.invoke('backup:listBackups'),
    deleteBackup:    (filePath: string)  => ipcRenderer.invoke('backup:deleteBackup', filePath),
    verifyBackup:    (filePath: string)  => ipcRenderer.invoke('backup:verifyBackup', filePath),
    openFolder:      (folderPath: string) => ipcRenderer.invoke('backup:openFolder', folderPath),
    getAutoConfig:   ()                  => ipcRenderer.invoke('backup:getAutoConfig'),
    saveAutoConfig:  (config: any)       => ipcRenderer.invoke('backup:saveAutoConfig', config),
  }

});

