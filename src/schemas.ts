import { z } from "zod";

export const filtersSchema = z.object({
  document_sets: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
  time_cutoff: z.string().datetime().optional(),
  tags: z.array(z.record(z.unknown())).optional(),
});

export const paginationSchema = {
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
};

export const rawPathSchema = z
  .string()
  .startsWith("/")
  .regex(/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/, "Path contains unsafe characters")
  .refine(
    (path) => !path.includes("//") && !path.split("/").includes(".."),
    "Path must be relative to the Onyx API",
  );
