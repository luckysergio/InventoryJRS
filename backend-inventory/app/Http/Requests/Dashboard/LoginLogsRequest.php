<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoginLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period'   => ['sometimes', 'string', Rule::in(['daily', 'weekly', 'monthly', 'yearly', 'custom', 'all'])],
            'from'     => ['required_if:period,custom', 'nullable', 'date', 'before_or_equal:to'],
            'to'       => ['required_if:period,custom', 'nullable', 'date', 'after_or_equal:from'],
            'page'     => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'success'  => ['sometimes', 'nullable', 'string', Rule::in(['true', 'false', '1', '0'])],
            'ip'       => ['sometimes', 'nullable', 'string', 'ip'],
        ];
    }

    public function messages(): array
    {
        return [
            'period.in'          => 'Period harus salah satu dari: daily, weekly, monthly, yearly, custom, all',
            'from.before_or_equal' => 'Tanggal mulai harus sebelum atau sama dengan tanggal akhir',
            'to.after_or_equal'  => 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
            'per_page.max'       => 'Maksimal 100 data per halaman',
            'ip.ip'              => 'Format IP address tidak valid',
        ];
    }

    public function getPeriod(): string
    {
        return $this->input('period', 'daily');
    }

    public function getFrom(): ?string
    {
        return $this->input('from');
    }

    public function getTo(): ?string
    {
        return $this->input('to');
    }

    public function getPage(): int
    {
        return (int) $this->input('page', 1);
    }

    public function getPerPage(): int
    {
        return (int) $this->input('per_page', 15);
    }

    public function getSearch(): ?string
    {
        return $this->filled('search') ? trim($this->input('search')) : null;
    }

    public function getSuccessFilter(): ?string
    {
        return $this->input('success');
    }

    public function getIpFilter(): ?string
    {
        return $this->input('ip');
    }
}