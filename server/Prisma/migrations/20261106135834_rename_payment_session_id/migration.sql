/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentSessionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "stripeSessionId",
ADD COLUMN     "paymentSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
