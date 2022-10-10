import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
    ChromeService,
    GlobalService,
    NeonService,
    AssetState,
    SettingState,
} from './core';
import { MatDialog } from '@angular/material/dialog';
import { Wallet as Wallet2 } from '@cityofzion/neon-core/lib/wallet';
import { Wallet as Wallet3 } from '@cityofzion/neon-core-neo3/lib/wallet';
import { EVENT } from '@/models/dapi';
import { PopupConfirmDialogComponent } from '@popup/_dialogs';
import { STORAGE_NAME } from './popup/_lib';

@Component({
    selector: 'neo-line',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    public walletArr: Array<Wallet2 | Wallet3>;
    public wallet: Wallet2 | Wallet3;
    public address: string;
    public hideNav: boolean = true;
    public walletIsOpen: boolean = false;
    public net: string;
    public hideNav404: boolean = false;

    constructor(
        private router: Router,
        private chrome: ChromeService,
        private global: GlobalService,
        private neon: NeonService,
        private dialog: MatDialog,
        private assetSer: AssetState,
        private neonService: NeonService,
        private settingState: SettingState
    ) {
        this.chrome.getStorage(STORAGE_NAME.lang).subscribe((res) => {
            this.settingState.changLang(res);
        });
        this.router.events.subscribe((event) => {
            this.hideNav404 = false;
            this.global.$404.subscribe(() => {
                this.hideNav404 = true;
            });
            // if (event instanceof NavigationEnd) {
            //     this.hideNav =
            //         event.url.startsWith('/popup') ||
            //         event.url.startsWith('/login');
            // }
        });
        this.global.walletListen().subscribe((res) => {
            switch (res) {
                case 'open':
                    this.walletIsOpen = true;
                    break;
                case 'close':
                    this.walletIsOpen = false;
                    break;
            }
        });
        this.neon.walletIsOpen().subscribe((res) => {
            this.global.$wallet.next(res ? 'open' : 'close');
        });
        this.neon.walletSub().subscribe(() => {
            this.wallet = this.neon.wallet;
            this.walletArr = this.neon.walletArr;
            this.address = this.neon.address;
        });
        if (localStorage.getItem('theme')) {
            const body = document.getElementsByTagName('body')[0];
            body.setAttribute(
                'data-theme-style',
                localStorage.getItem('theme')
            );
        }
    }

    public modifyNet(net: string) {}

    public isActivityWallet(w: Wallet2 | Wallet3) {
        if (w.accounts[0].address === this.wallet.accounts[0].address) {
            return true;
        } else {
            return false;
        }
    }

    public chooseAccount(w: Wallet2 | Wallet3) {
        if (this.isActivityWallet(w)) {
            return;
        } else {
            this.wallet = this.neon.parseWallet(w);
            this.chrome.setWallet(this.wallet.export());
            location.href = `index.html`;
        }
    }
    public closeWallet() {
        this.dialog
            .open(PopupConfirmDialogComponent, {
                data: 'logoutTip',
                panelClass: 'custom-dialog-panel',
            })
            .afterClosed()
            .subscribe((confirm) => {
                if (confirm) {
                    this.chrome.setLogin(true);
                    this.router.navigateByUrl('/login');
                }
            });
    }
}
