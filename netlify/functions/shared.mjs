import {getStore} from '@netlify/blobs';
import {createHandler} from './lib/shared-handler.cjs';
const handler=createHandler(()=>getStore({name:'mfg-shared-assistant',consistency:'strong'}));
// Native Netlify Functions initialize Blobs, including the strongly consistent endpoint.
export default async function(request) {
 const event={httpMethod:request.method,headers:Object.fromEntries(request.headers),body:request.method==='POST'?await request.text():null};
 const response=await handler(event);
 return new Response(response.body,{status:response.statusCode,headers:response.headers});
}
