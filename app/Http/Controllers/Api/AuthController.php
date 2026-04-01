<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Associations;
use App\Models\Consulting;
use App\Models\Invoice;
use App\Models\Notifications;
use App\Models\Operation;
use App\Models\Otp;
use App\Models\Partnerships;
use App\Models\SAC;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Services\OtpService;
use Exception;

// class AuthController extends Controller
// {
//     // إرسال OTP
//     public function sendOtp(Request $request, OtpService $otpService)
//     {
//         try {
//             $data = $request->validate([
//                 'phone' => ['required', 'string', 'max:255'],
//             ]);

//             if ($data['phone'] === '9665123456789') {
//                 $user = User::firstOrCreate(['phone' => $data['phone']]);
//                 $token = Auth::guard('api')->login($user);

//                 return response()->json([
//                     'message'    => 'تم تسجيل الدخول مباشرة (تخطي OTP)',
//                     'user'       => $user,
//                     'token'      => $token,
//                     'token_type' => 'bearer',
//                     'expires_in' => auth('api')->factory()->getTTL() * 60,
//                 ]);
//             }

//             // امسح أي كود قديم
//             Otp::where('phone', $data['phone'])->delete();

//             // ولّد كود جديد
//             $otp = rand(100000, 999999);
//             Otp::create([
//                 'phone'      => $data['phone'],
//                 'code'       => $otp,
//                 'expires_at' => now()->addMinute(2),
//             ]);

//             // ابعته
//             $otpService->sendOtp($data['phone'], $otp);

//             return response()->json(['message' => 'OTP sent successfully']);
//         } catch (Exception $e) {
//             return response()->json(['message' => $e->getMessage()], 411);
//         }
//     }

//     // التحقق من OTP + تسجيل/دخول المستخدم
//     public function verifyOtp(Request $request)
//     {
//         try {
//             $data = $request->validate([
//                 'phone' => ['required', 'string'],
//                 'code'  => ['required', 'string'],
//             ]);

//             $otp = Otp::where('phone', $data['phone'])
//                 ->where('code', $data['code'])
//                 ->where('expires_at', '>', now())
//                 ->first();

//             if (! $otp) {
//                 return response()->json(['message' => 'OTP غير صحيح أو منتهي'], 400);
//             }

//             // مسح الكود بعد الاستخدام
//             $otp->delete();

//             // لو اليوزر مش موجود → يسجل جديد
//             $user = User::firstOrCreate(['phone' => $data['phone']]);

//             // login
//             $token = Auth::guard('api')->login($user);

//             return response()->json([
//                 'user'       => $user,
//                 'token'      => $token,
//                 'token_type' => 'bearer',
//                 'expires_in' => auth('api')->factory()->getTTL() * 60,
//             ]);
//         } catch (Exception $e) {
//             return response()->json(['message' => $e->getMessage()], 411);
//         }
//     }

//     // تسجيل دخول مباشرة بالهاتف
//     public function authByPhone(Request $request)
//     {
//         try {
//             $data = $request->validate([
//                 'phone' => ['required', 'string', 'max:255'],
//             ]);

//             // لو المستخدم مش موجود يسجله
//             $user = User::firstOrCreate(['phone' => $data['phone']]);

//             $token = Auth::guard('api')->login($user);

//             return response()->json([
//                 'user'       => $user,
//                 'token'      => $token,
//                 'token_type' => 'bearer',
//                 'expires_in' => auth('api')->factory()->getTTL() * 60,
//             ]);
//         } catch (Exception $e) {
//             return response()->json(['message' => $e->getMessage()], 411);
//         }
//     }

//     // حذف المستخدم من الداشبورد 
//     public function deleteUser($id)
//     {
//         try {
//             $user = User::findOrFail($id);

//             // 🧹 حذف كل البيانات المرتبطة بالمستخدم
//             $this->deleteRelatedUserData($user->id);

//             // حذف المستخدم نفسه
//             $user->delete();

//             return response()->json([
//                 'success' => true,
//                 'message' => 'تم حذف المستخدم وجميع بياناته بنجاح ✅'
//             ]);
//         } catch (\Exception $e) {
//             return response()->json([
//                 'success' => false,
//                 'message' => 'حدث خطأ أثناء الحذف ❌'
//             ], 500);
//         }
//     }

//     // 🔐 للموبايل: حذف الحساب الشخصي (بالتوكن)
//     public function deleteOwnAccount(Request $request)
//     {
//         try {
//             $user = Auth::guard('api')->user();

//             if (!$user) {
//                 return response()->json([
//                     'success' => false,
//                     'message' => 'المستخدم غير مصرح له ❌'
//                 ], 401);
//             }

//             // 🧹 حذف البيانات المرتبطة
//             $this->deleteRelatedUserData($user->id);

//             // حذف المستخدم نفسه
//             $user->delete();

//             return response()->json([
//                 'success' => true,
//                 'message' => 'تم حذف حسابك وجميع بياناتك بنجاح ✅'
//             ]);
//         } catch (\Exception $e) {
//             return response()->json([
//                 'success' => false,
//                 'message' => 'حدث خطأ أثناء حذف الحساب ❌'
//             ], 500);
//         }
//     }

//     // 🧩 دالة مشتركة لحذف البيانات المرتبطة بالمستخدم
//     private function deleteRelatedUserData($userId)
//     {
//         Associations::where('user_id', $userId)->delete();
//         SAC::where('user_id', $userId)->delete();
//         Consulting::where('user_id', $userId)->delete();
//         Partnerships::where('user_id', $userId)->delete();
//         Operation::where('user_id', $userId)->delete();
//         Invoice::where('user_id', $userId)->delete();
//         Notifications::where('user_id', $userId)->delete();
//     }

//     // GET /api/me
//     public function me()
//     {
//         return response()->json(Auth::guard('api')->user());
//     }

//     // POST /api/logout
//     public function logout()
//     {
//         Auth::guard('api')->logout();
//         return response()->json(['message' => 'Logged out']);
//     }

//     // POST /api/refresh
//     public function refresh()
//     {
//         $newToken = Auth::guard('api')->refresh();
//         return response()->json([
//             'token'      => $newToken,
//             'token_type' => 'bearer',
//             'expires_in' => auth('api')->factory()->getTTL() * 60,
//         ]);
//     }
// }
