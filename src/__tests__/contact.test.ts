import { CCAI } from '../ccai';
import { Contact } from '../contact/contact';

const mockRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  request: mockRequest,
} as unknown as CCAI;

const mockResponse = { contactId: 'contact-1', phone: '+15551234567', doNotText: true };

describe('Contact Service', () => {
  let contact: Contact;

  beforeEach(() => {
    jest.clearAllMocks();
    contact = new Contact(mockCcai);
    mockRequest.mockResolvedValue(mockResponse);
  });

  describe('setDoNotText()', () => {
    it('should opt-out a contact by phone', async () => {
      const result = await contact.setDoNotText(true, undefined, '+15551234567');

      expect(mockRequest).toHaveBeenCalledWith(
        'PUT',
        '/account/do-not-text',
        expect.objectContaining({
          clientId: 'client-123',
          doNotText: true,
          phone: '+15551234567',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should opt-in a contact by phone', async () => {
      mockRequest.mockResolvedValue({ ...mockResponse, doNotText: false });
      const result = await contact.setDoNotText(false, undefined, '+15551234567');

      expect(mockRequest).toHaveBeenCalledWith(
        'PUT',
        '/account/do-not-text',
        expect.objectContaining({ doNotText: false })
      );
      expect(result.doNotText).toBe(false);
    });

    it('should opt-out a contact by contactId', async () => {
      await contact.setDoNotText(true, 'contact-abc');

      expect(mockRequest).toHaveBeenCalledWith(
        'PUT',
        '/account/do-not-text',
        expect.objectContaining({
          clientId: 'client-123',
          doNotText: true,
          contactId: 'contact-abc',
        })
      );
    });

    it('should send request without contactId or phone if neither is provided', async () => {
      // Contact service does not validate — sends payload with only clientId + doNotText
      const result = await contact.setDoNotText(true);
      expect(mockRequest).toHaveBeenCalledWith(
        'PUT',
        '/account/do-not-text',
        expect.objectContaining({ clientId: 'client-123', doNotText: true })
      );
      expect(result).toBeDefined();
    });

    it('should include clientId in all requests', async () => {
      await contact.setDoNotText(true, undefined, '+15551234567');
      const payload = mockRequest.mock.calls[0][2] as Record<string, unknown>;
      expect(payload.clientId).toBe('client-123');
    });
  });
});
