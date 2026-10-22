ALTER TABLE "RepairJob" ADD COLUMN "paymentTransRef" TEXT;
CREATE UNIQUE INDEX "RepairJob_paymentTransRef_key" ON "RepairJob"("paymentTransRef");

ALTER TABLE "PosSale" ADD COLUMN "paymentTransRef" TEXT;
CREATE UNIQUE INDEX "PosSale_paymentTransRef_key" ON "PosSale"("paymentTransRef");

CREATE TABLE "PaymentVerification" (
    "id" SERIAL NOT NULL,
    "transRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentVerification_transRef_key" ON "PaymentVerification"("transRef");
