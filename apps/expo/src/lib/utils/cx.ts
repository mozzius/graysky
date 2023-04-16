import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cx = (...values: ClassValue[]) => twMerge(clsx(...values));
