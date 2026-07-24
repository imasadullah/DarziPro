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
    getStats: () => ipcRenderer.invoke('order:getStats')
  },
  system: {
    getSettings: () => ipcRenderer.invoke('system:getSettings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('system:saveSettings', settings)
  }
});

