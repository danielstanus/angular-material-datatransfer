import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { ApiService, LoggerService, TestItem } from './services';
import { DecimalByteUnitUtil } from './utils';
import { DatatransferFacade } from './facades';
import { DatatransferFacadeFactory } from './factories';
import { DecimalByteUnit } from './enums';

import * as Resumable from 'resumablejs';
import * as _ from 'underscore';

import '../style/app.scss';
import '../style/angular-material-theme.scss';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  datatransferFacade: DatatransferFacade;
  color = 'primary';
  mode = 'determinate';
  value = 50;
  bufferValue = 75;

  options = {
    pagination: {
      rppOptions: [5, 10, 15]
    }
  };

  private items = this.api.testItems;
  paginatedItems: any = [];
  testItem0 = this.items[0];

  r = undefined;

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private datatransferFacadeFactory: DatatransferFacadeFactory,
    private logger: LoggerService, private decimalByteUnitUtil: DecimalByteUnitUtil) {
    // Update the value for the progress-bar on an interval.
/*    setInterval(() => {
      this.testItem0.progress = (this.testItem0.progress + Math.floor(Math.random() * 4) + 1) % 100;
    }, 200);*/
    this.datatransferFacade = datatransferFacadeFactory.createDatatransferFacade();
    this.initResumable();
  }

  ngOnInit() {
    let dropzoneElement = document.getElementById('dropzoneElement');
    this.logger.log(dropzoneElement);
    this.r.assignBrowse(dropzoneElement);
    this.r.assignDrop(dropzoneElement);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Uploading':
        return 'fa fa-arrow-circle-o-up';
      case 'Downloading':
        return 'fa fa-arrow-circle-o-down';
      case 'Failed':
        return 'fa fa-exclamation-circle';
      case 'Queued':
        return 'fa fa-circle-o';
      default:
        return '';
    }
  }

  calculateProgressSize(item): number {
    return Number((item.progress / 100 * item.size).toFixed(2));
  }

  toggleAll(checked: boolean): void {
    this.paginatedItems.forEach(element => {
      element.isSelected = checked;
    });
  }

  showPath(index: number): boolean {
    if (index > 0 && this.items.length > index) {
      let currentPath = this.items[index].path;
      // switch (currentPath) {
      //   case undefined:
      //   case '':
      //   case '\\':
      //   case '/':
      //     return false;
      // }
      // don't show if previous path is same as current
      return this.items[index - 1].path !== currentPath;
    }
    return true;
  }

  initResumable(): void {
    this.r = new Resumable({
      target: '/echo/json/',
      query: {},
      maxChunkRetries: 2,
      maxFiles: 10,
      prioritizeFirstAndLastChunk: true,
      simultaneousUploads: 2,
      chunkSize: 1 * 1024 * 1024
    });

    this.r.on('fileAdded', function (file, event) {
      this.logger.log(file);
      let convertResult: [DecimalByteUnit, number] = this.decimalByteUnitUtil.toHumanReadable(file.size, DecimalByteUnit.Byte);
      let newItem: TestItem = {
        'name': file.fileName,
        'path': file.relativePath.substr(0, file.relativePath.length - file.fileName.length),
        'size': convertResult[1],
        'sizeUnit': DecimalByteUnit[convertResult[0]],
        'transferType': 'Upload',
        'status': 'Queued',
        'progress': 0
      };

      this.items.push(newItem);
    }.bind(this));
    this.r.on('fileSuccess', function (file, message) {

    });
    this.r.on('fileError', function (file, message) {

    });
  }

  testFn(): void {
    this.items.length = 0;
    this.r.files.length = 0;
    this.logger.log(this.r);
  }

  paginateItems(event: any): void {
    // this.logger.log('startIndex: ' + event.startIndex + ' endIndex: ' + event.endIndex);
    setTimeout(() => {
      this.paginatedItems = this.items.slice(event.startIndex, event.endIndex);
    }, 1);

    // batch actions md-menu not working anymore when calling detectChanges of ChangeDetectorRef
    // this.cdr.detectChanges();
  }
}
