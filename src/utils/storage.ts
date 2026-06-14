// ============================================================
// utils/storage.ts - localStorage 持久化工具
// ============================================================
import { RecycleOrder, PriceAlert } from '../types';

const ORDERS_KEY = 'wje_orders';
const ALERTS_KEY = 'wje_price_alerts';

/** 获取所有回收单 */
export function getOrders(): RecycleOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 保存回收单 */
export function saveOrders(orders: RecycleOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

/** 新增一条回收单 */
export function addOrder(order: RecycleOrder): void {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}

/** 更新订单状态 */
export function updateOrderStatus(orderId: string, status: RecycleOrder['status'], inspectNote?: string, finalPrice?: number): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].status = status;
    if (inspectNote !== undefined) orders[idx].inspectNote = inspectNote;
    if (finalPrice !== undefined) orders[idx].finalPrice = finalPrice;
    saveOrders(orders);
  }
}

/** 获取所有估价提醒 */
export function getPriceAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 保存估价提醒列表 */
export function savePriceAlerts(alerts: PriceAlert[]): void {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

/** 新增一条估价提醒 */
export function addPriceAlert(alert: PriceAlert): void {
  const alerts = getPriceAlerts();
  alerts.unshift(alert);
  savePriceAlerts(alerts);
}

/** 更新估价提醒（按id） */
export function updatePriceAlert(alertId: string, updates: Partial<PriceAlert>): void {
  const alerts = getPriceAlerts();
  const idx = alerts.findIndex(a => a.id === alertId);
  if (idx >= 0) {
    alerts[idx] = { ...alerts[idx], ...updates };
    savePriceAlerts(alerts);
  }
}

/** 删除一条估价提醒 */
export function deletePriceAlert(alertId: string): void {
  const alerts = getPriceAlerts();
  savePriceAlerts(alerts.filter(a => a.id !== alertId));
}

/** 检查并更新提醒触发状态 */
export function checkAndUpdateAlerts(): PriceAlert[] {
  const alerts = getPriceAlerts();
  let changed = false;
  for (const alert of alerts) {
    if (alert.enabled && !alert.triggered) {
      if (alert.currentPriceHigh >= alert.expectedPrice) {
        alert.triggered = true;
        changed = true;
      }
    }
  }
  if (changed) savePriceAlerts(alerts);
  return alerts;
}
