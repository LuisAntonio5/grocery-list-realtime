
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createGroceryItemInputSchema,
  updateGroceryItemInputSchema,
  deleteGroceryItemInputSchema,
  moveGroceryItemInputSchema,
  toggleGroceryItemInputSchema
} from './schema';

// Import handlers
import { createGroceryItem } from './handlers/create_grocery_item';
import { getGroceryItems } from './handlers/get_grocery_items';
import { getGroceryItem } from './handlers/get_grocery_item';
import { updateGroceryItem } from './handlers/update_grocery_item';
import { deleteGroceryItem } from './handlers/delete_grocery_item';
import { moveGroceryItem } from './handlers/move_grocery_item';
import { toggleGroceryItem } from './handlers/toggle_grocery_item';
import { getGroceryItemsFlat } from './handlers/get_grocery_items_flat';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Get all grocery items with nested structure
  getGroceryItems: publicProcedure
    .query(() => getGroceryItems()),

  // Get all grocery items in flat structure
  getGroceryItemsFlat: publicProcedure
    .query(() => getGroceryItemsFlat()),

  // Get a single grocery item by ID
  getGroceryItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getGroceryItem(input.id)),

  // Create a new grocery item
  createGroceryItem: publicProcedure
    .input(createGroceryItemInputSchema)
    .mutation(({ input }) => createGroceryItem(input)),

  // Update an existing grocery item
  updateGroceryItem: publicProcedure
    .input(updateGroceryItemInputSchema)
    .mutation(({ input }) => updateGroceryItem(input)),

  // Delete a grocery item
  deleteGroceryItem: publicProcedure
    .input(deleteGroceryItemInputSchema)
    .mutation(({ input }) => deleteGroceryItem(input)),

  // Move/reorder a grocery item
  moveGroceryItem: publicProcedure
    .input(moveGroceryItemInputSchema)
    .mutation(({ input }) => moveGroceryItem(input)),

  // Toggle checked status of a grocery item
  toggleGroceryItem: publicProcedure
    .input(toggleGroceryItemInputSchema)
    .mutation(({ input }) => toggleGroceryItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
