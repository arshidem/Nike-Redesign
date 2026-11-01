import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Order from "../src/features/user/pages/Order";
const mockOrders=jest.fn();let mockToken='token';
jest.mock("../src/context/AppContext",()=>({useAppContext:()=>({backendUrl:'https://store.test',token:mockToken})}));
jest.mock("../src/features/user/services/orderServices",()=>({__esModule:true,default:()=>({getUserOrders:mockOrders})}));
jest.mock("../src/features/user/components/Footer",()=>()=>null);
const orders=[{_id:'order331231',createdAt:'2026-02-24T10:00:00Z',status:'processing',totalPrice:51619,items:[{title:'Nike Blazer',image:'https://images.test/shoe.avif'}]},{_id:'orderc5c6e4',createdAt:'2025-09-28T10:00:00Z',status:'delivered',totalPrice:14000,items:[]}];
const result={success:true,orders,statusCounts:{all:14,processing:13,delivered:1,shipped:0,cancelled:0},pagination:{totalPages:2,totalOrders:14}};
let host,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;mockToken='token';host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);mockOrders.mockReset().mockResolvedValue(result);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();jest.useRealTimers();});
const render=async()=>act(async()=>root.render(<MemoryRouter><Order/></MemoryRouter>));
const click=async selector=>act(async()=>host.querySelector(selector).click());
test('shows API status counts, truthful order totals, product images and order-detail destinations',async()=>{
 await render();expect(host.querySelector('.customer-orders-pills').textContent).toContain('All Orders (14)');expect(host.querySelector('.customer-order-card').getAttribute('href')).toBe('/orders/order331231');expect(host.querySelector('.customer-order-card img').src).toBe(orders[0].items[0].image);expect(host.querySelector('.customer-order-copy').textContent).toContain('51,619');expect(host.querySelectorAll('.customer-order-card img')[1].getAttribute('src')).toContain('image-unavailable');await click('.customer-orders-pagination button:last-child');expect(mockOrders).toHaveBeenLastCalledWith(2,10,{search:'',status:''});await click('.customer-orders-pills button:nth-child(2)');expect(mockOrders).toHaveBeenLastCalledWith(1,10,{search:'',status:'processing'});
});
test('search is debounced and passed to the server with a page reset',async()=>{
 jest.useFakeTimers();await render();await act(async()=>{const input=host.querySelector('.customer-orders-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Blazer');input.dispatchEvent(new Event('input',{bubbles:true}));});expect(mockOrders).toHaveBeenCalledTimes(1);await act(async()=>jest.advanceTimersByTime(300));expect(mockOrders).toHaveBeenLastCalledWith(1,10,{search:'Blazer',status:''});await click('[aria-label="Clear order search"]');expect(mockOrders).toHaveBeenLastCalledWith(1,10,{search:'',status:''});
});
test('failure keeps the common app bar and allows retry, rather than showing no orders',async()=>{
 mockOrders.mockResolvedValueOnce({success:false,error:'Connection failed'});await render();expect(host.querySelector('.customer-appbar')).not.toBeNull();expect(host.querySelector('[role="alert"]').textContent).toContain('Connection failed');await click('.customer-orders-empty button');expect(host.querySelectorAll('.customer-order-card')).toHaveLength(2);
});
test('signed-out customers are directed to sign in without fetching protected orders',async()=>{
 mockToken=null;await render();expect(mockOrders).not.toHaveBeenCalled();expect(host.querySelector('.customer-orders-empty a').getAttribute('href')).toBe('/signin');expect(host.querySelector('.customer-appbar')).not.toBeNull();
});
