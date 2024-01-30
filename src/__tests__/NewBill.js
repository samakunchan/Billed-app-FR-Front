/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import router from '../app/Router.js';
import userEvent from '@testing-library/user-event';
import NewBill from '../containers/NewBill.js';
import mockStore from '../__mocks__/store.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    let onNavigate;
    let logMock;
    beforeEach(() => {
      logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a.test',
          }),
      );

      onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    })

    test('Then bill icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon).toBeTruthy();
    });

    test('Then it should render a the new bill page', async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(html).toBeTruthy();
    });

    test('Then it should render a the new bill page', async () => {
      await waitFor(() => screen.getByTestId('form-new-bill'));
      const form = screen.getByTestId('form-new-bill');
      expect(form).toBeTruthy();
    });

    test('Then Employee should be able to upload a new document', async () => {
      await waitFor(() => screen.getByTestId(`file`));
      const uploadBtn = screen.getByTestId(`file`);
      expect(uploadBtn).toBeTruthy();
      const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage});
      newBill.file = {
        files: [new File([''], 'filename', {type: 'image/png'})]
      };


      const handleUploadFile = jest.fn();
      uploadBtn.addEventListener('click', handleUploadFile);
      userEvent.click(uploadBtn);
      expect(handleUploadFile).toHaveBeenCalled();

      const isCorrectFormat = newBill.isPicture('image/jpeg');
      expect(isCorrectFormat).toBeTruthy();

      const mockEvent = { preventDefault: jest.fn(), target: { value: 'filename'}, type: 'image/png' };
      newBill.handleChangeFile(mockEvent);

      const createdBill = await mockStore.bills().create({});
      expect(createdBill).toBeTruthy();
      expect(createdBill.key).toEqual('1234');
      expect(createdBill.fileUrl).toEqual('https://localhost:3456/images/test.jpg');

    });

    test('Then Employee should be able to submit the form', async () => {
      await waitFor(() => screen.getByTestId(`form-new-bill`));
      const submitBtn = screen.getByTestId(`form-new-bill`);
      expect(submitBtn).toBeTruthy();

      const handleSubmitForm = jest.fn();
      submitBtn.addEventListener('click', handleSubmitForm);
      userEvent.click(submitBtn);
      expect(handleSubmitForm).toHaveBeenCalled();

      const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage});
      const mockEventSubmit = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation(() => ({value: ''}))
        }
      };

      await newBill.handleSubmit(mockEventSubmit);
      expect(mockEventSubmit.preventDefault).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST
describe('Given I am a user connected as an Employee and connected in NewBill Page', () => {
  describe('When I am create a new bill', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills');
      localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
    })
    test('Then return successul response', async () => {
      const updateBill = await mockStore.bills().update({});
      expect(updateBill).toBeTruthy();
      expect(updateBill.id).toEqual('47qAXb6fIm2zOKkLzMro');
      expect(updateBill.status).toEqual('pending');
      expect(updateBill.email).toEqual('a@a');
    });

    test('Then return failure response', async () => {
      const billsSpy = jest.spyOn(mockStore.bills(), 'update').mockRejectedValue(new Error('Erreur 400'));
      try {
        await mockStore.bills().update({});
      } catch (error) {
        expect(error).toEqual(new Error('Erreur 400'));
      }

      expect(billsSpy).toHaveBeenCalled();
    });
  });
});
