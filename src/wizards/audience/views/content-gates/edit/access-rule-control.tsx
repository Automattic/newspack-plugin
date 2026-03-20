/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FormTokenField } from '../../../../../../packages/components/src';

type RuleOption = { value: string; label: string };

interface DynamicRuleConfig< T > {
	path: string;
	mapItem: ( item: T ) => RuleOption;
}

function dynamicRule< T >( config: DynamicRuleConfig< T > ): DynamicRuleConfig< T > {
	return config;
}

/**
 * Rules whose options should be fetched dynamically via the REST API.
 */
const DYNAMIC_OPTION_RULES: Record< string, DynamicRuleConfig< any > > = {
	institution: dynamicRule< Institution >( {
		path: '/wp/v2/np_institution?per_page=100&context=edit',
		mapItem: item => ( { value: item.id.toString(), label: item.title.raw } ),
	} ),
};

/**
 * Return options for a rule, fetching dynamically when configured.
 */
function useRuleOptions( slug: string ) {
	const rule = window.newspackAudienceContentGates.available_access_rules[ slug ];
	const [ options, setOptions ] = useState< RuleOption[] >( rule?.options ?? [] );

	useEffect( () => {
		const config = DYNAMIC_OPTION_RULES[ slug ];
		if ( ! config ) {
			return;
		}
		apiFetch< any[] >( { path: config.path } ).then( items => {
			setOptions( items.map( config.mapItem ) );
		} );
	}, [ slug ] );

	return options;
}

export default function AccessRuleControl( { slug, value, onChange }: GateRuleControlProps ) {
	const rule = window.newspackAudienceContentGates.available_access_rules[ slug ];
	const options = useRuleOptions( slug );

	if ( ! rule || rule.is_boolean ) {
		return null;
	}
	if ( options && options.length > 0 ) {
		return (
			<FormTokenField
				label={ '' }
				value={ options.filter( o => value.includes( o.value ) ).map( o => o.label ) }
				onChange={ ( items: string[] ) => onChange( options?.filter( o => items.includes( o.label ) ).map( o => o.value ) ?? [] ) }
				suggestions={ options.map( o => o.label ) }
				__experimentalExpandOnFocus
				__next40pxDefaultSize
			/>
		);
	}
	return (
		<TextControl
			hideLabelFromVision
			label={ rule.name }
			help={ __( 'Separate with commas.', 'newspack-plugin' ) }
			value={ value as string }
			onChange={ onChange }
			__next40pxDefaultSize
		/>
	);
}
