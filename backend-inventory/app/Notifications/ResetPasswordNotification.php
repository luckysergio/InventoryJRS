<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl($notifiable)
    {
        return config('app.frontend_url')
            . '/reset-password'
            . '?token=' . $this->token
            . '&email=' . urlencode($notifiable->email);
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Reset Password Akun Anda')
            ->line('Kami menerima permintaan reset password untuk akun Anda.')
            ->action('Reset Password', $this->resetUrl($notifiable))
            ->line('Link ini berlaku selama 60 menit.')
            ->line('Jika Anda tidak meminta reset password, abaikan email ini.');
    }
}
