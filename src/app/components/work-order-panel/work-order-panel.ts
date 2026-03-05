import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct, NgbDatepickerConfig, NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { TimelineService, WorkOrder } from '../../services/timeline';

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.html',
  styleUrls: ['./work-order-panel.scss']
})
export class WorkOrderPanelComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() selectedOrder: WorkOrder | null = null;
  @Input() prefilledWorkCenterId = '';
  @Input() defaultStartDate = '';
  @Output() closePanel = new EventEmitter<void>();

  timelineService = inject(TimelineService);
  fb = inject(FormBuilder);
  config = inject(NgbDatepickerConfig);

  calendar = inject(NgbCalendar);
  today: NgbDateStruct = this.calendar.getToday();
  
  form!: FormGroup;
  overlapError = false;

  statuses = [
    { id: 'open', label: 'Open' },
    { id: 'in-progress', label: 'In progress' },
    { id: 'complete', label: 'Complete' },
    { id: 'blocked', label: 'Blocked' }
  ];

  constructor() {
    this.config.navigation = 'select';
  }

  get minStartDate(): NgbDateStruct {
    return this.today; 
  }

  get minEndDate(): NgbDateStruct {
    const start = this.form?.get('startDate')?.value;
    const startNgb = start ? NgbDate.from(start) : null;
    const todayNgb = NgbDate.from(this.today)!;

    if (startNgb && startNgb.after(todayNgb)) {
      return this.calendar.getNext(startNgb, 'd', 1);
    }

    return this.calendar.getNext(todayNgb, 'd', 1);
  }

  ngOnInit() {
    const parseDate = (dStr: string | undefined): NgbDateStruct | null => {
      if (!dStr) return null;
      const parts = dStr.split('-');
      return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
    };

    const initialStart = this.mode === 'edit' ? parseDate(this.selectedOrder?.data.startDate) : null;
    const initialEnd = this.mode === 'edit' ? parseDate(this.selectedOrder?.data.endDate) : null;

    this.form = this.fb.group({
      name: [this.selectedOrder?.data.name || '', Validators.required],
      workCenterId: [this.selectedOrder?.data.workCenterId || this.prefilledWorkCenterId, Validators.required],
      status: [this.selectedOrder?.data.status || 'open', Validators.required],
      startDate: [initialStart, Validators.required], 
      endDate: [initialEnd, Validators.required]      
    });

    this.form.get('startDate')?.valueChanges.subscribe((newStart: NgbDateStruct) => {
      this.overlapError = false; 
      
      const currentEnd = this.form.get('endDate')?.value as NgbDateStruct;
      if (newStart && currentEnd) {
        const start = new Date(newStart.year, newStart.month - 1, newStart.day);
        const end = new Date(currentEnd.year, currentEnd.month - 1, currentEnd.day);
        
        if (end <= start) {
          this.form.patchValue({ endDate: this.calendar.getNext(NgbDate.from(newStart)!, 'd', 1) });
        }
      }
    });

    this.form.get('endDate')?.valueChanges.subscribe(() => {
      this.overlapError = false;
    });
  
  }

  isClosing = false;

  closeWithAnimation() {
    this.isClosing = true; 
    
    setTimeout(() => {
      this.closePanel.emit(); 
    }, 280); 
  }

  onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    
    const formatNgbDate = (d: NgbDateStruct) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    const startStr = formatNgbDate(val.startDate);
    const endStr = formatNgbDate(val.endDate);

    const hasOverlap = this.timelineService.hasOverlap(
      val.workCenterId, 
      startStr, 
      endStr, 
      this.mode === 'edit' ? this.selectedOrder!.docId : undefined
    );

    if (hasOverlap) {
      this.overlapError = true;
      return; 
    }

    const order: WorkOrder = {
      docId: this.mode === 'edit' ? this.selectedOrder!.docId : `wo_${Date.now()}`,
      docType: 'workOrder',
      data: { 
        name: val.name, 
        workCenterId: val.workCenterId, 
        status: val.status, 
        startDate: startStr, 
        endDate: endStr 
      }
    };

    this.timelineService.saveWorkOrder(order, this.mode);
    this.closePanel.emit();
  }
}