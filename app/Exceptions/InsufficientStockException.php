<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public int $availableQuantity;

    public function __construct(int $availableQuantity, ?string $message = null)
    {
        $this->availableQuantity = max(0, $availableQuantity);

        parent::__construct(
            $message ?? ('لم يعد متبقي الا (' . $this->availableQuantity . ') قطعة')
        );
    }
}
