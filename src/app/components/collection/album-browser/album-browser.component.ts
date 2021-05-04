import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Constants } from '../../../core/base/constants';
import { NativeElementProxy } from '../../../core/native-element-proxy';
import { AlbumModel } from '../../../services/album/album-model';
import { AlbumOrder } from '../album-order';
import { AlbumRow } from './album-row';
import { AlbumRowsGetter } from './album-rows-getter';

@Component({
    selector: 'app-album-browser',
    host: { style: 'display: block' },
    templateUrl: './album-browser.component.html',
    styleUrls: ['./album-browser.component.scss'],
})
export class AlbumBrowserComponent implements OnInit {
    private _albums: AlbumModel[] = [];
    private availableWidthInPixels: number;

    constructor(private albumRowsGetter: AlbumRowsGetter, private nativeElementProxy: NativeElementProxy) {}

    public albumOrderEnum: typeof AlbumOrder = AlbumOrder;
    public albumRows: AlbumRow[] = [];

    @ViewChild('albumBrowserElement') public albumBrowserElement: ElementRef;

    @Input() public activeAlbumOrder: AlbumOrder;
    @Output() public activeAlbumOrderChange: EventEmitter<AlbumOrder> = new EventEmitter<AlbumOrder>();

    @Input() public activeAlbum: AlbumModel;
    @Output() public activeAlbumChange: EventEmitter<AlbumModel> = new EventEmitter<AlbumModel>();

    public get albums(): AlbumModel[] {
        return this._albums;
    }

    @Input()
    public set albums(v: AlbumModel[]) {
        this._albums = v;
        this.fillAlbumRows();
    }

    public async ngOnInit(): Promise<void> {
        // HACK: we must wait for the view to be initialized because need the size of view elements.
        // Ideally, we could move this code to ngAfterViewInit(). Unfortunately, Angular in all their wisdom,
        // decided that a ExpressionChangedAfterItHasBeenCheckedError (only in DEV mode! Crazy.) is thrown
        // when code that changes template-bound values is executed in ngAfterViewInit().
        await this.nativeElementProxy.waitUnTilElementIsDefined(this.albumBrowserElement);

        fromEvent(window, 'resize')
            .pipe(debounceTime(Constants.albumsRedrawDelayMilliseconds))
            .subscribe((event: any) => {
                this.fillAlbumRowsIfAvailableWidthChanged();
            });

        fromEvent(document, 'mouseup')
            .pipe(debounceTime(Constants.albumsRedrawDelayMilliseconds))
            .subscribe((event: any) => {
                this.fillAlbumRowsIfAvailableWidthChanged();
            });

        this.fillAlbumRowsIfAvailableWidthChanged();
    }

    public setActiveAlbum(event: any, album: AlbumModel): void {
        if (event.ctrlKey) {
            this.activeAlbum = undefined;
        } else {
            this.activeAlbum = album;
        }

        this.activeAlbumChange.emit(this.activeAlbum);
    }

    public toggleAlbumOrder(): void {
        switch (this.activeAlbumOrder) {
            case AlbumOrder.byAlbumTitleAscending:
                this.activeAlbumOrder = AlbumOrder.byAlbumTitleDescending;
                break;
            case AlbumOrder.byAlbumTitleDescending:
                this.activeAlbumOrder = AlbumOrder.byDateAdded;
                break;
            case AlbumOrder.byDateAdded:
                this.activeAlbumOrder = AlbumOrder.byDateCreated;
                break;
            case AlbumOrder.byDateCreated:
                this.activeAlbumOrder = AlbumOrder.byAlbumArtist;
                break;
            case AlbumOrder.byAlbumArtist:
                this.activeAlbumOrder = AlbumOrder.byYearAscending;
                break;
            case AlbumOrder.byYearAscending:
                this.activeAlbumOrder = AlbumOrder.byYearDescending;
                break;
            case AlbumOrder.byYearDescending:
                this.activeAlbumOrder = AlbumOrder.byLastPlayed;
                break;
            case AlbumOrder.byLastPlayed:
                this.activeAlbumOrder = AlbumOrder.byAlbumTitleAscending;
                break;
            default: {
                this.activeAlbumOrder = AlbumOrder.byAlbumTitleAscending;
                break;
            }
        }

        this.activeAlbumOrderChange.emit(this.activeAlbumOrder);

        this.fillAlbumRows();
    }

    private fillAlbumRowsIfAvailableWidthChanged(): void {
        const newAvailableWidthInPixels: number = this.nativeElementProxy.getElementWidth(this.albumBrowserElement);

        if (newAvailableWidthInPixels === 0) {
            return;
        }

        if (this.availableWidthInPixels !== newAvailableWidthInPixels) {
            this.availableWidthInPixels = newAvailableWidthInPixels;
            this.albumRows = this.albumRowsGetter.getAlbumRows(this.availableWidthInPixels, this.activeAlbumOrder, this.albums);
        }
    }

    private fillAlbumRows(): void {
        const availableWidthInPixels: number = this.nativeElementProxy.getElementWidth(this.albumBrowserElement);

        if (availableWidthInPixels === 0) {
            return;
        }

        this.albumRows = this.albumRowsGetter.getAlbumRows(availableWidthInPixels, this.activeAlbumOrder, this.albums);
    }
}