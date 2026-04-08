/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Target block types that receive access control attributes.
 */
const TARGET_BLOCKS = [ 'core/group', 'core/stack', 'core/row' ];

/**
 * Register custom attributes on target block types.
 */
addFilter(
	'blocks.registerBlockType',
	'newspack-plugin/block-visibility/attributes',
	( settings: any, name: string ) => {
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
	}
);

/**
 * Available access rules from localized data.
 */
const availableAccessRules: Record< string, any > =
	( window as any ).newspackBlockVisibility?.available_access_rules ?? {};

/**
 * Whether any rules are currently active on the block.
 */
function hasActiveRules( rules: Record< string, any > ): boolean {
	return !! rules?.registration?.active || !! rules?.custom_access?.active;
}

/** Wraps ToggleGroupControl with the two standard visibility options. */
const ToggleGroupControlCompat = ( { label, value, onChange }: any ) => (
	<ToggleGroupControl
		label={ label }
		value={ value }
		onChange={ onChange }
		isBlock
		__nextHasNoMarginBottom
		__next40pxDefaultSize
	>
		<ToggleGroupControlOption
			value="visible"
			label={ __( 'Visible to', 'newspack-plugin' ) }
		/>
		<ToggleGroupControlOption
			value="hidden"
			label={ __( 'Hidden to', 'newspack-plugin' ) }
		/>
	</ToggleGroupControl>
);

/**
 * Value control for a single access rule — stub, full implementation in Task 10.
 */
const AccessRuleValueControl = ( _props: any ) => null;

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
					<div key={ slug }>
						<ToggleControl
							label={ config.name }
							help={ config.description }
							checked={ !! activeRule }
							onChange={ () => handleToggle( slug, config.default ) }
							__nextHasNoMarginBottom
						/>
						{ activeRule && (
							<AccessRuleValueControl
								slug={ slug }
								config={ config }
								value={ activeRule.value }
								onChange={ ( v: any ) => handleValueChange( slug, v ) }
							/>
						) }
					</div>
				);
			} ) }
		</>
	);
};

/** Registration section: logged-in toggle + optional verification sub-toggle. */
const RegistrationControls = ( { registration, onChange }: any ) => (
	<>
		<ToggleControl
			label={ __( 'Registered readers', 'newspack-plugin' ) }
			help={ __( 'Restrict to logged-in readers.', 'newspack-plugin' ) }
			checked={ !! registration.active }
			onChange={ active => onChange( { ...registration, active } ) }
			__nextHasNoMarginBottom
		/>
		{ registration.active && (
			<ToggleControl
				label={ __( 'Require email verification', 'newspack-plugin' ) }
				checked={ !! registration.require_verification }
				onChange={ require_verification =>
					onChange( { ...registration, require_verification } )
				}
				__nextHasNoMarginBottom
			/>
		) }
	</>
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
	const activeRules: any[] = ( customAccess.access_rules ?? [] ).map(
		( group: any[] ) => group[ 0 ]
	).filter( Boolean );

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

	const setRegistration = ( updates: Record< string, any > ) => {
		const newRegistration = { ...registration, ...updates };
		// Remove requireVerification when registration is turned off.
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
				title={ __( 'Access Control', 'newspack-plugin' ) }
				initialOpen={ rulesActive }
			>
				{ /* Visibility toggle — disabled until a rule is configured */ }
				<div
					style={ {
						opacity: rulesActive ? 1 : 0.4,
						pointerEvents: rulesActive ? 'auto' : 'none',
						marginBottom: '16px',
					} }
				>
					<ToggleGroupControlCompat
						label={ __( 'Block visibility', 'newspack-plugin' ) }
						value={ visibility }
						onChange={ ( v: string ) =>
							setAttributes( { newspackAccessControlVisibility: v } )
						}
					/>
				</div>

				{ /* Registration toggle */ }
				<RegistrationControls
					registration={ registration }
					onChange={ setRegistration }
				/>

				{ /* Access rule toggles */ }
				<AccessRulesControls
					activeRules={ activeRules }
					onChange={ setAccessRules }
				/>
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
	createHigherOrderComponent(
		BlockEdit => {
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
		},
		'withBlockVisibilityPanel'
	)
);
