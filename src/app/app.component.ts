import { Component } from '@angular/core';
import { ScanService } from './services/scan.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  constructor( protected _scanService: ScanService ) {}

  public scanDoc() {
    this._scanService.showScanningDialog();
  }
}
