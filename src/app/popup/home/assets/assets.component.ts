import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Asset, NEO } from '@/models/models';
import {
    GlobalService,
    AssetState,
    ChromeService,
    NeonService,
    UtilServiceState,
} from '@/app/core';
import { forkJoin } from 'rxjs';
import BigNumber from 'bignumber.js';
import { NEO3_CONTRACT } from '../../_lib';

@Component({
    selector: 'app-assets',
    templateUrl: 'assets.component.html',
    styleUrls: ['assets.component.scss'],
})
export class PopupAssetsComponent implements OnInit {
    @Input() public rateCurrency: string;
    @Output() backAsset = new EventEmitter();
    myAssets: Asset[];
    private networkId: number;
    isLoading = false;

    constructor(
        private asset: AssetState,
        private chrome: ChromeService,
        private neon: NeonService,
        private global: GlobalService,
        private util: UtilServiceState
    ) {}

    ngOnInit(): void {
        this.networkId =
            this.neon.currentWalletChainType === 'Neo2'
                ? this.global.n2Network.id
                : this.global.n3Network.id;
        this.getAssets();
    }

    getAssets() {
        this.isLoading = true;
        const getMoneyBalance = this.asset.getAddressBalances(
            this.neon.address
        );
        const getWatch = this.chrome.getWatch(
            this.networkId,
            this.neon.address
        );
        forkJoin([getMoneyBalance, getWatch]).subscribe((res) => {
            const [moneyAssets, watch] = [...res];
            let showAssets = [...moneyAssets];
            watch.forEach(async (item) => {
                const index = showAssets.findIndex(
                    (m) => m.asset_id === item.asset_id
                );
                if (index >= 0) {
                    if (item.watching === false) {
                        showAssets.splice(index, 1);
                    }
                } else {
                    if (item.watching === true) {
                        const balance = await this.asset.getAddressAssetBalance(
                            this.neon.address,
                            item.asset_id,
                            this.neon.currentWalletChainType
                        );
                        if (new BigNumber(balance).comparedTo(0) > 0) {
                            const decimals = await this.util.getAssetDecimals(
                                [item.asset_id],
                                this.neon.currentWalletChainType
                                );
                            item.balance = new BigNumber(balance)
                                .shiftedBy(-decimals[0])
                                .toFixed();
                        }
                        showAssets.push(item);
                    }
                }
            });
            this.myAssets = showAssets;
            this.getAssetsRate();
            let neoAsset;
            if (this.neon.currentWalletChainType === 'Neo2') {
                neoAsset = this.myAssets.find((m) => m.asset_id === NEO);
            } else {
                neoAsset = this.myAssets.find(
                    (m) => m.asset_id === NEO3_CONTRACT
                );
            }
            this.backAsset.emit(neoAsset);
            this.isLoading = false;
        });
    }
    async getAssetsRate() {
        for (let i = 0; i < this.myAssets.length; i++) {
            const item = this.myAssets[i];
            if (new BigNumber(item.balance).comparedTo(0) > 0) {
                const rate = await this.asset.getAssetRate(
                    item.symbol,
                    item.asset_id
                );
                if (rate) {
                    item.rateBalance = new BigNumber(item.balance)
                        .times(rate)
                        .toFixed();
                }
            }
        }
    }
}
