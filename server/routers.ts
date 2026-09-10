import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createCustomer, createOrder, listCustomers, listOrders, updateCustomer } from "./db";

export const customerInput = z.object({
  name: z.string().min(1), phone: z.string().min(1), business: z.string().default(""), city: z.string().default(""),
  address: z.string().default(""), lat: z.number().nullable().optional(), lng: z.number().nullable().optional(),
  status: z.enum(["ثابت", "غیر ثابت", "نیاز به پیگیری", "در حال پیگیری"]).default("غیر ثابت"), note: z.string().nullable().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  crm: router({
    customers: publicProcedure.query(() => listCustomers()),
    createCustomer: publicProcedure.input(customerInput).mutation(({ input }) => createCustomer(input)),
    updateCustomer: publicProcedure.input(z.object({ id: z.number().int(), data: customerInput.partial() })).mutation(({ input }) => updateCustomer(input.id, input.data)),
    orders: publicProcedure.query(() => listOrders()),
    createOrder: publicProcedure.input(z.object({
      customerId: z.number().int(), jalaliDate: z.string().min(1), address: z.string().default(""),
      lat: z.number().nullable().optional(), lng: z.number().nullable().optional(), itemsJson: z.string(), total: z.number().int(),
      notes: z.string().optional(), status: z.enum(["pending", "delivered"]).default("pending"),
    })).mutation(({ input }) => createOrder(input)),
  }),
});

export type AppRouter = typeof appRouter;
