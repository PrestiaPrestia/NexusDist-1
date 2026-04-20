export interface User {
  id: number;
  username: string;
  role: 'admin' | 'vendedor' | 'cajero';
  full_name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category_id: number;
  category_name?: string;
  price: number;
  min_stock: number;
  unit: string;
  total_stock: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_main: boolean;
}

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
}

export interface Client {
  id: number;
  document_id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface SaleItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Stats {
  total_sales: number;
  product_count: number;
  low_stock: { name: string; stock: number }[];
  sales_history: { date: string; total: number }[];
}
