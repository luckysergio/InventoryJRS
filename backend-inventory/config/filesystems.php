<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Disk default yang akan digunakan oleh framework. Biasanya 'public'
    | untuk file yang bisa diakses via browser, 'local' untuk file private.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'public'), // default ke public

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk setiap disk. Anda bisa menambahkan lebih banyak disk
    | jika perlu, termasuk cloud storage seperti S3.
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'), // private storage
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'), // tempat menyimpan file publik
            'url' => env('APP_URL') . '/storage', // URL untuk akses file via browser
            'visibility' => 'public',
            'throw' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Laravel akan membuat symbolic link ketika menjalankan:
    | php artisan storage:link
    | Key = link di public, Value = target di storage
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
