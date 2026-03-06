import { Component, HostListener, inject, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
export class App implements OnInit, AfterViewInit {
  timelineService = inject(TimelineService);
  cdr = inject(ChangeDetectorRef);
  
  @ViewChild('scrollArea') scrollArea!: ElementRef<HTMLDivElement>;

  scales: Timescale[] = ['Day', 'Week', 'Month'];
  isPanelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder: WorkOrder | null = null;
  clickedCenterId = '';
  clickedDateStr = ''; 

  isMobile = window.innerWidth <= 992; 
  selectedMobileWorkCenterId: string | null = null;
  
  isExtending = false;
  timelineReady = false;

  ngOnInit() {
    const centers = this.timelineService.workCenters();
    if (centers.length > 0) this.selectedMobileWorkCenterId = centers[0].docId;
  }

  ngAfterViewInit() {
    this.scrollToToday();
    requestAnimationFrame(() => {
      this.timelineReady = true;
      this.cdr.detectChanges();
    }); 
  }

  onTimelineScroll(event: Event) {
    const element = event.target as HTMLElement;

    if (this.isExtending) return;

    const threshold = 150; 
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    const distanceToRight = scrollWidth - scrollLeft - clientWidth;

    if (distanceToRight < threshold) {
      this.isExtending = true;
      this.timelineService.extendTimeline('future', 6);
      this.cdr.detectChanges();
      setTimeout(() => { this.isExtending = false; }, 200);
    } else if (scrollLeft < threshold) {
      this.isExtending = true;
      const preWidth = element.scrollWidth;
      const preLeft = element.scrollLeft;

      this.timelineService.extendTimeline('past', 6);
      this.cdr.detectChanges(); 

      const postWidth = element.scrollWidth;
      const diff = postWidth - preWidth;
      
      element.scrollLeft = preLeft + diff;
      setTimeout(() => { this.isExtending = false; }, 200);
    }
  }

  @HostListener('window:resize') onResize() { this.isMobile = window.innerWidth <= 992; }
  
  scrollToToday() {
    const scrollContainer = this.scrollArea?.nativeElement;
    if (scrollContainer) {
      const sidebarWidth = this.isMobile ? 0 : 280;
      const absolutePosition = sidebarWidth + this.todayLeftPosition;
      const screenOffset = scrollContainer.clientWidth / 2;
      
      scrollContainer.scrollLeft = Math.max(0, absolutePosition - screenOffset);
    }
  }

  onScaleChange(scale: Timescale) { 
    this.timelineService.setTimescale(scale); 
    setTimeout(() => this.scrollToToday(), 50);
  }

  get visibleWorkCenters() {
    const centers = this.timelineService.workCenters();
    return this.isMobile ? centers.filter(wc => wc.docId === this.selectedMobileWorkCenterId) : centers;
  }

  getOrdersFor(wcId: string) { return this.timelineService.workOrders().filter(o => o.data.workCenterId === wcId); }
  openCreateWithDate(dateStr: string, wcId: string) { this.panelMode = 'create'; this.clickedCenterId = wcId; this.selectedOrder = null; this.clickedDateStr = dateStr; this.isPanelOpen = true; }
  openEdit(order: WorkOrder) { this.panelMode = 'edit'; this.selectedOrder = order; this.isPanelOpen = true; }
  deleteOrder(docId: string) { this.timelineService.deleteWorkOrder(docId); }

  get currentBadgeText(): string {
    const scale = this.timelineService.timeScale();
    return scale === 'Month' ? 'Current month' : scale === 'Week' ? 'Current week' : 'Today';
  }

  get todayLeftPosition(): number {
    const today = new Date();
    const scale = this.timelineService.timeScale();
    const startDate = this.timelineService.timelineStartDate();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (scale === 'Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysFromStart = this.timelineService.getDaysBetween(startDate, startOfMonth);
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (daysFromStart * this.timelineService.pixelsPerDay()) + ((daysInMonth * this.timelineService.pixelsPerDay()) / 2);
    } else if (scale === 'Week') {
      const days = this.timelineService.getDaysBetween(startDate, todayMidnight);
      return (Math.floor(days / 7) * 7 * this.timelineService.pixelsPerDay()) + (3.5 * this.timelineService.pixelsPerDay());
    } else {
      const days = this.timelineService.getDaysBetween(startDate, todayMidnight);
      return (days * this.timelineService.pixelsPerDay()) + (this.timelineService.pixelsPerDay() / 2);
    }
  }

  get todayWidthPixels(): number {
    const today = new Date();
    const scale = this.timelineService.timeScale();
    if (scale === 'Month') return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() * this.timelineService.pixelsPerDay();
    return (scale === 'Week' ? 7 : 1) * this.timelineService.pixelsPerDay();
  }
}