import { createTRPCRouter } from "./trpc";
import { userRouter } from './routers/user';
import { factoryRouter } from './routers/factory';
import { productRouter } from './routers/product';
import { productBaseRouter } from './routers/productBase';
import { productSizeRouter } from './routers/productSize';
import { productVariantRouter } from './routers/productVariant';
import { customerRouter } from './routers/customer';
import { blendRouter } from './routers/blend';
import { tankRouter } from './routers/tank';
import { formulaRouter } from './routers/formula';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  factory: factoryRouter,
  product: productRouter,
  productBase: productBaseRouter,
  productSize: productSizeRouter,
  productVariant: productVariantRouter,
  customers: customerRouter,
  tank: tankRouter,
  blend: blendRouter,
  formula: formulaRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
