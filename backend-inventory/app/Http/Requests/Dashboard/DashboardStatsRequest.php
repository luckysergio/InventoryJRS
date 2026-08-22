<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DashboardStatsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Sesuaikan dengan auth logic Anda
    }

    public function rules(): array
    {
        return [
            'period' => ['sometimes', 'string', Rule::in(['daily', 'weekly', 'monthly', 'yearly', 'custom', 'all'])],
            'from' => ['required_if:period,custom', 'nullable', 'date', 'before_or_equal:to'],
            'to' => ['required_if:period,custom', 'nullable', 'date', 'after_or_equal:from'],
            'months' => ['sometimes', 'integer', 'min:1', 'max:24'], // untuk chart
            'realtime' => ['sometimes', 'boolean'], // bypass cache untuk real-time
        ];
    }

    public function messages(): array
    {
        return [
            'period.in' => 'Period harus salah satu dari: daily, weekly, monthly, yearly, custom, all',
            'from.before_or_equal' => 'Tanggal mulai harus sebelum atau sama dengan tanggal akhir',
            'to.after_or_equal' => 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
            'months.min' => 'Minimal 1 bulan untuk chart',
            'months.max' => 'Maksimal 24 bulan untuk chart',
        ];
    }

    /**
     * Helper: dapatkan period dengan default
     */
    public function getPeriod(): string
    {
        return $this->input('period', 'daily');
    }

    /**
     * Helper: dapatkan months untuk chart dengan default
     */
    public function getChartMonths(): int
    {
        return (int) $this->input('months', 6);
    }

    /**
     * Helper: apakah ini request real-time (bypass cache)
     */
    public function isRealtime(): bool
    {
        return (bool) $this->boolean('realtime', false);
    }
}