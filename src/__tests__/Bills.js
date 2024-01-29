/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import { bills } from '../fixtures/bills';
import router from '../app/Router';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    let onNavigate;
    let logMock;
    beforeEach(() => {
      logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          }),
      );

      window.$ = jest.fn().mockImplementation(() => {
        return {
          modal: jest.fn(),
          click: jest.fn(),
          width: jest.fn(),
          find: jest.fn(() => $('#modaleFile')),
          html: jest.fn(),
        }
      });

      onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    })

    afterEach(() => {
      logMock.mockRestore();
    });

    test('Then bill icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon).toBeTruthy();
    });

    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test('Then each icon eye on bill should be able to be clicked', async () => {

      new Bills({document, onNavigate, store: null, localStorage});
      await waitFor(() => screen.getAllByTestId(`icon-eye`));
      const iconsEyes = screen.getAllByTestId(`icon-eye`);
      if (iconsEyes) {
        expect(iconsEyes).toBeTruthy();
      } else {
        expect(console.log).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('hello');
      }

      const handleClickEyeIcon = jest.fn();

      iconsEyes.forEach(icon => {
        icon.addEventListener('click', handleClickEyeIcon);
        userEvent.click(icon);
        icon.addEventListener('click', handleClickEyeIcon);
      })

      expect(handleClickEyeIcon).toHaveBeenCalled();

    });

    test('Then it should render a list of bills', async () => {
      const storedBills = await mockStore.bills().list();
      const bills = new Bills({document, onNavigate, store: null, localStorage});

      bills.getResponseBills(storedBills);
      expect(bills).toBeTruthy();
      expect(console.log).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("length", storedBills.length);
      return bills;
    });

    test('Then it should throw render a list of bills', async () => {

      const bills = new Bills({document, onNavigate, store: null, localStorage});

      bills.getResponseBills([{
        id: 1,
        amount: 100,
        status: 'Paid'
      }]);
      expect(bills).toBeTruthy();
      expect(console.log).toHaveBeenCalled();
      return bills;
    });

    test('Then Employee should be able to create a new bill', async () => {
      await waitFor(() => screen.getByTestId(`btn-new-bill`));
      const newBillBtn = screen.getByTestId(`btn-new-bill`);
      expect(newBillBtn).toBeTruthy();
      const bills = new Bills({document, onNavigate, store: null, localStorage});

      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      newBillBtn.addEventListener('click', handleClickNewBill);
      userEvent.click(newBillBtn);
      expect(handleClickNewBill).toHaveBeenCalled();
    });

  });
});

jest.mock('../app/store', () => mockStore);
// test d'intégration GET
describe('Given I am a user connected as an Employee', () => {
  describe('When I am on Bills Page', () => {
    test('fetches bills from mock API GET', async () => {
      localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText('Mes notes de frais'));
      const contentPending = await screen.getByText('Mes notes de frais');
      expect(contentPending).toBeTruthy();
    });
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills');
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({ type: 'Employee', email: 'a@a' }),
        );
        const root = document.createElement('div');
        root.setAttribute('id', 'root');
        document.body.appendChild(root);
        router();
      });
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});

