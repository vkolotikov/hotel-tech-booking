<?php

namespace App\Console\Commands;

use App\Services\SmoobuClient;
use Illuminate\Console\Command;

/**
 * Compares the unit IDs hardcoded in config/content.php against the apartments
 * actually returned by the live Smoobu account. Use after rotating an API key
 * or when prices/availability look wrong in the booking widget — a stale ID in
 * config will silently disappear from results because /api/rates returns no
 * data for it.
 */
class SmoobuSyncUnits extends Command
{
    protected $signature = 'smoobu:sync-units';
    protected $description = 'Validate config/content.php unit IDs against the live Smoobu account';

    public function handle(SmoobuClient $smoobu): int
    {
        if (config('services.smoobu.provider') !== 'live') {
            $this->warn('SMOOBU_PROVIDER is not "live". Set it to "live" with a real SMOOBU_API_KEY to validate.');
            return self::FAILURE;
        }

        try {
            $response = $smoobu->listApartments();
        } catch (\Throwable $e) {
            $this->error('Smoobu API call failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $remote = collect($response['apartments'] ?? [])
            ->mapWithKeys(fn($a) => [(string) ($a['id'] ?? '') => $a['name'] ?? ''])
            ->filter(fn($_, $id) => $id !== '');

        $configured = collect(config('content.units', []));

        $this->info('Smoobu account has ' . $remote->count() . ' apartments.');
        $this->newLine();

        $this->line('<comment>Configured units:</comment>');
        foreach ($configured as $id => $unit) {
            $remoteName = $remote->get((string) $id);
            if ($remoteName === null) {
                $this->line("  <fg=red>MISSING</> {$id}  {$unit['name']}  (not found in Smoobu account)");
            } else {
                $match = trim($remoteName) === trim($unit['name']) ? '<fg=green>OK</>' : '<fg=yellow>NAME MISMATCH</>';
                $this->line("  {$match}  {$id}  config=\"{$unit['name']}\"  smoobu=\"{$remoteName}\"");
            }
        }

        $extraneous = $remote->keys()->diff($configured->keys()->map(fn($k) => (string) $k));
        if ($extraneous->isNotEmpty()) {
            $this->newLine();
            $this->line('<comment>Apartments in Smoobu but NOT in config/content.php:</comment>');
            foreach ($extraneous as $id) {
                $this->line("  <fg=cyan>{$id}</>  {$remote->get($id)}");
            }
        }

        return self::SUCCESS;
    }
}
