import { CCAI } from '../ccai';
import { MMS } from '../sms/mms';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  getBaseUrl: () => 'https://core.cloudcontactai.com/api',
  getFilesBaseUrl: () => 'https://files.cloudcontactai.com',
  request: mockRequest,
} as unknown as CCAI;

const validAccount = { firstName: 'John', lastName: 'Doe', phone: '+15551234567' };
const mockSendResponse = { id: 'mms-1', campaignId: 'camp-1', status: 'sent' };

describe('MMS Service', () => {
  let mms: MMS;

  beforeEach(() => {
    jest.clearAllMocks();
    mms = new MMS(mockCcai);
    mockedAxios.post = jest.fn().mockResolvedValue({ data: mockSendResponse });
    mockedAxios.put = jest.fn().mockResolvedValue({ status: 200 });
    mockRequest.mockResolvedValue(mockSendResponse);
  });

  describe('send()', () => {
    it('should send MMS with a file key via axios POST', async () => {
      const result = await mms.send(
        'client-123/campaign/image.png',
        [validAccount],
        'Check this out!',
        'MMS Campaign'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://core.cloudcontactai.com/api/clients/client-123/campaigns/direct',
        expect.objectContaining({
          pictureFileKey: 'client-123/campaign/image.png',
          accounts: [validAccount],
          message: 'Check this out!',
          title: 'MMS Campaign',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer api-key-456' }),
        })
      );
      expect(result).toEqual(mockSendResponse);
    });

    it('should throw if accounts array is empty', async () => {
      await expect(mms.send('file-key', [], 'msg', 'title')).rejects.toThrow();
    });

    it('should throw if pictureFileKey is missing', async () => {
      await expect(mms.send('', [validAccount], 'msg', 'title')).rejects.toThrow();
    });

    it('should throw if message is missing', async () => {
      await expect(mms.send('file-key', [validAccount], '', 'title')).rejects.toThrow();
    });

    it('should throw if title is missing', async () => {
      await expect(mms.send('file-key', [validAccount], 'msg', '')).rejects.toThrow();
    });

    it('should throw if account is missing firstName', async () => {
      const invalidAccount = { firstName: '', lastName: 'Doe', phone: '+15551234567' };
      await expect(mms.send('file-key', [invalidAccount], 'msg', 'title')).rejects.toThrow();
    });

    it('should throw if account is missing lastName', async () => {
      const invalidAccount = { firstName: 'John', lastName: '', phone: '+15551234567' };
      await expect(mms.send('file-key', [invalidAccount], 'msg', 'title')).rejects.toThrow();
    });

    it('should throw if account is missing phone', async () => {
      const invalidAccount = { firstName: 'John', lastName: 'Doe', phone: '' };
      await expect(mms.send('file-key', [invalidAccount], 'msg', 'title')).rejects.toThrow();
    });

    it('should call onProgress callback when provided', async () => {
      const onProgress = jest.fn();
      await mms.send('file-key', [validAccount], 'msg', 'title', undefined, { onProgress });
      expect(onProgress).toHaveBeenCalledWith('Preparing to send MMS');
      expect(onProgress).toHaveBeenCalledWith('Sending MMS');
      expect(onProgress).toHaveBeenCalledWith('MMS sent successfully');
    });

    it('should include ForceNewCampaign header by default', async () => {
      await mms.send('file-key', [validAccount], 'msg', 'title');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({ ForceNewCampaign: 'true' }),
        })
      );
    });

    it('should not include ForceNewCampaign header when forceNewCampaign is false', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockSendResponse });
      await mms.send('file-key', [validAccount], 'msg', 'title', undefined, {}, false);
      const calls = mockedAxios.post.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall?.[2]).not.toHaveProperty('headers.ForceNewCampaign');
    });

    it('should call onProgress with error message on failure', async () => {
      const onProgress = jest.fn();
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        mms.send('file-key', [validAccount], 'msg', 'title', undefined, { onProgress })
      ).rejects.toThrow();
      expect(onProgress).toHaveBeenCalledWith('MMS sending failed');
    });

    it('should handle axios post error gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Request failed'));

      await expect(mms.send('file-key', [validAccount], 'msg', 'title')).rejects.toThrow(
        'Failed to send MMS'
      );
    });

    it('should map data and customData to wire format (data / messageData)', async () => {
      const account = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        data: { city: 'Miami', plan: 'premium' },
        customData: '{"source":"mms-test"}',
      };

      await mms.send('file-key', [account], 'Hello ${firstName} from ${city}!', 'Test');

      const postedBody = (mockedAxios.post as jest.Mock).mock.calls[0][1];
      const sentAccount = postedBody.accounts[0];
      expect(sentAccount.data).toEqual({ city: 'Miami', plan: 'premium' });
      expect(sentAccount.messageData).toBe('{"source":"mms-test"}');
      expect(sentAccount.customData).toBeUndefined();
    });
  });

  describe('sendSingle()', () => {
    it('should send MMS to a single recipient', async () => {
      const result = await mms.sendSingle(
        'client-123/campaign/image.png',
        'John',
        'Doe',
        '+15551234567',
        'Hello!',
        'MMS Test'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/clients/client-123/campaigns/direct'),
        expect.objectContaining({
          pictureFileKey: 'client-123/campaign/image.png',
          accounts: [{ firstName: 'John', lastName: 'Doe', phone: '+15551234567' }],
        }),
        expect.any(Object)
      );
      expect(result).toEqual(mockSendResponse);
    });
  });

  describe('getSignedUploadUrl()', () => {
    it('should get signed upload URL with fileName and fileType', async () => {
      const mockSignedUrlResponse = {
        signedS3Url: 'https://s3.example.com/signed-url',
        fileKey: 'client-123/campaign/test.jpg',
      };
      mockedAxios.post.mockResolvedValue({ data: mockSignedUrlResponse });

      const result = await mms.getSignedUploadUrl('test.jpg', 'image/jpeg');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://files.cloudcontactai.com/upload/url',
        expect.objectContaining({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
        }),
        expect.any(Object)
      );
      expect(result.signedS3Url).toBe('https://s3.example.com/signed-url');
    });

    it('should throw error if fileName is missing', async () => {
      await expect(mms.getSignedUploadUrl('', 'image/jpeg')).rejects.toThrow(
        'File name is required'
      );
    });

    it('should throw error if fileType is missing', async () => {
      await expect(mms.getSignedUploadUrl('test.jpg', '')).rejects.toThrow('File type is required');
    });

    it('should use custom fileBasePath when provided', async () => {
      const mockSignedUrlResponse = {
        signedS3Url: 'https://s3.example.com/custom-url',
        fileKey: 'client-123/custom/test.jpg',
      };
      mockedAxios.post.mockResolvedValue({ data: mockSignedUrlResponse });

      await mms.getSignedUploadUrl('test.jpg', 'image/jpeg', 'custom/path');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fileBasePath: 'custom/path',
        }),
        expect.any(Object)
      );
    });

    it('should include correct headers with API key', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { signedS3Url: 'https://s3.example.com/url' },
      });

      await mms.getSignedUploadUrl('test.jpg', 'image/jpeg');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer api-key-456',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error if response is missing signedS3Url', async () => {
      mockedAxios.post.mockResolvedValue({ data: { fileKey: 'test' } });

      await expect(mms.getSignedUploadUrl('test.jpg', 'image/jpeg')).rejects.toThrow(
        'Invalid response from upload URL API'
      );
    });

    it('should throw error if axios.post fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(mms.getSignedUploadUrl('test.jpg', 'image/jpeg')).rejects.toThrow(
        'Failed to get signed upload URL'
      );
    });
  });

  describe('checkFileUploaded()', () => {
    it('should return stored URL response when file exists', async () => {
      const storedResponse = { storedUrl: 'https://cdn.example.com/file.png' };
      mockRequest.mockResolvedValue(storedResponse);

      const result = await mms.checkFileUploaded('client-123/campaign/image.png');

      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        '/clients/client-123/storedUrl?fileKey=client-123/campaign/image.png'
      );
      expect(result).toEqual(storedResponse);
    });

    it('should return object with empty storedUrl when file not found', async () => {
      mockRequest.mockResolvedValue({ storedUrl: '' });
      const result = await mms.checkFileUploaded('nonexistent-key');
      expect(result).toEqual({ storedUrl: '' });
    });

    it('should return empty storedUrl object on request error', async () => {
      mockRequest.mockRejectedValue(new Error('Not found'));
      const result = await mms.checkFileUploaded('bad-key');
      expect(result).toEqual({ storedUrl: '' });
    });
  });
});
