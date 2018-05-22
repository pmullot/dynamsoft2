
/// <reference types="dwt" />
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { environment } from './../../environments/environment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';



import { ScanDialogComponent } from './../components/shared/scan-dialog/scan-dialog.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA  } from '@angular/material';
import { take, tap, switchMap} from 'rxjs/operators';



import { Injectable } from '@angular/core';

@Injectable()
export class ScanService {

  protected _dwObject: WebTwain;
  protected _selectedDevice: string;
  protected _deviceSelected: boolean;
  protected _scanDialogRef: MatDialogRef<ScanDialogComponent>;
  protected _initialized = false;

  public devicesCount: BehaviorSubject<number> = new BehaviorSubject(0);
  public devices: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public selectedImageIndex: BehaviorSubject<number> = new BehaviorSubject(-1);


  protected setDevicesCount(value: number) {
    this.devicesCount.next(value);
    const _devices: string[] = [];

    if ( this._dwObject ) {
      for ( let n = 0; n < this.devicesCount.value; n++) {
        _devices.push( this._dwObject.GetSourceNameItems(n) );
      }
      this.devices.next(_devices);
    }
  }


  constructor( protected dialog: MatDialog ) {  }



  public initDynamsoft(): Promise<boolean> {
    return new Promise<boolean>((res, rej) => {
      if ( !this._initialized ) {
        Dynamsoft.WebTwainEnv.Load();
        Dynamsoft.WebTwainEnv.ProductKey = environment.Dynamsoft.apiKey;
        if (Dynamsoft.WebTwainEnv.Containers.length > 0 ) {
          Dynamsoft.WebTwainEnv.Containers[0].Height = '99%';
          Dynamsoft.WebTwainEnv.Containers[0].Width = '99%';
        }
        Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', _ =>  this.Dynamsoft_OnReady( res, rej ));

      } else {
        res(true);
      }
    });
  }




  protected Dynamsoft_OnReady( res, rej ): void {

    const dwo =  Dynamsoft.WebTwainEnv.GetWebTwain(Dynamsoft.WebTwainEnv.Containers[0].ContainerId);

      this.dwObjectCreated(dwo , res, rej );

  }

  protected dwObjectCreated(dwObject: WebTwain, res, rej ): void {
    try {
      this._dwObject = dwObject;

      this._dwObject.RegisterEvent('OnPostTransfer', () => {

      });

      this._dwObject.RegisterEvent('OnMouseClick', this._onImageSelected.bind(this));


      if ( Dynamsoft.Lib.env.bMac ) {
        this._dwObject.CloseSourceManager();
        this._dwObject.OpenSourceManager();
      }
      this._dwObject.AsyncMode = false;
      this._dwObject.IfShowUI = false;
      this._dwObject.IfShowIndicator = false;
      this._dwObject.IfShowProgressBar = false;
      this._dwObject.IfShowIndicator = false;
      this._dwObject.IfTiffMultiPage = true;
      this._dwObject.LogLevel = 1;

      this._initialized = true;
      res( true );
    } catch ( err ) {
      this._initialized = false;
      rej(false);
      throw err;
    }
  }

  protected _onImageSelected(sImageIndex: number) {
    this.selectedImageIndex.next(sImageIndex);
  }

  public refreshDevices( ): Promise<number> {
    return new Promise ( (res, rej) => {

      if ( this._dwObject ) {
        let c: number = this.devicesCount.value;
          setTimeout( _ => {
            try {
              // c = 0;
              c = this._dwObject.SourceCount;

              this.setDevicesCount(c);
              res(c);
            } catch ( err) {
              rej(err);
            }
          }, 50);

      } else {
        res(0);
      }

    });
  }

  public selectDevice(value: string) {
    if ( this._dwObject ) {
      const index = this.devices.value.indexOf(value);
      if ( index > -1 ) {
        this._deviceSelected = this._dwObject.SelectSourceByIndex(index);
      }
    }
  }

  public clearBuffer() {
    if ( this._dwObject ) {
      this._dwObject.RemoveAllImages();
    }
  }






  public scan(): Promise<any> {
    return new Promise ( (res, rej) => {
      function _onAcquireImageSuccess(value: any) {
        this._dwObject.CloseSource();
        this._onImageSelected(this._dwObject.CurrentImageIndexInBuffer);
        if ( this._dwObject.CurrentImageIndexInBuffer < 0 ) {

          rej(new Error('Error during scanning. Is the device powered up and connected?'));
        } else {
          res(true);
        }
      }

      function _onAcquireImageFailure(errCode: number, errString: string) {
        this._dwObject.CloseSource();

        rej(new Error(errString));
      }

      if ( this._deviceSelected ) {

        setTimeout ( _ => {
          try {
            const _open =  this._dwObject.OpenSource();
            if ( _open ) {
              const _obj: any = {};
              /*_obj.IfShowUI = false;
              _obj.PixelType = 2;
              _obj.Resolution = 600;
              _obj.IfFeederEnabled = false;
              _obj.IfDuplexEnabled = false;
              _obj.IfDisableSourceAfterAcquire = true;
              */

              const resu = this._dwObject.AcquireImage(
                                          {_obj},
                                          _onAcquireImageSuccess.bind(this),
                                          _onAcquireImageFailure.bind(this)
                                        );

            } else {

              rej(new Error('Can not connect to the device'));
            }
          } catch ( err ) {

            rej(err);
          }
        }, 50 );
      } else {

        rej(new Error('No device selected'));
      }
    });
  }

  public loadFile( path: string ) {

    function _loadSuccess(): void {
      console.log('file succesfully loaded');
    }

    function _loadFailure(errCode: number, errString: string ): void {
      console.error(errString);
    }

    if ( this._dwObject ) {
      this._dwObject.LoadImage( path , _loadSuccess, _loadFailure );
    }
  }

  public showScanningDialog( small: boolean = false ): Promise<any> {
    return new Promise(( resolve, reject ) => {

      this._scanDialogRef = this.dialog.open(ScanDialogComponent, {
        width: '66%',
        height: '75%',
        data: { scanService: this, selectedDevice: this._dwObject ? this._dwObject.CurrentSourceName : '' },
        disableClose: true,
        panelClass: 'scanDialogRootClass',
        id: 'scanDialog'
      });

      this._scanDialogRef.afterClosed().pipe(take(1)).subscribe( result => {
          // Store file somewhere
      });

    });
  }
}
