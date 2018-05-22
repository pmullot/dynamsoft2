import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ScanService } from './../../../services/scan.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatSelectChange } from '@angular/material';
import { Component, OnInit, Inject, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-scan-dialog',
  templateUrl: './scan-dialog.component.html',
  styleUrls: ['./scan-dialog.component.sass']
})
export class ScanDialogComponent implements OnInit, AfterViewInit {


  protected _scanService: ScanService;

  public init = false;
  public loading = false;
  public deviceCount: BehaviorSubject<number> = new BehaviorSubject(0);
  public deviceNames: BehaviorSubject<string[]>;
  public spinnerTitle: Observable<string>;
  public filePath =  '';
  public selectedImageIndex: Observable<number>;
  public selectedDevice: string;
  public progress: any;

  constructor(
    public dialogRef: MatDialogRef<ScanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) {

      this._scanService = data.scanService;
      this.selectedDevice = data.selectedDevice;
    }

  ngOnInit() {
    this.deviceNames = this._scanService.devices;
    this.selectedImageIndex = this._scanService.selectedImageIndex;
  }


  ngAfterViewInit() {
    setTimeout( async _ => {

      this.loading = true;
      try {
        this.init = await this._scanService.initDynamsoft();
        if ( this.init ) {
          this.refreshDevices(false);
        }
      } catch ( err ) {
        this.loading = false;
        console.error(err.message);
      }

    }, 100);

  }

  onCancelClick(): void {
    this._scanService.clearBuffer();
    this.dialogRef.close();
  }

  refreshDevices(force: boolean) {
    setTimeout( async _ => {
      this.loading = true;
      let c: number;
      try {
        c = await this._scanService.refreshDevices();
      } catch ( err ) {
        console.error(err.message);
      }
      this.deviceCount.next(c);
      if ( c === 1) {
        const deviceName = this.deviceNames.value[0];
        this.selectedDevice = deviceName;
        this._scanService.selectDevice(deviceName);
      }
      this.loading = false;

     }, 100);
  }

  onSelectDeviceChange(selChange: MatSelectChange) {
    this.selectedDevice = selChange.value;
    this._scanService.selectDevice(selChange.value);
  }

  scan() {
    this.loading = true;
    setTimeout( async _ => {
      try {
        const res = await this._scanService.scan();
        if ( !res ) {
          console.error('There has been a problem with your scan');
        }
      } catch ( errorString ) {
        console.error(errorString);
      } finally {
        this.loading = false;
      }
     }, 50);
  }

}
