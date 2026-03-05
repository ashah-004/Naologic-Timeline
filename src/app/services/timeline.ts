import { Injectable, signal, computed, effect } from '@angular/core';

export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';
export type Timescale = 'Day' | 'Week' | 'Month';

export interface WorkCenter { docId: string; docType: 'workCenter'; data: { name: string; }; }
export interface WorkOrder { docId: string; docType: 'workOrder'; data: { name: string; workCenterId: string; status: WorkOrderStatus; startDate: string; endDate: string; }; }

@Injectable({ providedIn: 'root' })
export class TimelineService {
  timeScale = signal<Timescale>('Month');

  timelineStartDate = new Date(new Date().getFullYear() - 2, 0, 1);;
  pixelsPerDay = signal<number>(6);

  workCenters = signal<WorkCenter[]>([
    { docId: 'wc_1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
    { docId: 'wc_2', docType: 'workCenter', data: { name: 'Rodriguez Electrics' } },
    { docId: 'wc_3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
    { docId: 'wc_4', docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
    { docId: 'wc_5', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
    { docId: 'wc_6', docType: 'workCenter', data: { name: "Meta" } },
    { docId: 'wc_7', docType: 'workCenter', data: { name: "Google" } },
    { docId: 'wc_8', docType: 'workCenter', data: { name: "Amazon" } },
    { docId: 'wc_9', docType: 'workCenter', data: { name: "Apple" } },
    { docId: 'wc_9', docType: 'workCenter', data: { name: "Nvidia" } },
    { docId: 'wc_9', docType: 'workCenter', data: { name: "AMD" } },
    { docId: 'wc_10', docType: 'workCenter', data: { name: "Netflix" } }
  ]);

  workOrders = signal<WorkOrder[]>([
    { docId: 'wo_1', docType: 'workOrder', data: { name: 'Complete Systems', workCenterId: 'wc_1', status: 'complete', startDate: '2024-09-15', endDate: '2024-10-10' } },
    { docId: 'wo_2', docType: 'workOrder', data: { name: 'Rodriguez Electrics', workCenterId: 'wc_2', status: 'in-progress', startDate: '2024-08-10', endDate: '2024-09-05' } },
    { docId: 'wo_3', docType: 'workOrder', data: { name: 'Konsulting Inc', workCenterId: 'wc_3', status: 'in-progress', startDate: '2024-08-20', endDate: '2024-09-25' } },
    { docId: 'wo_4', docType: 'workOrder', data: { name: 'McMarrow Distribution', workCenterId: 'wc_4', status: 'blocked', startDate: '2024-09-10', endDate: '2024-11-05' } },
  ]);

  constructor() {
    const savedOrders = localStorage.getItem('naologic_orders');
    if (savedOrders) {
      this.workOrders.set(JSON.parse(savedOrders));
    }

    effect(() => {
      localStorage.setItem('naologic_orders', JSON.stringify(this.workOrders()));
    });
  }

  timelineColumns = computed(() => {
    const scale = this.timeScale();
    const cols = [];
    let current = new Date(this.timelineStartDate);

    const iterations = scale === 'Month' ? 60 : scale === 'Week' ? 260 : 1825;

    for (let i = 0; i < iterations; i++) {
      let label = '';
      let daysInCol = 1;
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

      if (scale === 'Month') {
        label = current.toLocaleString('default', { month: 'short', year: 'numeric' });

        daysInCol = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

        current.setMonth(current.getMonth() + 1);
      } else if (scale === 'Week') {
        label = `Week of ${current.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        daysInCol = 7;
        current.setDate(current.getDate() + 7);
      } else {
        label = current.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        daysInCol = 1;
        current.setDate(current.getDate() + 1);
      }

      cols.push({ label, dateStr, daysInCol });
    }
    return cols;
  });

  setTimescale(scale: Timescale) {
    this.timeScale.set(scale);
    if (scale === 'Day') this.pixelsPerDay.set(180);
    if (scale === 'Week') this.pixelsPerDay.set(25.7);
    if (scale === 'Month') this.pixelsPerDay.set(6);
  }

  hasOverlap(workCenterId: string, startDate: string, endDate: string, excludeDocId?: string): boolean {
    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();

    return this.workOrders().some(order => {
      if (order.data.workCenterId !== workCenterId) return false;
      if (excludeDocId && order.docId === excludeDocId) return false;

      const existingStart = new Date(order.data.startDate).getTime();
      const existingEnd = new Date(order.data.endDate).getTime();

      return (newStart < existingEnd) && (newEnd > existingStart);
    });
  }

  saveWorkOrder(order: WorkOrder, mode: 'create' | 'edit') {
    if (mode === 'create') this.workOrders.update(orders => [...orders, order]);
    else this.workOrders.update(orders => orders.map(o => o.docId === order.docId ? order : o));
  }

  deleteWorkOrder(docId: string) {
    this.workOrders.update(orders => orders.filter(o => o.docId !== docId));
  }

  getDaysBetween(startDate: string | Date, endDate: string | Date): number {
    const getUTC = (input: string | Date) => {
      if (typeof input === 'string') {
        const [year, month, day] = input.split('-').map(Number);
        return Date.UTC(year, month - 1, day);
      }
      return Date.UTC(input.getFullYear(), input.getMonth(), input.getDate());
    };

    const utc1 = getUTC(startDate);
    const utc2 = getUTC(endDate);

    return Math.round((utc2 - utc1) / 86400000);
  }
}