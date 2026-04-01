<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{
    public function sendOtp($phone, $otp)
    {
        try {
            $response = Http::asForm()->post("https://www.dreams.sa/index.php/api/sendsms/", [
                'user'       => env('DREAMS_USER'),        
                'secret_key' => env('DREAMS_SECRET_KEY'), 
                'to'         => $phone,                   
                'message'    => "كود الدخول الخاص بك هو: $otp (صالح لمدة دقيقتين فقط)",
                'sender'     => env('DREAMS_SENDER'),     
            ]);

            // سجل كل حاجة دايمًا سواء نجحت أو فشلت
            \Log::info("Dreams SMS Raw Response", [
                'status'   => $response->status(),
                'body'     => $response->body(),
                'phone'    => $phone,
                'payload'  => [
                    'user'       => env('DREAMS_USER'),
                    'secret_key' => substr(env('DREAMS_SECRET_KEY'), 0, 8) . '***',
                    'sender'     => env('DREAMS_SENDER'),
                ]
            ]);

            return $response->json();
        } catch (\Exception $e) {
            \Log::error("Dreams SMS Exception: " . $e->getMessage());
            return false;
        }
    }
}


