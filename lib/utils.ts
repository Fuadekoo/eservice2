import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DefaultValues,
  FieldError,
  FieldValues,
  FormState,
} from "react-hook-form";
import { z } from "zod";
import prisma from "./db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sorting(first: string, second: string, direction: boolean) {
  return direction
    ? first > second
      ? 1
      : first < second
      ? -1
      : 0
    : first > second
    ? -1
    : first < second
    ? 1
    : 0;
}

export function getFormErrors<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>
): { [Key in keyof TFieldValues]: string } {
  return Object.entries(formState.errors).reduce(
    (acc, [n, v]) => ({
      ...acc,
      [n]: (v as FieldError | undefined)?.message ?? "",
    }),
    {} as { [Key in keyof TFieldValues]: string }
  );
}

export function getDefaults<
  T extends z.ZodTypeAny,
  TFieldValues extends FieldValues = FieldValues
>(
  schema: T
):
  | DefaultValues<TFieldValues>
  | ((payload?: unknown) => Promise<TFieldValues>)
  | undefined {
  if (schema instanceof z.ZodDefault) {
    const defaultValue = schema._def.defaultValue;
    return typeof defaultValue === "function"
      ? defaultValue()
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (defaultValue as any);
  } else if (schema instanceof z.ZodObject) {
    return Object.fromEntries(
      Object.entries(schema.shape).map(([key, value]) => [
        key,
        getDefaults(value as z.ZodTypeAny),
      ])
    ) as DefaultValues<TFieldValues>;
  }
  return undefined;
}

/**
 * Generate a sequential request number in the format REQ-YYYYMMDD-XXX
 * Where XXX is a 3-digit sequential number starting from 001 for each day
 *
 * Note: This function currently generates a basic sequential number since
 * the requestNumber field hasn't been added to the database yet.
 * After running the database migration, this will generate proper sequential numbers.
 */
export async function generateRequestNumber(): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // For now, generate a simple sequential number based on current timestamp
  // This will be replaced with proper database-based sequencing after migration
  const timestamp = Date.now();
  const sequentialNumber = (timestamp % 1000).toString().padStart(3, '0');

  return `REQ-${dateString}-${sequentialNumber}`;
}
