import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app.route';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ShareModule } from './share';
import { PopupModule } from './popup';
import { N404Module } from './404';
import { CoreModule } from './core';
import { PopupNotificationModule } from './popup/notification/notification.module';
import { TransferModule } from './transfer/transfer.module';
import { LedgerModule } from './ledger/ledger.module';

// #region Startup Service
import { StartupService } from './core';
import { APP_INITIALIZER } from '@angular/core';

function StartupServiceFactory(startupService: StartupService) {
    return () => startupService.load();
}
const APPINIT_PROVIDES = [
    StartupService,
    {
        provide: APP_INITIALIZER,
        useFactory: StartupServiceFactory,
        deps: [StartupService],
        multi: true
    }
];
// #endregion

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        CoreModule,
        ShareModule,
        PopupModule,
        TransferModule,
        LedgerModule,
        PopupNotificationModule,
        N404Module,
    ],
    providers: [...APPINIT_PROVIDES],
    bootstrap: [AppComponent],
    entryComponents: [],
})
export class AppModule {}
