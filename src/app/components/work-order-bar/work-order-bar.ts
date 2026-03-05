import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineService, WorkOrder } from '../../services/timeline'; 
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule], 
  templateUrl: './work-order-bar.html',
  styleUrls: ['./work-order-bar.scss']
})
export class WorkOrderBarComponent {
  @Input({ required: true }) order!: WorkOrder;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  timelineService = inject(TimelineService);
  actionItems = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', className: 'text-danger-item' } 
  ];

  selectedAction: string | null = null;
  

get computedLeft(): number {
  const daysFromStart = this.timelineService.getDaysBetween(this.timelineService.timelineStartDate, this.order.data.startDate);
  return daysFromStart * this.timelineService.pixelsPerDay();
}

get computedWidth(): number {
  const rawDays = this.timelineService.getDaysBetween(this.order.data.startDate, this.order.data.endDate);
  
  const durationDays = rawDays + 1; 
  
  return Math.max(1, durationDays) * this.timelineService.pixelsPerDay();
}

onActionSelect(event: any) {
    if (!event) return;
    
    if (event.id === 'edit') this.edit.emit();
    if (event.id === 'delete') this.delete.emit();

    setTimeout(() => this.selectedAction = null);
  }

  onToggle(isOpen: boolean) {
    if (isOpen) {
      document.body.classList.add('dropdown-active');
    } else {
      document.body.classList.remove('dropdown-active');
      
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }
}