/**
 * Custom hook for managing post saving locks based on field errors.
 */

import { useEffect } from '@wordpress/element';

/**
 * Hook to lock/unlock post saving based on field errors.
 *
 * @param {Object}   fieldErrors      - Object containing field validation errors.
 * @param {Function} lockPostSaving   - Function to lock post saving.
 * @param {Function} unlockPostSaving - Function to unlock post saving.
 * @param {string}   lockKey          - Unique key for this validation lock.
 */
export const useValidationLock = ( fieldErrors, lockPostSaving, unlockPostSaving, lockKey ) => {
	useEffect( () => {
		// Only proceed if both handlers are provided.
		if ( ! lockPostSaving || ! unlockPostSaving ) {
			return;
		}

		const hasErrors = Object.keys( fieldErrors ).length > 0;
		if ( hasErrors ) {
			lockPostSaving( lockKey );
		} else {
			unlockPostSaving( lockKey );
		}
	}, [ fieldErrors, lockPostSaving, unlockPostSaving, lockKey ] );
};
