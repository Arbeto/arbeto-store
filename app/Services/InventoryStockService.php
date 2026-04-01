<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Products;
use Illuminate\Support\Facades\DB;

class InventoryStockService
{
    public function getAvailableStock(Products $product): int
    {
        $inventoryIds = $this->getLinkedInventoryIds($product);

        if (empty($inventoryIds)) {
            return max(0, (int) ($product->quantity ?? 0));
        }

        return (int) InventoryItem::query()
            ->whereIn('id', $inventoryIds)
            ->sum('quantity');
    }

    public function ensureCanUseQuantity(Products $product, int $requestedQty): void
    {
        $available = $this->getAvailableStock($product);

        if ($requestedQty > $available) {
            throw new InsufficientStockException($available);
        }
    }

    public function reserveStockForProduct(Products $product, int $requestedQty): array
    {
        $requestedQty = max(0, $requestedQty);

        if ($requestedQty < 1) {
            return [];
        }

        $inventoryIds = $this->getLinkedInventoryIds($product);

        if (empty($inventoryIds)) {
            $lockedProduct = Products::query()->lockForUpdate()->find($product->id);

            if (!$lockedProduct) {
                throw new InsufficientStockException(0, 'المنتج غير متوفر حالياً');
            }

            $available = max(0, (int) ($lockedProduct->quantity ?? 0));
            if ($requestedQty > $available) {
                throw new InsufficientStockException($available);
            }

            $lockedProduct->quantity = $available - $requestedQty;
            $lockedProduct->save();

            return [[
                'source'     => 'product',
                'product_id' => (int) $lockedProduct->id,
                'qty'        => $requestedQty,
            ]];
        }

        $inventoryRows = InventoryItem::query()
            ->whereIn('id', $inventoryIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get(['id', 'quantity']);

        $available = (int) $inventoryRows->sum(fn($row) => (int) $row->quantity);
        if ($requestedQty > $available) {
            throw new InsufficientStockException($available);
        }

        $remaining = $requestedQty;
        $deductions = [];

        foreach ($inventoryRows as $row) {
            if ($remaining <= 0) {
                break;
            }

            $rowQty = max(0, (int) $row->quantity);
            if ($rowQty < 1) {
                continue;
            }

            $take = min($rowQty, $remaining);
            if ($take < 1) {
                continue;
            }

            $row->decrement('quantity', $take);
            $deductions[] = [
                'source'            => 'inventory',
                'inventory_item_id' => (int) $row->id,
                'qty'               => $take,
            ];

            $remaining -= $take;
        }

        if ($remaining > 0) {
            throw new InsufficientStockException($available);
        }

        return $deductions;
    }

    public function restockForStatusTransition(Order $order, ?string $fromStatus, ?string $toStatus): void
    {
        if (!$toStatus || $fromStatus === $toStatus) {
            return;
        }

        $isReturnOrder = ($order->order_type ?? 'purchase') === 'return';
        $shouldRestock = false;

        if ($isReturnOrder) {
            // للطلبات المرتجعة: نرجع المنتجات للمخزون عند التوصيل الناجح
            $shouldRestock = $toStatus === 'delivered';
        } else {
            // للطلبات العادية: نرجع المنتجات عند الفشل/الإلغاء
            $shouldRestock = in_array($toStatus, ['failed-delivery', 'cancelled', 'rejected'], true)
                && !empty($order->inventory_reserved_at);
        }

        if (!$shouldRestock) {
            return;
        }

        DB::transaction(function () use ($order, $toStatus, $isReturnOrder) {
            $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

            if (!$lockedOrder || !empty($lockedOrder->inventory_restocked_at)) {
                return;
            }

            $lockedType = $lockedOrder->order_type ?? 'purchase';
            if ($lockedType === 'return') {
                // للطلبات المرتجعة: نتأكد أن الحالة delivered
                if ($toStatus !== 'delivered') {
                    return;
                }
            } else {
                // للطلبات العادية: نتأكد من حالة الفشل والحجز السابق
                if (!in_array($toStatus, ['failed-delivery', 'cancelled', 'rejected'], true)) {
                    return;
                }

                if (empty($lockedOrder->inventory_reserved_at)) {
                    return;
                }
            }

            $this->restockOrderItems($lockedOrder);

            $lockedOrder->forceFill([
                'inventory_restocked_at' => now(),
            ])->saveQuietly();
        });
    }

    public function buildPartialDeduction(array $orderItem, int $requestedQty): array
    {
        $requestedQty = max(0, $requestedQty);
        if ($requestedQty < 1) {
            return [];
        }

        $deduction = $orderItem['inventory_deduction'] ?? null;
        if (!is_array($deduction) || empty($deduction)) {
            return [];
        }

        $remaining = $requestedQty;
        $result = [];

        foreach ($deduction as $chunk) {
            if ($remaining <= 0) {
                break;
            }

            $chunkQty = max(0, (int) ($chunk['qty'] ?? 0));
            if ($chunkQty < 1) {
                continue;
            }

            $take = min($chunkQty, $remaining);
            if ($take < 1) {
                continue;
            }

            if (($chunk['source'] ?? 'inventory') === 'product') {
                $productId = (int) ($chunk['product_id'] ?? 0);
                if ($productId > 0) {
                    $result[] = [
                        'source'     => 'product',
                        'product_id' => $productId,
                        'qty'        => $take,
                    ];
                }
            } else {
                $inventoryItemId = (int) ($chunk['inventory_item_id'] ?? 0);
                if ($inventoryItemId > 0) {
                    $result[] = [
                        'source'            => 'inventory',
                        'inventory_item_id' => $inventoryItemId,
                        'qty'               => $take,
                    ];
                }
            }

            $remaining -= $take;
        }

        return $result;
    }

    public function restockOrderItems(Order $order): void
    {
        $items = is_array($order->items) ? $order->items : [];

        foreach ($items as $item) {
            $itemQty = max(0, (int) ($item['quantity'] ?? $item['qty'] ?? 0));
            if ($itemQty < 1) {
                continue;
            }

            $deduction = $item['inventory_deduction'] ?? null;

            if (is_array($deduction) && !empty($deduction)) {
                foreach ($deduction as $chunk) {
                    $qty = max(0, (int) ($chunk['qty'] ?? 0));
                    if ($qty < 1) {
                        continue;
                    }

                    if (($chunk['source'] ?? 'inventory') === 'product') {
                        $productId = (int) ($chunk['product_id'] ?? 0);
                        if ($productId > 0) {
                            Products::query()->whereKey($productId)->increment('quantity', $qty);
                        }
                    } else {
                        $inventoryItemId = (int) ($chunk['inventory_item_id'] ?? 0);
                        if ($inventoryItemId > 0) {
                            InventoryItem::query()->whereKey($inventoryItemId)->increment('quantity', $qty);
                        }
                    }
                }

                continue;
            }

            $productId = (int) ($item['product_id'] ?? 0);
            if ($productId < 1) {
                continue;
            }

            $product = Products::query()->with('inventoryItem:id', 'inventoryItems:id')->find($productId);
            if (!$product) {
                continue;
            }

            $inventoryIds = $this->getLinkedInventoryIds($product);

            if (!empty($inventoryIds)) {
                InventoryItem::query()->whereKey($inventoryIds[0])->increment('quantity', $itemQty);
            } else {
                Products::query()->whereKey($productId)->increment('quantity', $itemQty);
            }
        }
    }

    private function getLinkedInventoryIds(Products $product): array
    {
        $product->loadMissing(['inventoryItem:id', 'inventoryItems:id']);

        $ids = $product->inventoryItems
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id > 0)
            ->values()
            ->all();

        if (!empty($product->inventory_item_id)) {
            $ids[] = (int) $product->inventory_item_id;
        }

        return array_values(array_unique(array_filter($ids)));
    }
}
