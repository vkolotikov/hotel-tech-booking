<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'smoobu' => [
        'provider'       => env('SMOOBU_PROVIDER', 'mock'),
        'base_url'       => env('SMOOBU_BASE_URL', 'https://login.smoobu.com/api/'),
        'api_key'        => env('SMOOBU_API_KEY', ''),
        'channel_id'     => env('SMOOBU_CHANNEL_ID', ''),
        'webhook_secret' => env('SMOOBU_WEBHOOK_SECRET', ''),
        'timeout'        => env('SMOOBU_TIMEOUT_SECONDS', 8),
    ],

    'saas' => [
        'platform_url' => env('SAAS_PLATFORM_URL', 'http://localhost:3000'),
        'jwt_secret'   => env('SAAS_JWT_SECRET', ''),
    ],

    'admin' => [
        'bootstrap_email'    => env('ADMIN_BOOTSTRAP_EMAIL'),
        'bootstrap_password' => env('ADMIN_BOOTSTRAP_PASSWORD'),
        'bootstrap_name'     => env('ADMIN_BOOTSTRAP_NAME', 'Admin'),
    ],

];
