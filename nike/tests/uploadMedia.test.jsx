import axios from 'axios';
import { prepareMediaData } from '../src/utils/uploadMedia';
jest.mock('axios', () => ({ post: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test('file bytes go directly to Cloudinary and only signed references reach the product API', async () => {
  const file = new File(['image-content'], 'shoe.png', { type: 'image/png' });
  const form = new FormData(); form.append('name', 'Shoe'); form.append('variants', '[]'); form.append('featuredImg', file);
  axios.post.mockResolvedValueOnce({ data: { cloud_name: 'test-cloud', api_key: 'public-key', timestamp: 123, folder: 'nike/user/album', signature: 'request-signature' } }).mockResolvedValueOnce({ data: { public_id: 'nike/user/album/photo', version: 456, signature: 'response-signature', format: 'png' } });
  const result = await prepareMediaData(form, 'test-token', 'product');
  expect(axios.post.mock.calls[0][0]).toBe('/api/media/sign');
  expect(axios.post.mock.calls[0][2].headers.Authorization).toBe('Bearer test-token');
  expect(axios.post.mock.calls[1][0]).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/upload');
  expect(axios.post.mock.calls[1][1].get('file')).toBe(file);
  expect(result.name).toBe('Shoe'); expect(result.variants).toBe('[]'); expect(result.featuredImg).toBeUndefined();
  expect(result.uploadedFiles[0]).toEqual({ fieldname: 'featuredImg', public_id: 'nike/user/album/photo', version: 456, signature: 'response-signature', format: 'png' });
});
test('forms without new images retain their fields without calling an upload API', async () => {
  const form = new FormData(); form.append('rating', '5'); form.append('comment', 'Great');
  expect(await prepareMediaData(form, 'test-token', 'review')).toEqual({ rating: '5', comment: 'Great', uploadedFiles: [] });
  expect(axios.post).not.toHaveBeenCalled();
});
