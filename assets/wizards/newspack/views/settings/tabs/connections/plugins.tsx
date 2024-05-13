/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';
import { ActionCard, Button, Handoff, hooks, Wizard } from '../../../../../../components/src';

interface Plugin {
	pluginSlug: string;
	editLink: string;
	name: string;
	fetchStatus: (
		p: ( a: { path: string; isComponentFetch: boolean } ) => Promise< {
			Configured: boolean;
			Status: string;
		} >
	) => Promise< unknown >;
	url?: string;
	status?: string;
	badge?: string;
	indent?: string;
	error?: {
		code: string;
	};
}

const PLUGINS: Record< string, Plugin > = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		name: __( 'Jetpack', 'newspack-plugin' ),
		fetchStatus: apiFetch =>
			apiFetch( {
				isComponentFetch: true,
				path: `/newspack/v1/plugins/jetpackd`,
			} ).then( result => ( {
				jetpack: { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		name: __( 'Site Kit by Google', 'newspack-plugin' ),
		fetchStatus: apiFetch =>
			apiFetch( {
				isComponentFetch: true,
				path: '/newspack/v1/plugins/google-site-kitd',
			} ).then( result => ( {
				'google-site-kit': { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
};

const pluginConnectButton = ( plugin: Plugin ) => {
	if ( plugin.pluginSlug ) {
		return (
			<Handoff plugin={ plugin.pluginSlug } editLink={ plugin.editLink } compact isLink>
				{ __( 'Connect', 'newspack-plugin' ) }
			</Handoff>
		);
	}
	if ( plugin.url ) {
		return (
			<Button isLink href={ plugin.url } target="_blank">
				{ __( 'Connect', 'newspack-plugin' ) }
			</Button>
		);
	}
	if ( plugin.error?.code === 'unavailable_site_id' ) {
		return (
			<span className="i newspack-error">
				{ __( 'Jetpack connection required', 'newspack-plugin' ) }
			</span>
		);
	}
};

const Plugins = () => {
	const [ plugins, setPlugins ] = hooks.useObjectState( PLUGINS ) as any;
	const { wizardApiFetch } = useDispatch( WIZARD_STORE_NAMESPACE );
	const { setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );
	const errors: Record< string, any > = {
		jetpack: Wizard.useWizardDataPropError( 'newspack/settings', 'connections/plugins/jetpack' ),
		'google-site-kit': Wizard.useWizardDataPropError(
			'newspack/settings',
			'connections/plugins/google-site-kit'
		),
	};

	const pluginsArray = Object.keys( PLUGINS );
	useEffect( () => {
		pluginsArray.forEach( async ( pluginKey: string ) => {
			const plugin = PLUGINS[ pluginKey ];
			const update = await plugin.fetchStatus( wizardApiFetch ).catch( ( err: Error ) => {
				setDataPropError( {
					slug: 'newspack/settings',
					prop: `connections/plugins/${ pluginKey }`,
					value: err.message,
				} );
			} );
			setPlugins( update );
		} );
	}, [] );

	return (
		<>
			{ pluginsArray.map( pluginKey => {
				const isInactive = plugins[ pluginKey ].status === 'inactive';
				const isLoading = ! plugins[ pluginKey ].status;
				const isError = '' !== errors[ pluginKey ];

				const plugin = PLUGINS[ pluginKey ];

				const getDescription = () => {
					if ( isError ) {
						return __( 'Error', 'newspack-plugin' );
					}
					if ( isLoading ) {
						return __( 'Loading…', 'newspack-plugin' );
					}
					if ( isInactive ) {
						if ( plugin.pluginSlug === 'google-site-kit' ) {
							return __( 'Not connected for this user', 'newspack-plugin' );
						}
						return __( 'Not connected', 'newspack-plugin' );
					}
					return __( 'Connected', 'newspack-plugin' );
				};
				return (
					<ActionCard
						key={ pluginKey }
						title={ plugin.name }
						description={ `${ __( 'Status:', 'newspack-plugin' ) } ${ getDescription() }` }
						actionText={ isInactive ? pluginConnectButton( plugin ) : null }
						checkbox={ isInactive || isLoading ? 'unchecked' : 'checked' }
						badge={ plugin.badge }
						indent={ plugin.indent }
						notification={ errors[ pluginKey ] }
						notificationLevel="error"
						isMedium
					/>
				);
			} ) }
		</>
	);
};

export default Plugins;
