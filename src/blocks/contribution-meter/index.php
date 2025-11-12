<?php
/**
 * Contribution Meter Block loader.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Contribution_Meter;

use Newspack\Contribution_Meter\Contribution_Meter;

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/class-contribution-meter-block.php';

Contribution_Meter::init();
Contribution_Meter_Block::init();
