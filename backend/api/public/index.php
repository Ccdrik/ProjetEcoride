<?php

use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';

return function (array $context) {
    $env = $_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? $context['APP_ENV'] ?? 'prod';
    $debug = ($_SERVER['APP_DEBUG'] ?? $_ENV['APP_DEBUG'] ?? $context['APP_DEBUG'] ?? '0') === '1';

    return new Kernel($env, $debug);
};