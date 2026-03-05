import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimelineService, Timescale, WorkOrder } from './services/timeline';
import { WorkOrderBarComponent } from './components/work-order-bar/work-order-bar';
import { WorkOrderPanelComponent } from './components/work-order-panel/work-order-panel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, WorkOrderBarComponent, WorkOrderPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit{
  timelineService = inject(TimelineService);
  scales: Timescale[] = ['Day', 'Week', 'Month'];

  
  isPanelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder: WorkOrder | null = null;
  clickedCenterId = '';
  clickedDateStr = ''; 

  isMobile = window.innerWidth <= 992; 
  selectedMobileWorkCenterId: string | null = null;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 992;
  }

  ngOnInit() {
    const centers = this.timelineService.workCenters();
    if (centers.length > 0) {
      this.selectedMobileWorkCenterId = centers[0].docId;
    }
  }

  get visibleWorkCenters() {
    const centers = this.timelineService.workCenters();
    
    if (this.isMobile) {
      return centers.filter(wc => wc.docId === this.selectedMobileWorkCenterId);
    }
    
    return centers; 
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToToday(), 50); 
  }

  scrollToToday() {
    const scrollContainer = document.querySelector('.timeline-card') as HTMLElement;
    
    if (scrollContainer) {
      scrollContainer.scrollLeft = Math.max(0, this.todayLeftPosition - 300);
    }
  }

  onScaleChange(scale: Timescale) { 
    this.timelineService.setTimescale(scale); 
    setTimeout(() => this.scrollToToday(), 50);
  }

  getOrdersFor(wcId: string) { 
    return this.timelineService.workOrders().filter(o => o.data.workCenterId === wcId); 
  }

  openCreateWithDate(dateStr: string, wcId: string) {
    this.panelMode = 'create';
    this.clickedCenterId = wcId;
    this.selectedOrder = null;
    this.clickedDateStr = dateStr; 
    this.isPanelOpen = true;
  }

  openEdit(order: WorkOrder) {
    this.panelMode = 'edit';
    this.selectedOrder = order;
    this.isPanelOpen = true;
  }

  deleteOrder(docId: string) { 
    this.timelineService.deleteWorkOrder(docId); 
  }

  get currentBadgeText(): string {
    const scale = this.timelineService.timeScale();
    if (scale === 'Month') return 'Current month';
    if (scale === 'Week') return 'Current week';
    return 'Today';
  }

  get todayLeftPosition(): number {
    const today = new Date();
    const scale = this.timelineService.timeScale();

    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let columnLeftPixel = 0;
    let columnWidthPixels = 0;

    if (scale === 'Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysFromStart = this.timelineService.getDaysBetween(this.timelineService.timelineStartDate, startOfMonth);
      
      columnLeftPixel = daysFromStart * this.timelineService.pixelsPerDay();
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      columnWidthPixels = daysInMonth * this.timelineService.pixelsPerDay();

    } else if (scale === 'Week') {
      const daysToToday = this.timelineService.getDaysBetween(this.timelineService.timelineStartDate, todayMidnight);
      
      const weeksPassed = Math.floor(daysToToday / 7);
      
      columnLeftPixel = weeksPassed * 7 * this.timelineService.pixelsPerDay();
      columnWidthPixels = 7 * this.timelineService.pixelsPerDay();

    } else {
      const daysFromStart = this.timelineService.getDaysBetween(this.timelineService.timelineStartDate, todayMidnight);
      
      columnLeftPixel = daysFromStart * this.timelineService.pixelsPerDay();
      columnWidthPixels = 1 * this.timelineService.pixelsPerDay(); 
    }

    return columnLeftPixel + (columnWidthPixels / 2);
  }

  get todayWidthPixels(): number {
    const today = new Date();
    const scale = this.timelineService.timeScale();

    if (scale === 'Month') {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return daysInMonth * this.timelineService.pixelsPerDay();
      
    } else if (scale === 'Week') {
      return 7 * this.timelineService.pixelsPerDay();
      
    } else {
      return 1 * this.timelineService.pixelsPerDay();
    }
  }

  
}