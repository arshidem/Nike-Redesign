import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useRouter } from 'next/router';
import { NavigationProvider, useLocation, useNavigate, useParams } from '../src/lib/navigation.jsx';
import legacyMedia from "../src/lib/legacyMedia.json";
import { mediaUrl } from '../src/utils/mediaUrl';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a> }));
let container, root, router;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); router = { asPath: '/product/shoe?color=black#sizes', query: { productSlug: 'shoe' }, push: jest.fn(), replace: jest.fn(), back: jest.fn() }; useRouter.mockReturnValue(router); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
function Probe() { const location = useLocation(), params = useParams(), navigate = useNavigate(); return <><output>{JSON.stringify({ location, params })}</output><button onClick={() => navigate('/account', { replace: true, state: { message: 'saved' } })}>Navigate</button><button onClick={() => navigate(-1)}>Back</button></>; }
test('Next navigation preserves pathname, query, hash, params, history and location state', async () => {
 await act(async () => root.render(<NavigationProvider><Probe /></NavigationProvider>));
 let value = JSON.parse(container.querySelector('output').textContent);
 expect(value.location.pathname).toBe('/product/shoe'); expect(value.location.search).toBe('?color=black'); expect(value.location.hash).toBe('#sizes'); expect(value.params.productSlug).toBe('shoe');
 await act(async () => container.querySelector('button').click()); expect(router.replace).toHaveBeenCalledWith('/account');
 value = JSON.parse(container.querySelector('output').textContent); expect(value.location.state.message).toBe('saved');
 await act(async () => container.querySelectorAll('button')[1].click()); expect(router.back).toHaveBeenCalled();
});
test('media URLs preserve cloud images and migrate legacy disk references to same-origin public assets', () => {
 expect(mediaUrl('https://res.cloudinary.com/cloud/image/upload/photo.png')).toBe('https://res.cloudinary.com/cloud/image/upload/photo.png');
 expect(mediaUrl('C:\\app\\uploads\\shoe.png')).toBe('/uploads/shoe.png');
 expect(mediaUrl('/assets/editorial/dunk.png')).toBe('/assets/editorial/dunk.png');
 expect(mediaUrl(`https://old-host.example/uploads/${legacyMedia[0]}`)).toBe(`/uploads/${legacyMedia[0]}`);
 expect(mediaUrl(null)).toBe('/assets/editorial/image-unavailable.svg');
});
