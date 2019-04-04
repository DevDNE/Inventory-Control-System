import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatPaginator, MatTableDataSource, MatSort, MatDialog} from '@angular/material';

import { InventoryControlService } from '../inventory-control.service';
import {Device} from '../../shared/device.model';
import { Subscription } from 'rxjs';
import { DialogComponent } from '../dialog/dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-all-inv',
  templateUrl: './all-inv.component.html',
  styleUrls: ['./all-inv.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})


export class AllInvComponent implements OnInit, OnDestroy {
  private devicesSub: Subscription;
  INVENTORY_DATA: Device[] = [];

  // Heading for each cell can be modified here     , 'recieved', 'shipped', 'onhand', 'total', 'minimum'
  columnsToDisplay: string[] = ['brand', 'device', 'id'];
  displayedColumns: string[] = ['select', 'model', 'brand', 'device', 'id'];
  expandedDeviceGroup: Device | null;
  selection = new SelectionModel<Device>(true, []);
  dataSource = new MatTableDataSource<Device>(this.INVENTORY_DATA);
  nestedDisplayedColumns: string[] = ['select', 'traffic', 'condition', 'serial', 'rma', 'note'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private inventoryControlService: InventoryControlService, public dialog: MatDialog) {}

  ngOnInit() {
    this.getInventory();
  }

  ngOnDestroy() {
    this.devicesSub.unsubscribe();
  }

  getInventory() {
    // console.log(this.selection.selected[1]); Can get selected Rows by ID in Array of All Selected
    this.inventoryControlService.getInventory();
    this.devicesSub = this.inventoryControlService.getDeviceUpdateListener()
      .subscribe((devices: Device[]) => {
        this.INVENTORY_DATA = devices;
        this.dataSource.data = this.INVENTORY_DATA;
        console.log(this.dataSource.data);
    });
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.selection.clear();
  }

  deleteSelection() {
    if (this.selection.selected.length > 0) {
      this.selection.selected.forEach((device) => {
        this.inventoryControlService.deleteSelection(device.id);
      });
      console.log(this.selection.selected);
      this.selection.clear();
      this.getInventory();
    }
  }


  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(mode): void {
    this.inventoryControlService.mode = mode;
    console.log('Open Dialog ' + mode + ' Mode');
    if (this.selection.selected.length === 0 && mode === 'Update' || this.selection.selected.length > 1) {
      alert('No Selection Or More Than 1');
      return;
    }
    if (mode === 'Update') {
      console.log(this.selection.selected);
      this.inventoryControlService.selected = this.selection.selected;
    }
    const dialogRef = this.dialog.open(DialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      this.selection.clear();
      console.log('The dialog was closed');
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
    this.selection.clear() :
    this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Device): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.model + 1}`;
  }
}

/*
selectOption(id, content) {
  // Just Run Service Here & Pass ID. Switch Statement Would Be Used Inside Service
  switch (id) { // In Manipulate Inventory Service - ID Passed
    case 'Add':
      console.log(id); // Add Modal
      this.modalService.open(content, { centered: true, size: 'lg' });
      break;
    case 'Edit':
      console.log(id); // Edit Modal
      break;
    case 'Remove':
      console.log(id); // Remove Modal
      break;
    case 'Resync':
      this.inventoryControlService.getInventory();
      console.log(id); // Resync MongoDB All Inventory Database
      break;
    default:
      console.log('Error: No Selection');
*/
