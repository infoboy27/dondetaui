export function formatPrice(price: number): string {
  return `RD$${price.toLocaleString('es-DO')}`
}
