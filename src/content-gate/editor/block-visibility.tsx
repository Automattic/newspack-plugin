/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import {
	CheckboxControl,
	FormTokenField,
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';

/**
 */

/**
 * Target block types that receive access control attributes.
 */
const TARGET_BLOCKS = [ 'core/group', 'core/stack', 'core/row' ];

/**
 * Register custom attributes on target block types.
 */
addFilter( 'blocks.registerBlockType', 'newspack-plugin/block-visibility/attributes', ( settings: BlockSettings, name: string ) => {
	if ( ! TARGET_BLOCKS.includes( name ) ) {
		return settings;
	}
	return {
		...settings,
		attributes: {
			...settings.attributes,
			newspackAccessControlVisibility: {
				type: 'string',
				default: 'visible',
			},
			newspackAccessControlRules: {
				type: 'object',
				default: {},
			},
		},
	};
} );

/**
 * Available access rules from localized data.
 */
const availableAccessRules: Record< string, AccessRuleConfig > = window.newspackBlockVisibility?.available_access_rules ?? {};

/**
 * Whether any rules are currently active on the block.
 */
function hasActiveRules( rules: Record< string, any > ): boolean {
	return !! rules?.registration?.active || !! rules?.custom_access?.active;
}

/** ToggleGroupControl for the two standard visibility options. */
const VisibilityControl = ( {
	label,
	help,
	value,
	onChange,
	disabled,
}: {
	label: string;
	help: string;
	value: string;
	onChange: ( value: string ) => void;
	disabled: boolean;
} ) => (
	<PanelRow>
		<ToggleGroupControl label={ label } help={ help } value={ value } onChange={ onChange } isBlock __next40pxDefaultSize>
			<ToggleGroupControlOption disabled={ disabled } value="visible" label={ __( 'Visible to', 'newspack-plugin' ) } />
			<ToggleGroupControlOption disabled={ disabled } value="hidden" label={ __( 'Hidden to', 'newspack-plugin' ) } />
		</ToggleGroupControl>
	</PanelRow>
);

/**
 * Rules whose options must be fetched dynamically.
 */
const DYNAMIC_OPTION_RULES: Record< string, { path: string; mapItem: ( item: DynamicOptionItem ) => { value: string | number; label: string } } > = {
	institution: {
		path: '/wp/v2/np_institution?per_page=100&context=edit',
		mapItem: ( item: DynamicOptionItem ) => ( { value: item.id, label: item.title.raw } ),
	},
};

/**
 * Value control for a single access rule.
 * Renders FormTokenField for rules with options, TextControl for free-text rules.
 */
const AccessRuleValueControl = ( { slug, config, value, onChange }: any ) => {
	const dynamicConfig = DYNAMIC_OPTION_RULES[ slug ];
	const staticOptions: Array< { value: string | number; label: string } > = config.options ?? [];

	const [ options, setOptions ] = useState( staticOptions );

	useEffect( () => {
		if ( ! dynamicConfig ) {
			return;
		}
		let cancelled = false;
		apiFetch< any[] >( { path: dynamicConfig.path } )
			.then( items => {
				if ( ! cancelled ) {
					setOptions( items.map( dynamicConfig.mapItem ) );
				}
			} )
			.catch( () => {} );
		return () => {
			cancelled = true;
		};
	}, [ slug ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( options.length > 0 ) {
		// Map stored IDs to labels for display; silently drop IDs with no matching option.
		const selectedLabels = options
			.filter( o => ( Array.isArray( value ) ? value : [] ).some( v => String( v ) === String( o.value ) ) )
			.map( o => o.label );

		return (
			<FormTokenField
				label=""
				value={ selectedLabels }
				suggestions={ options.map( o => o.label ) }
				onChange={ ( labels: string[] ) => onChange( options.filter( o => labels.includes( o.label ) ).map( o => o.value ) ) }
				__experimentalExpandOnFocus
				__next40pxDefaultSize
			/>
		);
	}

	return (
		<TextControl
			hideLabelFromVision
			label={ config.name }
			placeholder={ config.placeholder ?? '' }
			help={ __( 'Separate with commas.', 'newspack-plugin' ) }
			value={ typeof value === 'string' ? value : '' }
			onChange={ onChange }
			__next40pxDefaultSize
		/>
	);
};

/** One toggle + value control per available access rule. */
const AccessRulesControls = ( { activeRules, onChange }: any ) => {
	const handleToggle = ( slug: string, defaultValue: any ) => {
		const has = activeRules.some( ( r: any ) => r.slug === slug );
		if ( has ) {
			onChange( activeRules.filter( ( r: any ) => r.slug !== slug ) );
		} else {
			onChange( [ ...activeRules, { slug, value: defaultValue } ] );
		}
	};

	const handleValueChange = ( slug: string, value: any ) => {
		onChange( activeRules.map( ( r: any ) => ( r.slug === slug ? { ...r, value } : r ) ) );
	};

	return (
		<>
			{ Object.entries( availableAccessRules ).map( ( [ slug, config ]: [ string, any ] ) => {
				const activeRule = activeRules.find( ( r: any ) => r.slug === slug );
				return (
					<PanelRow key={ slug }>
						<div>
							<ToggleControl
								label={ config.name }
								help={ config.description }
								checked={ !! activeRule }
								onChange={ () => handleToggle( slug, config.default ) }
							/>
							{ activeRule && ! config.is_boolean && (
								<AccessRuleValueControl
									slug={ slug }
									config={ config }
									value={ activeRule.value }
									onChange={ ( v: any ) => handleValueChange( slug, v ) }
								/>
							) }
						</div>
					</PanelRow>
				);
			} ) }
		</>
	);
};

/** Registration section: logged-in toggle + optional verification sub-toggle. */
const RegistrationControls = ( { registration, onChange }: any ) => (
	<PanelRow>
		<div style={ { width: '100%' } }>
			<ToggleControl
				label={ __( 'Registered readers', 'newspack-plugin' ) }
				help={ __( 'Restrict to logged-in readers.', 'newspack-plugin' ) }
				checked={ !! registration.active }
				onChange={ active => onChange( { ...registration, active } ) }
			/>
			{ registration.active && (
				<CheckboxControl
					label={ __( 'Require verification', 'newspack-plugin' ) }
					help={ __( 'Readers must verify their account to access.', 'newspack-plugin' ) }
					checked={ !! registration.require_verification }
					onChange={ require_verification => onChange( { ...registration, require_verification } ) }
				/>
			) }
		</div>
	</PanelRow>
);

/**
 * Inspector panel for block access control.
 */
const BlockVisibilityPanel = ( { attributes, setAttributes }: any ) => {
	const rules: Record< string, any > = attributes.newspackAccessControlRules ?? {};
	const visibility: string = attributes.newspackAccessControlVisibility ?? 'visible';

	const registration = rules.registration ?? {};
	const customAccess = rules.custom_access ?? {};
	// Flatten grouped OR rules for display: [[rule]] → [rule]
	const activeRules: any[] = ( customAccess.access_rules ?? [] ).map( ( group: any[] ) => group[ 0 ] ).filter( Boolean );

	const rulesActive = hasActiveRules( rules );

	const updateRules = ( updates: Record< string, any > ) => {
		const newRules = { ...rules, ...updates };
		const stillActive = hasActiveRules( newRules );
		setAttributes( {
			newspackAccessControlRules: newRules,
			// Reset visibility to 'visible' when all rules are cleared.
			...( ! stillActive ? { newspackAccessControlVisibility: 'visible' } : {} ),
		} );
	};

	const setRegistration = ( newRegistration: Record< string, any > ) => {
		// Ensure require_verification is cleared when registration is turned off.
		if ( ! newRegistration.active ) {
			newRegistration.require_verification = false;
		}
		updateRules( { registration: newRegistration } );
	};

	const setAccessRules = ( flatRules: any[] ) => {
		const grouped = flatRules.map( ( rule: any ) => [ rule ] );
		updateRules( {
			custom_access: {
				...customAccess,
				active: grouped.length > 0,
				access_rules: grouped,
			},
		} );
	};

	return (
		<InspectorControls>
			<PanelBody
				className="newspack-access-control-block-visibility-panel"
				title={ __( 'Access Control', 'newspack-plugin' ) }
				initialOpen={ rulesActive }
			>
				<VisibilityControl
					label={ __( 'Block visibility', 'newspack-plugin' ) }
					help={ __( 'Visiblity of the content for readers who match the selected access rules.', 'newspack-plugin' ) }
					value={ visibility }
					onChange={ ( v: string ) => setAttributes( { newspackAccessControlVisibility: v } ) }
					disabled={ ! rulesActive }
				/>

				{ /* Registration toggle */ }
				<RegistrationControls registration={ registration } onChange={ setRegistration } />

				{ /* Access rule toggles */ }
				<AccessRulesControls activeRules={ activeRules } onChange={ setAccessRules } />
			</PanelBody>
		</InspectorControls>
	);
};

/**
 * Inject the Inspector panel into target block editors.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-visibility/inspector',
	createHigherOrderComponent( BlockEdit => {
		const WithBlockVisibilityPanel = ( props: any ) => {
			if ( ! TARGET_BLOCKS.includes( props.name ) ) {
				return <BlockEdit { ...props } />;
			}
			return (
				<>
					<BlockEdit { ...props } />
					<BlockVisibilityPanel { ...props } />
				</>
			);
		};
		return WithBlockVisibilityPanel;
	}, 'withBlockVisibilityPanel' )
);
