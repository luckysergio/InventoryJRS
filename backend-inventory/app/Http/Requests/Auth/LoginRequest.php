<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'                => ['required', 'string', 'email', 'max:255'],
            'password'             => ['required', 'string'],
            'g-recaptcha-response' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'                => 'Email wajib diisi.',
            'email.email'                   => 'Format email tidak valid.',
            'password.required'             => 'Password wajib diisi.',
            'g-recaptcha-response.required' => 'Verifikasi keamanan diperlukan.',
        ];
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);
        $data['email'] = strtolower(trim($data['email']));
        return $data;
    }

    public function rateLimiterKey(): string
    {
        return 'login:' . strtolower($this->input('email')) . '|' . $this->ip();
    }

    public function getRecaptchaToken(): ?string
    {
        return $this->input('g-recaptcha-response');
    }
}