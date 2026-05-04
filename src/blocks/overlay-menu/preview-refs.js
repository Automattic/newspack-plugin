/**
 * Module-level Maps for ephemeral editor-only preview state.
 *
 * panelToggles: the panel registers a toggle function here so sibling/parent
 * blocks can call it without needing a shared reactive store.
 *
 * subscribers: any block that needs to mirror the panel's open state registers
 * a React state setter here (keyed by panel clientId). Multiple blocks can
 * subscribe to the same panel.
 *
 * Both Maps are keyed by panel clientId.
 */

/** @type {Map<string, function(): void>} */
export const panelToggles = new Map();

/** @type {Map<string, Set<function(boolean): void>>} */
const subscribers = new Map();

/**
 * Subscribe a React state setter to open-state changes for a panel.
 * Returns an unsubscribe function suitable for useEffect cleanup.
 *
 * @param {string}                  panelClientId Panel clientId.
 * @param {function(boolean): void} setter        React state setter.
 * @return {function(): void} Unsubscribe function.
 */
export function subscribeToPanel( panelClientId, setter ) {
	if ( ! subscribers.has( panelClientId ) ) {
		subscribers.set( panelClientId, new Set() );
	}
	subscribers.get( panelClientId ).add( setter );
	return () => subscribers.get( panelClientId )?.delete( setter );
}

/**
 * Notify all subscribers of a new open state.
 *
 * @param {string}  panelClientId Panel clientId.
 * @param {boolean} isOpen        New open state.
 */
export function notifySubscribers( panelClientId, isOpen ) {
	subscribers.get( panelClientId )?.forEach( fn => fn( isOpen ) );
}
