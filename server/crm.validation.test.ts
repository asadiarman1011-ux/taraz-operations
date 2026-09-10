import { describe, expect, it } from "vitest";
import { appRouter, customerInput } from "./routers";
import type { TrpcContext } from "./_core/context";

const caller = appRouter.createCaller({
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("crm input contracts", () => {
  it("requires a customer name and phone", async () => {
    await expect(caller.crm.createCustomer({ name: "", phone: "", business: "", city: "هر شهر", address: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts a free-text city field in the customer contract", () => {
    expect(customerInput.parse({ name: "مشتری آزمایشی", phone: "۰۹۱۲۰۰۰۰۰۰۰", business: "فروشگاه", city: "شهرستانی که در فهرست نیست", address: "" }).city).toBe("شهرستانی که در فهرست نیست");
  });

  it("rejects unsupported customer status values", async () => {
    await expect(caller.crm.updateCustomer({ id: 1, data: { status: "وضعیت نامعتبر" as never } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
