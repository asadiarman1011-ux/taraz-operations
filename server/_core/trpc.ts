import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export type PermissionScope =
  | "inventory.view"
  | "inventory.edit"
  | "inventory.movements"
  | "inventory.history"
  | "reports.view"
  | "reports.export";

export function hasPermission(user: TrpcContext["user"], scope: PermissionScope) {
  if (!user) return false;
  if (user.role === "admin") return true;
  try {
    const permissions = user.permissionsJson ? JSON.parse(user.permissionsJson) : {};
    if (permissions[scope] === "edit" || permissions[scope] === "view") return true;
    if (scope.startsWith("inventory.") && permissions["انبار"] === "edit") return true;
    if (scope.startsWith("reports.") && permissions["گزارش‌ها"] === "edit") return true;
  } catch { /* malformed legacy permissions are treated as denied */ }
  return false;
}

export const permissionProcedure = (scope: PermissionScope) =>
  protectedProcedure.use(t.middleware(async ({ ctx, next }) => {
    if (!hasPermission(ctx.user, scope)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "شما به این عملیات دسترسی ندارید." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }));
