import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createActivity, createCustomer, createInventoryItem, createInventoryMovement, createOrder, getOrderDetails, listActivities, listCustomers, listInventoryItems, listInventoryMovements, listOrderHistory, listOrders, listUsers, updateCustomer, updateInventoryItem, updateOrder, updateUser } from "./db";

export const customerInput=z.object({name:z.string().min(1),phone:z.string().min(1),business:z.string().default(""),city:z.string().default(""),address:z.string().default(""),lat:z.number().nullable().optional(),lng:z.number().nullable().optional(),status:z.enum(["ثابت","غیر ثابت","نیاز به پیگیری","در حال پیگیری"]).default("غیر ثابت"),note:z.string().nullable().optional()});
const orderInput=z.object({customerId:z.number().int(),jalaliDate:z.string().min(1),address:z.string().default(""),lat:z.number().nullable().optional(),lng:z.number().nullable().optional(),itemsJson:z.string(),total:z.number().int(),notes:z.string().optional(),status:z.enum(["pending","delivered"]).default("pending"),deliveryMethod:z.string().max(80).nullable().optional(),deliveryCost:z.number().int().nonnegative().nullable().optional(),deliveryAt:z.coerce.date().nullable().optional(),deliveryNote:z.string().nullable().optional()});
export const appRouter=router({
  system:systemRouter,
  auth:router({me:publicProcedure.query(opts=>opts.ctx.user),logout:publicProcedure.mutation(({ctx})=>{const cookieOptions=getSessionCookieOptions(ctx.req);ctx.res.clearCookie(COOKIE_NAME,{...cookieOptions,maxAge:-1});return{success:true} as const})}),
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
  inventory:router({list:publicProcedure.query(()=>listInventoryItems()),create:publicProcedure.input(z.object({kind:z.enum(["garment","material"]),dataJson:z.string()})).mutation(({input})=>createInventoryItem(input)),update:publicProcedure.input(z.object({id:z.number().int(),data:z.object({kind:z.enum(["garment","material"]).optional(),dataJson:z.string().optional()})})).mutation(({input})=>updateInventoryItem(input.id,input.data)),movements:publicProcedure.input(z.object({inventoryItemId:z.number().int()})).query(({input})=>listInventoryMovements(input.inventoryItemId)),addMovement:publicProcedure.input(z.object({inventoryItemId:z.number().int(),branchPath:z.string().max(255),direction:z.enum(["in","out","adjustment"]),quantity:z.number().int().positive(),unit:z.string().max(40),note:z.string().nullable().optional()})).mutation(({input})=>createInventoryMovement(input))}),
  users:router({list:publicProcedure.query(()=>listUsers()),update:publicProcedure.input(z.object({id:z.number().int(),data:z.object({role:z.enum(["user","admin"]).optional(),permissionsJson:z.string().nullable().optional()})})).mutation(({input})=>updateUser(input.id,input.data))})
});
export type AppRouter=typeof appRouter;
