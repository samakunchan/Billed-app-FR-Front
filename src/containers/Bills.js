import { ROUTES_PATH } from '../constants/routes.js';
import { formatDate, formatStatus } from '../app/format.js';
import Logout from './Logout.js';

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.listenToCreateBill();
    this.listenToShowPreview();
    this.handleLogout(localStorage);
  }

  listenToCreateBill() {
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill);
  }

  listenToShowPreview() {
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye) {
      iconEye.forEach((icon) => {
        icon.addEventListener('click', () => this.handleClickIconEye(icon));
      });
    }
  }

  handleLogout(localStorage) {
    return new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill']);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute('data-bill-url');
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5);
    $('#modaleFile')
      .find('.modal-body')
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`,
      );
    $('#modaleFile').modal('show');
  };

  getBills = () => {
    if (this.store) {
      return this.store.bills().list().then(this.getResponseBills);
    }
  };

  getResponseBills(responseBills) {
    const bills = responseBills.map((bill) => {
      try {
        return {
          ...bill,
          date: formatDate(bill.date),
          status: formatStatus(bill.status),
        };
      } catch (e) {
        // if for some reason, corrupted data was introduced, we manage here failing formatDate function
        // log the error and return unformatted date in that case
        console.log(e, 'for', bill);
        return {
          ...bill,
          date: bill.date,
          status: formatStatus(bill.status),
        };
      }
    });
    console.log('length', bills.length);
    return bills;
  }
}
