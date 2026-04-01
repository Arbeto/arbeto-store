<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\InventoryStockService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RestockReturnedOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:restock-returns
                            {--dry-run : Preview changes without applying them}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'إعادة المنتجات من الطلبات المرتجعة المسلمة إلى المخزون';

    private InventoryStockService $inventoryStockService;

    public function __construct(InventoryStockService $inventoryStockService)
    {
        parent::__construct();
        $this->inventoryStockService = $inventoryStockService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        $this->info('جاري البحث عن الطلبات المرتجعة المسلمة...');

        // البحث عن جميع الطلبات المرتجعة التي حالتها delivered ولم يتم إعادة مخزونها
        $returnedOrders = Order::query()
            ->where('order_type', 'return')
            ->where('status', 'delivered')
            ->whereNull('inventory_restocked_at')
            ->get();

        if ($returnedOrders->isEmpty()) {
            $this->info('✅ لا توجد طلبات مرتجعة تحتاج إلى معالجة.');
            return Command::SUCCESS;
        }

        $this->info("تم العثور على {$returnedOrders->count()} طلب مرتجع مسلم.");

        if ($isDryRun) {
            $this->warn('🔍 وضع المعاينة - لن يتم تطبيق التغييرات');
            $this->newLine();
        }

        $successCount = 0;
        $errorCount = 0;

        $this->withProgressBar($returnedOrders, function ($order) use (&$successCount, &$errorCount, $isDryRun) {
            try {
                $items = is_array($order->items) ? $order->items : [];
                $itemsCount = count($items);

                if ($itemsCount === 0) {
                    $this->newLine();
                    $this->warn("⚠️  الطلب #{$order->id} لا يحتوي على منتجات");
                    return;
                }

                if ($isDryRun) {
                    $this->newLine();
                    $this->line("📦 الطلب #{$order->id}:");

                    foreach ($items as $item) {
                        $productName = $item['name'] ?? 'غير معروف';
                        $quantity = $item['quantity'] ?? $item['qty'] ?? 0;
                        $this->line("   - {$productName} × {$quantity}");
                    }

                    $successCount++;
                    return;
                }

                // تطبيق إعادة المخزون
                DB::transaction(function () use ($order) {
                    $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

                    if (!$lockedOrder || !empty($lockedOrder->inventory_restocked_at)) {
                        return;
                    }

                    // استخدام دالة restockOrderItems من الخدمة
                    $this->inventoryStockService->restockOrderItems($lockedOrder);

                    $lockedOrder->forceFill([
                        'inventory_restocked_at' => now(),
                    ])->saveQuietly();
                });

                $successCount++;

            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ خطأ في معالجة الطلب #{$order->id}: {$e->getMessage()}");
                $errorCount++;
            }
        });

        $this->newLine(2);

        if ($isDryRun) {
            $this->info("📊 ملخص المعاينة:");
            $this->info("✅ عدد الطلبات التي ستتم معالجتها: {$successCount}");
            $this->newLine();
            $this->comment('لتطبيق التغييرات، قم بتشغيل الأمر بدون --dry-run');
        } else {
            $this->info("📊 ملخص التنفيذ:");
            $this->info("✅ تمت معالجة {$successCount} طلب بنجاح");

            if ($errorCount > 0) {
                $this->error("❌ فشل معالجة {$errorCount} طلب");
            }
        }

        return Command::SUCCESS;
    }
}
