import { createTRPCRouter } from "./trpc";
import { productRouter } from './routers/product';
import { baseCodeRouter } from './routers/baseCode';
import { sizeCodeRouter } from './routers/sizeCode';
import { variantCodeRouter } from './routers/variantCode';
import { customerRouter } from './routers/customer';
import { blendingRouter } from './routers/blending';
import { tankRouter } from './routers/tank';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  products: productRouter,
  baseCode: baseCodeRouter,
  sizeCode: sizeCodeRouter,
  variantCode: variantCodeRouter,
  customers: customerRouter,
  blending: blendingRouter,
  tank: tankRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
