import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function parseImages(images: string): string[] {
  try {
    return JSON.parse(images);
  } catch {
    return [images].filter(Boolean);
  }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando Pagamento",
  PAID: "Pago",
  PROCESSING: "Processando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-500 bg-yellow-500/10",
  PAID: "text-blue-500 bg-blue-500/10",
  PROCESSING: "text-purple-500 bg-purple-500/10",
  SHIPPED: "text-gold bg-gold/10",
  DELIVERED: "text-green-500 bg-green-500/10",
  CANCELLED: "text-red-500 bg-red-500/10",
  REFUNDED: "text-gray-500 bg-gray-500/10",
};

export const GENDER_LABELS: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  UNISEX: "Unissex",
};
