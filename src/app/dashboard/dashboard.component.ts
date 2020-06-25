import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, Sort } from '@angular/material';
import { DatePipe } from '@angular/common';

export class OrderDataColumns {
  orderId: number;
  customerId: number;
  deliveryPincode: number;
  orderDate: string;
  items: string[] = [];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('csvUpload', { static: false }) csvUploadInput: ElementRef;

  orderTitleArray: any = [];
  orderDataArray: any = [];
  isMatSpinnerEnabled: boolean = false;
  hideInitialImportDiv: boolean = false;
  public filteredOrderDataArray = new MatTableDataSource();
  isCombinedSearchEnabled: boolean = false;
  searchBarInput: string = '';
  selectedDateInput: string = '';

  constructor() {
    this.filteredOrderDataArray.data = [];
  }

  ngAfterViewInit() {
    this.filteredOrderDataArray.paginator = this.paginator;
  }

  ngOnInit() {

  }

  onUpload(event: any) {
    this.hideInitialImportDiv = true;
    this.isMatSpinnerEnabled = true;
    let inputCsvObj = event.target.files[0];
    let fileReaderObj = new FileReader();
    fileReaderObj.readAsText(inputCsvObj);
    fileReaderObj.onload = () => {
      let orderDataObj = fileReaderObj.result;
      let orderArray = (<string>orderDataObj).split(/\r\n|\n/);
      this.orderTitleArray = (<string>orderArray[0]).split(',');
      this.prepareOrderDataForTable(orderArray);
    }
    this.csvUploadInput.nativeElement.value = '';
  }

  prepareOrderDataForTable(orderDataArray) {
    for (let indexInt = 1; indexInt < orderDataArray.length; indexInt++) {
      let orderRowArray = (<string>orderDataArray[indexInt]).split(',');
      let orderRowObj = new OrderDataColumns();
      orderRowObj.orderId = parseInt(orderRowArray[0].trim());
      orderRowObj.customerId = parseInt(orderRowArray[1].trim());
      orderRowObj.deliveryPincode = parseInt(orderRowArray[2].trim());
      orderRowObj.orderDate = orderRowArray[3].trim();
      orderRowArray[4].split(';').forEach(element => {
        if (element != '') orderRowObj.items.push(
          element.replace(':', '-').trim()
        );
      });
      this.orderDataArray.push(orderRowObj);
    }
    this.isMatSpinnerEnabled = false;
    this.filteredOrderDataArray.data = this.orderDataArray;
  }

  onSearchChange() {
    const filterValue = this.searchBarInput.toLowerCase();
    if (this.selectedDateInput != null && this.isCombinedSearchEnabled) {
      this.searchOrdersBySearchInput(filterValue, this.searchOrdersByDate(this.getFormattedDate().toLowerCase(), this.orderDataArray));
    } else {
      this.searchOrdersBySearchInput(filterValue, this.orderDataArray);
    }
  }

  onDateChange() {
    const filterValue = this.getFormattedDate().toLowerCase();
    if (this.searchBarInput.length > 0 && this.isCombinedSearchEnabled) {
      this.searchOrdersByDate(filterValue, this.searchOrdersBySearchInput(this.searchBarInput.toLowerCase(), this.orderDataArray));
    } else {
      this.searchOrdersByDate(filterValue, this.orderDataArray);
    }
  }

  searchOrdersBySearchInput(filterValue, orderDataArray) {
    return this.filteredOrderDataArray.data = orderDataArray.filter(order =>
      order.orderId.toString().toLowerCase().includes(filterValue) ||
      order.customerId.toString().toLowerCase().includes(filterValue) ||
      order.deliveryPincode.toString().toLowerCase().includes(filterValue) ||
      order.items.toString().toLowerCase().includes(filterValue)
    );
  }

  searchOrdersByDate(filterValue, orderDataArray) {
    return this.filteredOrderDataArray.data = orderDataArray.filter(order =>
      order.orderDate.toLowerCase().includes(filterValue)
    );
  }

  sortOrderData(sort: Sort) {
    if (!sort.active || sort.direction == '') {
      return;
    }

    this.filteredOrderDataArray.data = this.filteredOrderDataArray.data.sort((a, b) => {
      const isAscending = sort.direction == 'asc' ? true : false;
      switch (sort.active) {
        case 'orderId':
          return this.compareOrderEntries(a['orderId'], b['orderId'], isAscending);
        case 'customerId':
          return this.compareOrderEntries(a['customerId'], b['customerId'], isAscending);
        case 'deliveryPincode':
          return this.compareOrderEntries(a['deliveryPincode'], b['deliveryPincode'], isAscending);
        case 'orderDate':
          return this.compareOrderEntries(a['orderDate'], b['orderDate'], isAscending);
        case 'items':
          return this.compareOrderEntries(a['items'], b['items'], isAscending);
        default:
          return 0;
      }
    })
  }

  compareOrderEntries(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onCombinedSearchToggleChange() {
    this.isCombinedSearchEnabled = !this.isCombinedSearchEnabled;
  }

  onImportNewCsvClick($event) {
    if (this.orderDataArray.length != 0 && !confirm('Merge into existing data?')) {
      this.orderDataArray = [];
    }
    this.onUpload($event);
  }

  clearAll() {
    if (confirm('Nuke everything?')) {
      this.filteredOrderDataArray.data = [];
      this.orderDataArray = [];
    } else {
      return;
    }
  }

  clearSearchBarInput() {
    this.searchBarInput = '';
    this.searchOrdersByDate(this.getFormattedDate(), this.orderDataArray);
  }

  clearDatePickerInput() {
    this.selectedDateInput = '';
    this.searchOrdersBySearchInput(this.searchBarInput, this.orderDataArray);
  }

  getFormattedDate() {
    return this.selectedDateInput == '' ? '' : new DatePipe('en-US').transform(this.selectedDateInput, 'dd/MM/yyyy');
  }
  
}
