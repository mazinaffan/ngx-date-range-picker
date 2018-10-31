import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { isAfter,
         isBefore,
         isEqual,
         isWithinRange,
         format,
         getDaysInMonth,
         getDay,
         startOfToday,
         startOfYesterday,
         startOfDay,
         startOfMonth,
         endOfMonth,
         eachDay,
         subDays,
         addMonths,
         subMonths ,
         subYears,
         addYears } from 'date-fns';
import { Observable, of, fromEvent, Subscription, Subject } from 'rxjs';
import { Ranges } from './datepicker.model';

@Component({
  selector: 'ngx-date-range-picker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss']
})
export class DatepickerComponent implements OnInit, OnDestroy {
    @Output() selectedRange: EventEmitter<any> = new EventEmitter();
    @Input() minDate: string;
    @Input() maxDate: string;
    @Input() options: any;
    @Input() startDate: string;
    @Input() endDate: string;
    @Input() ranges: Ranges[];

    _options = {
        applyLabel: 'Apply',
        cancelLabel: 'Cancel',
        outputFormat: 'YYYY-MM-DD',
    };

    isEqual = isEqual;

    start: Date = null;
    end: Date = null;
    _hoverDate: Date = null;

    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    years = [];

    calendarView = 'days';
    showPicker = false;
    clickInside = false;

    presetRanges = [
        { label: 'Today', start: startOfToday(), end: startOfToday()},
        { label: 'Yesterday', start: startOfYesterday(), end: startOfYesterday()},
        { label: 'Last 3 Days', start: startOfDay(subDays(new Date(), 3)), end: startOfDay(subDays(new Date(), 1)) },
        { label: 'Last 7 Days', start: startOfDay(subDays(new Date(), 8)), end: startOfDay(subDays(new Date(), 1)) },
        { label: 'This Month', start: startOfMonth(new Date()), end: startOfDay(endOfMonth(new Date())) },
        { label: 'Last Month', start: startOfMonth(subMonths(new Date(), 1)), end: startOfDay(endOfMonth(subMonths(new Date(), 1))) }
    ];

    leftCalendarStart: Date;
    leftCalendarEnd: Date;
    leftCalendarDays: Date[];
    leftCalendarOffset = [];
    leftCalendarMonth: string;
    leftCalendarYear: string;

    rightCalendarStart: Date;
    rightCalendarEnd: Date;
    rightCalendarDays: Date[];
    rightCalendarOffset = [];
    rightCalendarMonth: string;
    rightCalendarYear: string;

    leftCalendarStart$ = new Subject();
    subscription: Subscription;

    constructor() {
    }

    @HostListener('click')
    clickedInside() {
        this.clickInside = true;
    }

    @HostListener('document:click')
    clickedOutside() {
        if (!this.clickInside) {
            this.cancel();
        }
        this.clickInside = false;
    }

    ngOnInit() {
        this.subscription = this.leftCalendarStart$.subscribe((date: Date) => {
            this.leftCalendarStart = date;
            this.leftCalendarEnd = endOfMonth(this.leftCalendarStart);
            this.leftCalendarDays = eachDay(this.leftCalendarStart, this.leftCalendarEnd);
            this.leftCalendarOffset = Array(getDay(this.leftCalendarStart));
            this.leftCalendarMonth = format(this.leftCalendarStart, 'MMMM');
            this.leftCalendarYear = format(this.leftCalendarStart, 'YYYY');

            this.rightCalendarStart = startOfMonth(this.leftCalendarStart.setMonth(this.leftCalendarStart.getMonth() + 1));
            this.rightCalendarEnd = endOfMonth(this.rightCalendarStart);
            this.rightCalendarDays = eachDay(this.rightCalendarStart, this.rightCalendarEnd);
            this.rightCalendarOffset = Array(getDay(this.rightCalendarStart));
            this.rightCalendarMonth = format(this.rightCalendarStart, 'MMMM');
            this.rightCalendarYear = format(this.rightCalendarStart, 'YYYY');

            const decadeStart = this.leftCalendarStart.getFullYear() - this.leftCalendarStart.getFullYear() % 10 + 1;
            this.years = Array(10).fill(decadeStart).map((y, k) => (y + k));
        });
        // on init set current display to current month
        this.leftCalendarStart$.next(startOfMonth(new Date()));

        // override options with user provided options
        this._options = {...this._options, ...this.options};

        // override presetRanges with user provide ranges
        // check for length > - 1 if user does not want to display ranges
        if (this.ranges && this.ranges.length > -1) {
            this.presetRanges = this.ranges;
        }

        // set initial start and end based on user input
        if (this.startDate && this.endDate) {
            // set current display to user start date month
            this.leftCalendarStart$.next(startOfMonth(this.startDate));
            this.start = new Date(this.startDate);
            this.end = new Date(this.endDate);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    setDate(d) {
        if (this.start && this.end) {
            this.end = null;
            this.start = new Date(d);
        } else {
            if (this.start && (isAfter(d, this.start) || isEqual(d, this.start))) {
                this.end = new Date(d);
            } else {
                this.start = new Date(d);
            }
        }
    }

    selectRange(range) {
        this.start = new Date(range.start);
        this.end = new Date(range.end);
        this.leftCalendarStart$.next(startOfMonth(this.start));
        this.calendarView = 'days';
    }

    inRange(d) {
        if (this.start && this.end) {
            return false;
        }

        if (this.start && isAfter(this.start, this._hoverDate)) {
            return false;
        }

        if (this.start && isWithinRange(d, this.start, this._hoverDate)) {
            return true;
        }
    }

    isSelectedRange(d) {
        if (this.start && this.end) {
            return isWithinRange(d, this.start, this.end);
        }
        return false;
    }

    mouseover(d) {
        this._hoverDate = d;
    }

    disabled(d) {
        if (this.minDate) {
            return isEqual(d, this.minDate) || isBefore(d, this.minDate);
        }

        if (this.maxDate) {
            return isEqual(d, this.maxDate) || isAfter(d, this.maxDate);
        }

        return false;
    }

    prevMonth() {
        this.leftCalendarStart$.next(startOfMonth(subMonths(this.leftCalendarStart, 2)));
    }

    nextMonth() {
        this.leftCalendarStart$.next(startOfMonth(addMonths(this.leftCalendarStart, 0)));
    }

    setMonth(month) {
        this.leftCalendarStart$.next(new Date(parseInt(this.leftCalendarYear, 10), this.months.indexOf(month), 1));
        this.calendarView = 'days';
    }

    prevYear() {
        this.leftCalendarYear = format(subYears(this.leftCalendarYear, 1), 'YYYY');
    }

    nextYear() {
        this.leftCalendarYear = format(addYears(this.leftCalendarYear, 1), 'YYYY');
    }

    setYear(year) {
        this.leftCalendarYear = year.toString();
        this.calendarView = 'months';
    }

    prevDecade() {
        this.years = this.years.map(y => (y - 10));
    }

    nextDecade() {
        this.years = this.years.map(y => (y + 10));
    }

    haveDates() {
        return Boolean(this.start && this.end);
    }

    buttonText(): string {
        return `${format(this.start, this._options.outputFormat)} - ${format(this.end, this._options.outputFormat)}`;
    }

    applyDates() {
        this.selectedRange.emit({start: format(this.start, this._options.outputFormat), end: format(this.end, this._options.outputFormat)});
        this.showPicker = false;
    }

    cancel() {
        this.start = this.startDate ? new Date(this.startDate) : null;
        this.end = this.endDate ? new Date(this.endDate) : null;
        this.showPicker = false;
    }
}
