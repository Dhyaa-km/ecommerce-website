-- Enforce inventory and order quantity invariants at the database level.
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_stock_nonnegative_check" CHECK ("stock" >= 0),
  ADD CONSTRAINT "Product_price_nonnegative_check" CHECK ("price" >= 0);

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_quantity_positive_check" CHECK ("quantity" > 0);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_positive_check" CHECK ("quantity" > 0);
