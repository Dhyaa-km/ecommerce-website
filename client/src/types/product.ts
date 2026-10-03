import { Category } from './category';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string; // Note: Prisma Decimal serializes to string/number in JSON
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: ProductPagination;
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}
