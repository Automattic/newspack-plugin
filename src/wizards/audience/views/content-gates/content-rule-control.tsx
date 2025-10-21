/* global newspackAudienceContentGates */

/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { AutocompleteTokenField } from '../../../../../packages/components/src';

const ContentRuleControl = ( { slug, label, options }: { slug: string; label: string; options: { value: string; label: string }[] } ) => {
	return <AutocompleteTokenField label={ label } />;
};

export default ContentRuleControl;
