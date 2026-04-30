/**
 * Newspack My Account v2 prototype — homepage overlay bundle.
 *
 * Standalone webpack entry. Imports the public-path bootstrap (required for
 * any standalone entry per AGENTS.md), the overlay's scoped stylesheet, and
 * the overlay interaction module.
 */

import '../shared/js/public-path';
import './style.scss';
import './overlay';
