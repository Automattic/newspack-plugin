/* global newspackAudienceContentGates */

/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ContentRuleControlTaxonomy from './content-rule-control-taxonomy';
import { AutocompleteWithSuggestions } from '../../../../../packages/components/src';

export default function ContentRuleControl( { slug, value, onChange }: GateRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_content_rules[ slug ];
	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}

	if ( rule.options && rule.options.length > 0 ) {
		return (
			<>
				<AutocompleteWithSuggestions
					label={ rule.name }
					multiSelect={ true }
					selectedItems={ rule.options.filter( o => value.includes( o.value ) ) }
					onChange={ ( items: string[] ) => onChange( items.map( o => o.value ) ) }
					fetchSuggestions={ async ( search: string ) => {
						if ( ! search ) {
							return rule.options;
						}
						return rule.options.filter( o => o.label.toLowerCase().includes( search.toLowerCase() ) );
					} }
				/>
			</>
		);
	}

	return <ContentRuleControlTaxonomy slug={ slug } value={ value } onChange={ onChange } />;
}
