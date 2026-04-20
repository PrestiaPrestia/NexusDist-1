import { supabase } from './supabase';

export const SupabaseService = {
  // Auth
  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name),
        inventory (stock)
      `);
    
    if (error) throw error;

    // Harmonize structure to match sqlite response
    return data.map((p: any) => ({
      ...p,
      category_name: p.categories?.name,
      total_stock: p.inventory?.reduce((acc: number, item: any) => acc + (item.stock || 0), 0) || 0
    }));
  },

  async addProduct(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Sales
  async createSale(saleData: any, items: any[]) {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();
    
    if (saleError) throw saleError;

    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);
    
    if (itemsError) throw itemsError;

    for (const item of items) {
       const { data: currentInv } = await supabase
         .from('inventory')
         .select('stock')
         .eq('product_id', item.product_id)
         .single();
       
       const newStock = (currentInv?.stock || 0) - item.quantity;
       await supabase
         .from('inventory')
         .update({ stock: newStock })
         .eq('product_id', item.product_id);
    }

    return sale;
  },

  async getSaleHistory() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, users (full_name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map((s: any) => ({
      ...s,
      full_name: s.users?.full_name
    }));
  },

  async getDashboardStats() {
    const { data: sales } = await supabase.from('sales').select('total');
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    const totalSales = sales?.reduce((acc, s) => acc + s.total, 0) || 0;

    return {
      total_sales: totalSales,
      product_count: productCount || 0,
      low_stock: [], // Simplify for now
      sales_history: [] // Simplify for now
    };
  },

  // Cash Flow
  async getCashFlow() {
    const { data, error } = await supabase
      .from('cash_flow')
      .select('*, users (full_name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      full_name: item.users?.full_name
    }));
  },

  async addCashFlow(item: any) {
    const { data, error } = await supabase
      .from('cash_flow')
      .insert([item]);
    
    if (error) throw error;
    return data;
  }
};
