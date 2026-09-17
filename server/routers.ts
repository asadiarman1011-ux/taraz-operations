import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, permissionProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { authenticateEmployee, createActivity, createCustomer, createEmployee, createInventoryItem, createInventoryMovement, createOrder, exportDatabase, getOrderDetails, listActivities, listCustomers, listInventoryItems, listInventoryMovements, listOrderHistory, listOrders, listRestoreHistory, listUsers, restoreDatabase, softDeleteInventoryMovement, updateCustomer, updateInventoryItem, updateInventoryMovement, updateOrder, updateUser } from "./db";

export const customerInput=z.object({name:z.string().min(1),phone:z.string().min(1),business:z.string().default(""),city:z.string().default(""),address:z.string().default(""),lat:z.number().nullable().optional(),lng:z.number().nullable().optional(),status:z.enum(["ثابت","غیر ثابت","نیاز به پیگیری","در حال پیگیری"]).default("غیر ثابت"),note:z.string().nullable().optional()});
const orderInput=z.object({customerId:z.number().int(),jalaliDate:z.string().min(1),address:z.string().default(""),lat:z.number().nullable().optional(),lng:z.number().nullable().optional(),itemsJson:z.string(),total:z.number().int(),notes:z.string().optional(),status:z.enum(["pending","delivered"]).default("pending"),deliveryMethod:z.string().max(80).nullable().optional(),deliveryCost:z.number().int().nonnegative().nullable().optional(),deliveryAt:z.coerce.date().nullable().optional(),deliveryNote:z.string().nullable().optional()});
export const appRouter=router({
  system:systemRouter,
  auth:router({me:publicProcedure.query(opts=>opts.ctx.user),logout:publicProcedure.mutation(({ctx})=>{const cookieOptions=getSessionCookieOptions(ctx.req);ctx.res.clearCookie(COOKIE_NAME,{...cookieOptions,maxAge:-1});return{success:true} as const}),login:publicProcedure.input(z.object({username:z.string().min(3).max(80),password:z.string().min(6).max(200)})).mutation(async({input,ctx})=>{const user=await authenticateEmployee(input.username,input.password);if(!user)throw new Error("نام کاربری یا رمز عبور نادرست است.");const token=await sdk.createLocalSessionToken(user.openId,user.name||user.username||"کارمند");ctx.res.cookie(COOKIE_NAME,token,getSessionCookieOptions(ctx.req));return user;}),register:publicProcedure.input(z.object({name:z.string().min(2).max(160),jobTitle:z.string().min(2).max(120),username:z.string().regex(/^[a-zA-Z0-9_.-]{3,80}$/),password:z.string().min(6).max(200)})).mutation(({input})=>createEmployee(input))}),
  crm:router({
    customers:publicProcedure.query(()=>listCustomers()),
    createCustomer:publicProcedure.input(customerInput).mutation(({input})=>createCustomer(input)),
    updateCustomer:publicProcedure.input(z.object({id:z.number().int(),data:customerInput.partial()})).mutation(({input})=>updateCustomer(input.id,input.data)),
    orders:publicProcedure.query(()=>listOrders()),
    orderDetails:publicProcedure.input(z.object({id:z.number().int()})).query(({input})=>getOrderDetails(input.id)),
    orderHistory:publicProcedure.input(z.object({orderId:z.number().int()})).query(({input})=>listOrderHistory(input.orderId)),
    createOrder:publicProcedure.input(orderInput).mutation(({input})=>createOrder(input)),
    updateOrder:publicProcedure.input(z.object({id:z.number().int(),data:orderInput.partial()})).mutation(({input})=>updateOrder(input.id,input.data))
  }),
  activities:router({list:publicProcedure.query(()=>listActivities()),create:publicProcedure.input(z.object({text:z.string().min(1).max(255)})).mutation(({input})=>createActivity(input.text))}),
  data:router({backup:publicProcedure.query(()=>exportDatabase()),restoreHistory:publicProcedure.query(()=>listRestoreHistory()),restore:publicProcedure.input(z.object({backup:z.string().min(10)})).mutation(({input,ctx})=>restoreDatabase(JSON.parse(input.backup),{userOpenId:ctx.user?.openId??null,userName:ctx.user?.name||ctx.user?.email||"کاربر ناشناس"}))}),
  inventory:router({
    list:permissionProcedure("inventory.view").query(()=>listInventoryItems()),
    create:permissionProcedure("inventory.edit").input(z.object({kind:z.enum(["garment","material"]),dataJson:z.string()})).mutation(({input})=>createInventoryItem(input)),
    update:permissionProcedure("inventory.edit").input(z.object({id:z.number().int(),data:z.object({kind:z.enum(["garment","material"]).optional(),dataJson:z.string().optional()})})).mutation(({input})=>updateInventoryItem(input.id,input.data)),
    movements:permissionProcedure("inventory.history").input(z.object({inventoryItemId:z.number().int()})).query(({input})=>listInventoryMovements(input.inventoryItemId)),
    addMovement:permissionProcedure("inventory.movements").input(z.object({inventoryItemId:z.number().int(),branchPath:z.string().max(255),direction:z.enum(["in","out","adjustment"]),quantity:z.number().int().positive(),previousQuantity:z.number().int().nullable().optional(),unit:z.string().max(40),note:z.string().nullable().optional()})).mutation(({input})=>createInventoryMovement(input)),
    editMovement:permissionProcedure("inventory.movements").input(z.object({id:z.number().int(),data:z.object({branchPath:z.string().max(255).optional(),direction:z.enum(["in","out","adjustment"]).optional(),quantity:z.number().int().positive().optional(),unit:z.string().max(40).optional(),note:z.string().nullable().optional(),previousQuantity:z.number().int().nullable().optional(),changeReason:z.string().min(3)} )})).mutation(({input})=>updateInventoryMovement(input.id,input.data)),
    deleteMovement:permissionProcedure("inventory.movements").input(z.object({id:z.number().int(),changeReason:z.string().min(3)})).mutation(({input})=>softDeleteInventoryMovement(input.id,input.changeReason))
  }),
  users:router({list:adminProcedure.query(()=>listUsers()),update:adminProcedure.input(z.object({id:z.number().int(),data:z.object({role:z.enum(["user","admin"]).optional(),permissionsJson:z.string().nullable().optional()})})).mutation(({input})=>updateUser(input.id,input.data))})
});
export type AppRouter=typeof appRouter;
