/**
 * Newspack My Account v2 prototype demo.
 *
 * Standalone webpack entry. Imports the public-path bootstrap (required for
 * any standalone entry per AGENTS.md), the demo's scoped stylesheet, and
 * the per-screen interaction modules.
 */

import '../shared/js/public-path';
import './style.scss';
import './newsletters';
import './donations';
import './subscriptions';
import './payment-methods';
