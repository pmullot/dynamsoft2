import { ScanService } from './services/scan.service';
import { ScanDialogComponent } from './components/shared/scan-dialog/scan-dialog.component';
import { MyMaterialModule } from './material.module';
import { BrowserModule,  } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [AppComponent, ScanDialogComponent ],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule, MyMaterialModule],
  entryComponents: [ ScanDialogComponent ],
  providers: [ ScanService ],
  bootstrap: [AppComponent]
})
export class AppModule {}
