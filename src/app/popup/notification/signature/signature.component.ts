import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    NeonService,
    ChromeService,
    GlobalService,
    LedgerService,
} from '@/app/core';
import { ERRORS, requestTarget } from '@/models/dapi';
import { wallet, u } from '@cityofzion/neon-js';
import { randomBytes } from 'crypto';
import { RpcNetwork, LedgerStatuses } from '../../_lib';
import { interval } from 'rxjs';

@Component({
    templateUrl: './signature.component.html',
    styleUrls: ['./signature.component.scss'],
})
export class PopupNoticeSignComponent implements OnInit {
    public address: string;
    public n2Network: RpcNetwork;
    public message: string;
    private messageID = 0;

    getStatusInterval;
    loading = false;
    loadingMsg = '';

    publicKey;
    randomSalt;
    constructor(
        private aRouter: ActivatedRoute,
        private neon: NeonService,
        private chrome: ChromeService,
        private global: GlobalService,
        private ledger: LedgerService
    ) {
        this.n2Network = this.global.n2Network;
    }

    ngOnInit() {
        this.address = this.neon.address;
        this.aRouter.queryParams.subscribe((params: any) => {
            this.messageID = params.messageID;
            this.message = params.message;
            window.onbeforeunload = () => {
                this.chrome.windowCallback({
                    error: ERRORS.CANCELLED,
                    return: requestTarget.SignMessage,
                    ID: this.messageID,
                });
            };
        });
    }

    public cancel() {
        this.chrome.windowCallback({
            error: ERRORS.CANCELLED,
            return: requestTarget.SignMessage,
            ID: this.messageID,
        });
        window.close();
    }

    public signature() {
        this.randomSalt = randomBytes(16).toString('hex');
        const parameterHexString = u.str2hexstring(this.randomSalt + this.message);
        const lengthHex = (parameterHexString.length / 2)
            .toString(16)
            .padStart(2, '0');
        const concatenatedString = lengthHex + parameterHexString;
        const serializedTransaction = '010001f0' + concatenatedString + '0000';
        this.getSignTx(serializedTransaction);
    }

    private sendMessage(tx) {
        const data = {
            publicKey: this.publicKey,
            data: tx,
            salt: this.randomSalt,
            message: this.message,
        };
        this.chrome.windowCallback({
            return: requestTarget.SignMessage,
            data,
            ID: this.messageID,
        });
        window.close();
    }

    private getLedgerStatus(tx) {
        this.ledger
            .getDeviceStatus(this.neon.currentWalletChainType)
            .then(async (res) => {
                this.loadingMsg = LedgerStatuses[res].msg;
                if (LedgerStatuses[res] === LedgerStatuses.READY) {
                    this.getStatusInterval.unsubscribe();
                    this.loadingMsg = 'signTheTransaction';
                    this.ledger
                        .getLedgerSignedTx(
                            tx,
                            this.neon.wallet,
                            this.neon.currentWalletChainType,
                            undefined,
                            true
                        )
                        .then((tx) => {
                            console.log(tx);
                            this.loading = false;
                            this.loadingMsg = '';
                            this.sendMessage(tx);
                        })
                        .catch((error) => {
                            this.loading = false;
                            this.loadingMsg = '';
                            this.global.snackBarTip(
                                'TransactionDeniedByUser',
                                error
                            );
                        });
                }
            });
    }

    private getSignTx(tx) {
        if (this.neon.wallet.accounts[0]?.extra?.ledgerSLIP44) {
            this.publicKey = this.neon.wallet.accounts[0]?.extra?.publicKey;
            this.loading = true;
            this.loadingMsg = LedgerStatuses.DISCONNECTED.msg;
            this.getLedgerStatus(tx);
            this.getStatusInterval = interval(5000).subscribe(() => {
                this.getLedgerStatus(tx);
            });
            return;
        }
        const wif =
            this.neon.WIFArr[
                this.neon.walletArr.findIndex(
                    (item) =>
                        item.accounts[0].address ===
                        this.neon.wallet.accounts[0].address
                )
            ];
        const privateKey = wallet.getPrivateKeyFromWIF(wif);
        this.publicKey = wallet.getPublicKeyFromPrivateKey(privateKey);
        this.sendMessage(wallet.sign(tx, privateKey));
    }
}
