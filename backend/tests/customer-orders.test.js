const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const moment=require('moment-timezone');
function adapter(){let query,countQuery,groupQuery,skip,limit;
 const chain={sort(){return this;},skip(value){skip=value;return this;},limit(value){limit=value;return this;},populate(){return this;},lean:async()=>[]};
 const Order={find(value){query=value;return chain;},countDocuments:async value=>{countQuery=value;return 12;},aggregate:async pipeline=>{groupQuery=pipeline[0].$match;return [{_id:'processing',count:10},{_id:'delivered',count:2}];}};
 const sandbox={exports:{},console:{error(){}},process:{env:{}},require:name=>name==='../models/Order'?Order:name==='moment-timezone'?moment:name==='../utils/checkoutQuote'?{}:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../controllers/orderController.js'),'utf8'),sandbox);
 return {async request(params={}){let body,status=200;const res={status(value){status=value;return this;},json(value){body=value;return this;}};await sandbox.exports.getUserOrders({query:params,user:{_id:'owner1'}},res);return {body,status,query,countQuery,groupQuery,skip,limit};}};
}
test('counts and pages stay scoped to the authenticated owner; status is excluded only from pill counts',async()=>{
 const result=await adapter().request({page:'2',limit:'5',status:'delivered'});assert.equal(result.query.user,'owner1');assert.equal(result.countQuery.user,'owner1');assert.equal(result.groupQuery.user,'owner1');assert.equal(result.query.status,'delivered');assert.equal(result.groupQuery.status,undefined);assert.equal(result.body.statusCounts.all,12);assert.equal(result.body.statusCounts.processing,10);assert.equal(result.skip,5);assert.equal(result.body.pagination.totalPages,3);
});
test('name, short ID and valid date search are applied before pagination and counts',async()=>{
 const byId=await adapter().request({search:'#331231'});assert.equal(byId.query.$or[1].$expr.$regexMatch.regex,'331231');assert.equal(byId.groupQuery.$or,byId.query.$or);
 const byDate=await adapter().request({search:'24 February 2026'});const dates=byDate.query.$or.find(item=>item.createdAt).createdAt;assert.equal(dates.$gte.toISOString(),'2026-02-23T18:30:00.000Z');assert.equal(dates.$lte.toISOString(),'2026-02-24T18:29:59.999Z');
 const literal=await adapter().request({search:'Nike [Dunk].*'});assert.equal(new RegExp(literal.query.$or[0]['items.title'].$regex,'i').test('Nike [Dunk].*'),true);assert.equal(new RegExp(literal.query.$or[0]['items.title'].$regex,'i').test('Nike Dunkxx'),false);
});
test('invalid statuses are rejected and pagination limits are bounded',async()=>{
 assert.equal((await adapter().request({status:'anything'})).status,400);const result=await adapter().request({page:'-4',limit:'10000'});assert.equal(result.skip,0);assert.equal(result.limit,50);
});
